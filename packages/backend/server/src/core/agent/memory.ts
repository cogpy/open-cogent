import { Injectable, Logger } from '@nestjs/common';
import { nanoid } from 'nanoid';

import {
  AgentExperience,
  AgentKnowledge,
  AgentMemory,
  Agent,
  AgentContext,
} from './types';

/**
 * Advanced memory management system for autonomous agents
 */
@Injectable()
export class AgentMemoryManager {
  private readonly logger = new Logger(AgentMemoryManager.name);

  // Memory storage by agent ID
  private agentMemories = new Map<string, AgentMemory>();

  // Global knowledge base shared across agents
  private globalKnowledge = new Map<string, AgentKnowledge>();

  // Memory statistics
  private memoryStats = new Map<string, Record<string, number>>();

  /**
   * Initialize memory for an agent
   */
  initializeMemory(agentId: string, config?: any): AgentMemory {
    this.logger.log(`Initializing memory for agent: ${agentId}`);

    const memory: AgentMemory = {
      short_term: {},
      long_term: [],
      episodic: [],
      working_memory: [],
    };

    this.agentMemories.set(agentId, memory);
    this.memoryStats.set(agentId, {
      knowledge_count: 0,
      experience_count: 0,
      working_memory_size: 0,
      last_cleanup: Date.now(),
    });

    return memory;
  }

  /**
   * Store knowledge in long-term memory
   */
  async storeKnowledge(
    agentId: string,
    knowledge: AgentKnowledge
  ): Promise<void> {
    const memory = this.getAgentMemory(agentId);

    // Check for duplicates and merge if similar knowledge exists
    const existingKnowledge = await this.findSimilarKnowledge(
      agentId,
      knowledge
    );

    if (existingKnowledge) {
      await this.mergeKnowledge(agentId, existingKnowledge, knowledge);
    } else {
      memory.long_term.push(knowledge);
      this.updateMemoryStats(agentId, 'knowledge_count', 1);
    }

    // Maintain memory size limits
    await this.maintainMemoryLimits(agentId);

    this.logger.debug(
      `Stored knowledge: ${knowledge.type} for agent: ${agentId}`
    );
  }

  /**
   * Retrieve knowledge based on query
   */
  async retrieveKnowledge(
    agentId: string,
    query: any
  ): Promise<AgentKnowledge[]> {
    const memory = this.getAgentMemory(agentId);

    // Parse query
    const searchTerms = this.parseQuery(query);

    // Search in agent's long-term memory
    let results = this.searchKnowledge(memory.long_term, searchTerms);

    // Also search in global knowledge if enabled
    if (searchTerms.include_global) {
      const globalResults = this.searchKnowledge(
        Array.from(this.globalKnowledge.values()),
        searchTerms
      );
      results = [...results, ...globalResults];
    }

    // Sort by relevance and confidence
    results.sort((a, b) => {
      const aScore =
        this.calculateRelevanceScore(a, searchTerms) * a.confidence;
      const bScore =
        this.calculateRelevanceScore(b, searchTerms) * b.confidence;
      return bScore - aScore;
    });

    this.logger.debug(
      `Retrieved ${results.length} knowledge items for agent: ${agentId}`
    );

    return results.slice(0, searchTerms.limit || 10);
  }

  /**
   * Store experience in episodic memory
   */
  async storeExperience(
    agentId: string,
    experience: AgentExperience
  ): Promise<void> {
    const memory = this.getAgentMemory(agentId);

    memory.episodic.push(experience);
    this.updateMemoryStats(agentId, 'experience_count', 1);

    // Extract learnings from experience
    if (experience.success) {
      await this.extractKnowledgeFromExperience(agentId, experience);
    } else {
      await this.extractLessonsFromFailure(agentId, experience);
    }

    // Maintain episodic memory size
    const maxEpisodes = 1000; // Configurable limit
    if (memory.episodic.length > maxEpisodes) {
      memory.episodic = memory.episodic.slice(-maxEpisodes);
    }

    this.logger.debug(`Stored experience for agent: ${agentId}`);
  }

  /**
   * Update working memory
   */
  updateWorkingMemory(agentId: string, items: any[]): void {
    const memory = this.getAgentMemory(agentId);

    // Add new items to working memory
    memory.working_memory.unshift(...items);

    // Maintain working memory size (keep most recent items)
    const maxWorkingMemory = 20;
    if (memory.working_memory.length > maxWorkingMemory) {
      memory.working_memory = memory.working_memory.slice(0, maxWorkingMemory);
    }

    this.updateMemoryStats(
      agentId,
      'working_memory_size',
      memory.working_memory.length
    );
  }

  /**
   * Update short-term memory
   */
  updateShortTermMemory(agentId: string, key: string, value: any): void {
    const memory = this.getAgentMemory(agentId);
    memory.short_term[key] = value;

    // Add timestamp for automatic cleanup
    memory.short_term[`${key}_timestamp`] = Date.now();
  }

  /**
   * Forget knowledge based on criteria
   */
  async forgetKnowledge(agentId: string, criteria: any): Promise<number> {
    const memory = this.getAgentMemory(agentId);
    const initialCount = memory.long_term.length;

    // Apply forgetting criteria
    memory.long_term = memory.long_term.filter(knowledge => {
      if (
        criteria.confidence_threshold &&
        knowledge.confidence < criteria.confidence_threshold
      ) {
        return false;
      }

      if (criteria.age_threshold) {
        const age = Date.now() - knowledge.timestamp.getTime();
        if (age > criteria.age_threshold) {
          return false;
        }
      }

      if (criteria.tags && criteria.tags.length > 0) {
        const hasMatchingTag = knowledge.tags.some(tag =>
          criteria.tags.includes(tag)
        );
        if (criteria.exclude_tags && hasMatchingTag) {
          return false;
        }
        if (criteria.include_only_tags && !hasMatchingTag) {
          return false;
        }
      }

      return true;
    });

    const forgottenCount = initialCount - memory.long_term.length;
    this.updateMemoryStats(agentId, 'knowledge_count', -forgottenCount);

    this.logger.log(
      `Forgot ${forgottenCount} knowledge items for agent: ${agentId}`
    );

    return forgottenCount;
  }

  /**
   * Consolidate memories (move important short-term to long-term)
   */
  async consolidateMemories(agentId: string): Promise<void> {
    const memory = this.getAgentMemory(agentId);

    // Find important items in short-term memory
    const importantItems = Object.entries(memory.short_term)
      .filter(([key, value]) => !key.endsWith('_timestamp'))
      .filter(([key, value]) => this.isImportantMemory(key, value))
      .map(([key, value]) => ({
        id: nanoid(),
        type: 'fact' as const,
        content: { [key]: value },
        confidence: 0.7,
        source: 'short_term_consolidation',
        timestamp: new Date(),
        tags: ['consolidated', key],
      }));

    // Move to long-term memory
    for (const knowledge of importantItems) {
      await this.storeKnowledge(agentId, knowledge);
    }

    // Clean up old short-term memories
    const now = Date.now();
    const shortTermRetention = 24 * 60 * 60 * 1000; // 24 hours

    for (const key of Object.keys(memory.short_term)) {
      const timestampKey = `${key}_timestamp`;
      const timestamp = memory.short_term[timestampKey];

      if (timestamp && now - timestamp > shortTermRetention) {
        delete memory.short_term[key];
        delete memory.short_term[timestampKey];
      }
    }

    this.logger.debug(
      `Consolidated ${importantItems.length} memories for agent: ${agentId}`
    );
  }

  /**
   * Share knowledge globally across agents
   */
  async shareKnowledge(agentId: string, knowledgeId: string): Promise<void> {
    const memory = this.getAgentMemory(agentId);
    const knowledge = memory.long_term.find(k => k.id === knowledgeId);

    if (!knowledge) {
      throw new Error(`Knowledge not found: ${knowledgeId}`);
    }

    // Create global knowledge entry
    const globalKnowledge: AgentKnowledge = {
      ...knowledge,
      id: nanoid(),
      source: `shared_from_${agentId}`,
      tags: [...knowledge.tags, 'shared', 'global'],
    };

    this.globalKnowledge.set(globalKnowledge.id, globalKnowledge);

    this.logger.log(`Shared knowledge globally from agent: ${agentId}`);
  }

  /**
   * Get memory statistics for an agent
   */
  getMemoryStats(agentId: string): Record<string, any> {
    const stats = this.memoryStats.get(agentId) || {};
    const memory = this.getAgentMemory(agentId);

    return {
      ...stats,
      short_term_size: Object.keys(memory.short_term).length,
      long_term_size: memory.long_term.length,
      episodic_size: memory.episodic.length,
      working_memory_size: memory.working_memory.length,
      memory_efficiency: this.calculateMemoryEfficiency(agentId),
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Optimize memory usage
   */
  async optimizeMemory(agentId: string): Promise<void> {
    this.logger.log(`Optimizing memory for agent: ${agentId}`);

    // Consolidate memories
    await this.consolidateMemories(agentId);

    // Remove low-confidence knowledge
    await this.forgetKnowledge(agentId, { confidence_threshold: 0.3 });

    // Remove old episodic memories
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    const memory = this.getAgentMemory(agentId);
    const cutoff = new Date(Date.now() - oneMonth);

    memory.episodic = memory.episodic.filter(exp => exp.timestamp >= cutoff);

    // Update stats
    this.memoryStats.get(agentId)!.last_cleanup = Date.now();

    this.logger.log(`Memory optimization completed for agent: ${agentId}`);
  }

  /**
   * Export agent memory for backup or analysis
   */
  exportMemory(agentId: string): any {
    const memory = this.getAgentMemory(agentId);
    const stats = this.getMemoryStats(agentId);

    return {
      agent_id: agentId,
      memory,
      stats,
      exported_at: new Date().toISOString(),
    };
  }

  /**
   * Import agent memory from backup
   */
  importMemory(agentId: string, memoryData: any): void {
    if (memoryData.memory) {
      this.agentMemories.set(agentId, memoryData.memory);
    }

    if (memoryData.stats) {
      this.memoryStats.set(agentId, memoryData.stats);
    }

    this.logger.log(`Imported memory for agent: ${agentId}`);
  }

  /**
   * Private helper methods
   */
  private getAgentMemory(agentId: string): AgentMemory {
    const memory = this.agentMemories.get(agentId);
    if (!memory) {
      throw new Error(`Memory not initialized for agent: ${agentId}`);
    }
    return memory;
  }

  private parseQuery(query: any): any {
    if (typeof query === 'string') {
      return {
        keywords: [query],
        limit: 10,
        include_global: true,
      };
    }

    return {
      keywords: query.keywords || [],
      tags: query.tags || [],
      type: query.type,
      limit: query.limit || 10,
      include_global: query.include_global !== false,
      min_confidence: query.min_confidence || 0,
    };
  }

  private searchKnowledge(
    knowledgeArray: AgentKnowledge[],
    searchTerms: any
  ): AgentKnowledge[] {
    return knowledgeArray.filter(knowledge => {
      // Type filter
      if (searchTerms.type && knowledge.type !== searchTerms.type) {
        return false;
      }

      // Confidence filter
      if (knowledge.confidence < searchTerms.min_confidence) {
        return false;
      }

      // Tag filter
      if (searchTerms.tags && searchTerms.tags.length > 0) {
        const hasMatchingTag = knowledge.tags.some(tag =>
          searchTerms.tags.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Keyword search
      if (searchTerms.keywords && searchTerms.keywords.length > 0) {
        const contentStr = JSON.stringify(knowledge.content).toLowerCase();
        const tagsStr = knowledge.tags.join(' ').toLowerCase();

        const hasMatchingKeyword = searchTerms.keywords.some(
          (keyword: string) =>
            contentStr.includes(keyword.toLowerCase()) ||
            tagsStr.includes(keyword.toLowerCase())
        );

        if (!hasMatchingKeyword) {
          return false;
        }
      }

      return true;
    });
  }

  private calculateRelevanceScore(
    knowledge: AgentKnowledge,
    searchTerms: any
  ): number {
    let score = 0;

    // Base score from confidence
    score += knowledge.confidence;

    // Keyword matching bonus
    if (searchTerms.keywords) {
      const contentStr = JSON.stringify(knowledge.content).toLowerCase();
      for (const keyword of searchTerms.keywords) {
        if (contentStr.includes(keyword.toLowerCase())) {
          score += 0.5;
        }
      }
    }

    // Tag matching bonus
    if (searchTerms.tags) {
      const matchingTags = knowledge.tags.filter(tag =>
        searchTerms.tags.includes(tag)
      ).length;
      score += matchingTags * 0.3;
    }

    // Recency bonus
    const age = Date.now() - knowledge.timestamp.getTime();
    const daysSinceCreation = age / (24 * 60 * 60 * 1000);
    score += Math.max(0, (30 - daysSinceCreation) / 30) * 0.2;

    return score;
  }

  private async findSimilarKnowledge(
    agentId: string,
    knowledge: AgentKnowledge
  ): Promise<AgentKnowledge | null> {
    const memory = this.getAgentMemory(agentId);

    // Simple similarity check based on type and content
    for (const existing of memory.long_term) {
      if (existing.type === knowledge.type) {
        const similarity = this.calculateContentSimilarity(
          existing.content,
          knowledge.content
        );
        if (similarity > 0.8) {
          return existing;
        }
      }
    }

    return null;
  }

  private calculateContentSimilarity(content1: any, content2: any): number {
    const str1 = JSON.stringify(content1);
    const str2 = JSON.stringify(content2);

    // Simple string similarity
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;

    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private async mergeKnowledge(
    agentId: string,
    existing: AgentKnowledge,
    newKnowledge: AgentKnowledge
  ): Promise<void> {
    // Merge content and increase confidence
    existing.content = { ...existing.content, ...newKnowledge.content };
    existing.confidence = Math.min(1.0, existing.confidence + 0.1);
    existing.tags = [...new Set([...existing.tags, ...newKnowledge.tags])];
    existing.timestamp = new Date();

    this.logger.debug(`Merged knowledge for agent: ${agentId}`);
  }

  private async extractKnowledgeFromExperience(
    agentId: string,
    experience: AgentExperience
  ): Promise<void> {
    // Extract procedural knowledge from successful experience
    const knowledge: AgentKnowledge = {
      id: nanoid(),
      type: 'procedure',
      content: {
        action_type: experience.action.type,
        context: experience.context,
        outcome: experience.outcome,
        success_pattern: 'successful_execution',
      },
      confidence: 0.8,
      source: `experience_${experience.id}`,
      timestamp: new Date(),
      tags: ['learned', 'procedure', experience.action.type],
    };

    await this.storeKnowledge(agentId, knowledge);
  }

  private async extractLessonsFromFailure(
    agentId: string,
    experience: AgentExperience
  ): Promise<void> {
    // Extract lessons learned from failure
    if (experience.lessons_learned && experience.lessons_learned.length > 0) {
      for (const lesson of experience.lessons_learned) {
        const knowledge: AgentKnowledge = {
          id: nanoid(),
          type: 'rule',
          content: {
            lesson,
            failed_action: experience.action,
            context: experience.context,
          },
          confidence: 0.9, // High confidence in failure lessons
          source: `failure_${experience.id}`,
          timestamp: new Date(),
          tags: ['lesson', 'failure', 'avoid', experience.action.type],
        };

        await this.storeKnowledge(agentId, knowledge);
      }
    }
  }

  private isImportantMemory(key: string, value: any): boolean {
    // Determine if a short-term memory item should be consolidated
    const importantKeys = [
      'user_preference',
      'learned_pattern',
      'successful_strategy',
    ];

    return (
      importantKeys.some(pattern => key.includes(pattern)) ||
      (typeof value === 'object' && value.importance === 'high')
    );
  }

  private async maintainMemoryLimits(agentId: string): Promise<void> {
    const memory = this.getAgentMemory(agentId);
    const maxLongTermMemory = 10000; // Configurable limit

    if (memory.long_term.length > maxLongTermMemory) {
      // Sort by confidence and recency, keep the best items
      memory.long_term.sort((a, b) => {
        const aScore =
          a.confidence *
          (1 +
            (Date.now() - a.timestamp.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const bScore =
          b.confidence *
          (1 +
            (Date.now() - b.timestamp.getTime()) / (7 * 24 * 60 * 60 * 1000));
        return bScore - aScore;
      });

      memory.long_term = memory.long_term.slice(0, maxLongTermMemory);
    }
  }

  private updateMemoryStats(
    agentId: string,
    metric: string,
    delta: number
  ): void {
    const stats = this.memoryStats.get(agentId);
    if (stats) {
      stats[metric] = (stats[metric] || 0) + delta;
    }
  }

  private calculateMemoryEfficiency(agentId: string): number {
    const memory = this.getAgentMemory(agentId);

    // Calculate efficiency based on knowledge quality and usage
    const totalKnowledge = memory.long_term.length;
    if (totalKnowledge === 0) return 1;

    const highConfidenceKnowledge = memory.long_term.filter(
      k => k.confidence > 0.7
    ).length;
    const recentKnowledge = memory.long_term.filter(
      k => Date.now() - k.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
    ).length;

    const qualityRatio = highConfidenceKnowledge / totalKnowledge;
    const freshnessRatio = recentKnowledge / totalKnowledge;

    return (qualityRatio + freshnessRatio) / 2;
  }
}
