import { Injectable, Logger } from '@nestjs/common';
import { nanoid } from 'nanoid';

import {
  Agent,
  AgentAction,
  AgentCapability,
  AgentContext,
  AgentGoal,
  AgentKnowledge,
  AgentPlan,
} from './types';

/**
 * Hierarchical Task Network (HTN) planning for autonomous agents
 */
@Injectable()
export class AgentPlanningEngine {
  private readonly logger = new Logger(AgentPlanningEngine.name);

  /**
   * Generate a comprehensive plan for achieving a goal
   */
  async generatePlan(
    goal: AgentGoal,
    agent: Agent,
    context: AgentContext
  ): Promise<AgentPlan> {
    this.logger.log(`Generating plan for goal: ${goal.description}`);

    // Decompose goal into subgoals if complex
    const subgoals = await this.decomposeGoal(goal, agent);

    // Generate actions for each subgoal
    const actions: AgentAction[] = [];
    let totalRisk = 0;
    let totalDuration = 0;

    for (const subgoal of subgoals) {
      const subActions = await this.generateActionsForGoal(
        subgoal,
        agent,
        context
      );
      actions.push(...subActions);

      // Estimate risk and duration
      const subRisk = this.assessRisk(subActions, context);
      const subDuration = this.estimateDuration(subActions);

      totalRisk = Math.max(totalRisk, subRisk); // Use max risk
      totalDuration += subDuration;
    }

    // Optimize action sequence
    const optimizedActions = await this.optimizeActionSequence(
      actions,
      context
    );

    // Generate alternative plans
    const alternatives = await this.generateAlternativePlans(
      goal,
      agent,
      context
    );

    const plan: AgentPlan = {
      id: nanoid(),
      goal_id: goal.id,
      actions: optimizedActions,
      estimated_duration: totalDuration,
      risk_assessment: totalRisk,
      alternatives,
      status: 'draft',
    };

    this.logger.log(`Generated plan with ${plan.actions.length} actions`);
    return plan;
  }

  /**
   * Decompose a complex goal into manageable subgoals
   */
  private async decomposeGoal(
    goal: AgentGoal,
    agent: Agent
  ): Promise<AgentGoal[]> {
    // Simple decomposition based on keywords and complexity
    const complexity = this.assessGoalComplexity(goal);

    if (complexity <= 3 || !goal.subgoals || goal.subgoals.length === 0) {
      return [goal]; // Simple goal, no decomposition needed
    }

    // Use predefined subgoals or generate them
    if (goal.subgoals && goal.subgoals.length > 0) {
      return goal.subgoals;
    }

    // Auto-generate subgoals based on goal description
    const subgoals = await this.autoGenerateSubgoals(goal, agent);
    return subgoals;
  }

  /**
   * Generate actions to achieve a specific goal
   */
  private async generateActionsForGoal(
    goal: AgentGoal,
    agent: Agent,
    context: AgentContext
  ): Promise<AgentAction[]> {
    const actions: AgentAction[] = [];

    // Find relevant capabilities
    const relevantCapabilities = this.findRelevantCapabilities(
      goal,
      agent.capabilities
    );

    // Generate actions based on goal type and requirements
    for (const capability of relevantCapabilities) {
      const action = await this.createActionFromCapability(
        capability,
        goal,
        context
      );
      if (action) {
        actions.push(action);
      }
    }

    // Add prerequisite actions if needed
    const prerequisites = await this.identifyPrerequisites(actions, context);
    actions.unshift(...prerequisites);

    return actions;
  }

  /**
   * Find capabilities relevant to achieving a goal
   */
  private findRelevantCapabilities(
    goal: AgentGoal,
    capabilities: AgentCapability[]
  ): AgentCapability[] {
    const goalKeywords = this.extractKeywords(goal.description.toLowerCase());

    return capabilities
      .filter(capability => {
        const capabilityKeywords = this.extractKeywords(
          `${capability.name} ${capability.description}`.toLowerCase()
        );

        // Check for keyword overlap
        const overlap = goalKeywords.filter(keyword =>
          capabilityKeywords.some(capKeyword => capKeyword.includes(keyword))
        );

        return overlap.length > 0;
      })
      .sort((a, b) => {
        // Sort by relevance (simplified scoring)
        const aScore = this.calculateRelevanceScore(a, goal);
        const bScore = this.calculateRelevanceScore(b, goal);
        return bScore - aScore;
      });
  }

  /**
   * Create an action from a capability for a specific goal
   */
  private async createActionFromCapability(
    capability: AgentCapability,
    goal: AgentGoal,
    context: AgentContext
  ): Promise<AgentAction | null> {
    // Check if capability is applicable given constraints
    if (!this.isCapabilityApplicable(capability, context)) {
      return null;
    }

    const action: AgentAction = {
      id: nanoid(),
      type: capability.name,
      description: `Use ${capability.description} to achieve: ${goal.description}`,
      parameters: {
        ...capability.parameters,
        goal_id: goal.id,
        goal_context: goal.description,
      },
      expectedOutcome: this.predictOutcome(capability, goal),
      preconditions: this.identifyPreconditions(capability, context),
      timestamp: new Date(),
    };

    return action;
  }

  /**
   * Optimize the sequence of actions for efficiency and safety
   */
  private async optimizeActionSequence(
    actions: AgentAction[],
    context: AgentContext
  ): Promise<AgentAction[]> {
    // Simple optimization: sort by dependencies and risk
    const optimized = [...actions];

    // Sort by preconditions (actions with fewer preconditions first)
    optimized.sort((a, b) => {
      const aPreconditions = a.preconditions?.length || 0;
      const bPreconditions = b.preconditions?.length || 0;
      return aPreconditions - bPreconditions;
    });

    // Ensure prerequisite actions come before dependent actions
    const sorted: AgentAction[] = [];
    const processed = new Set<string>();

    for (const action of optimized) {
      await this.addActionWithDependencies(
        action,
        sorted,
        processed,
        optimized
      );
    }

    return sorted;
  }

  /**
   * Generate alternative plans for redundancy
   */
  private async generateAlternativePlans(
    goal: AgentGoal,
    agent: Agent,
    context: AgentContext
  ): Promise<AgentPlan[]> {
    const alternatives: AgentPlan[] = [];

    // Generate a simpler, lower-risk alternative
    const simpleAlternative = await this.generateSimplePlan(
      goal,
      agent,
      context
    );
    if (simpleAlternative) {
      alternatives.push(simpleAlternative);
    }

    // Generate a more comprehensive alternative if resources allow
    const comprehensiveAlternative = await this.generateComprehensivePlan(
      goal,
      agent,
      context
    );
    if (comprehensiveAlternative) {
      alternatives.push(comprehensiveAlternative);
    }

    return alternatives;
  }

  /**
   * Assess the complexity of a goal
   */
  private assessGoalComplexity(goal: AgentGoal): number {
    let complexity = 1;

    // Based on description length and keywords
    const description = goal.description.toLowerCase();
    complexity += Math.floor(description.length / 50);

    // Check for complex keywords
    const complexKeywords = [
      'analyze',
      'integrate',
      'coordinate',
      'optimize',
      'synthesize',
      'multiple',
      'complex',
      'comprehensive',
      'advanced',
      'strategic',
    ];

    complexity += complexKeywords.filter(keyword =>
      description.includes(keyword)
    ).length;

    // Consider subgoals
    if (goal.subgoals && goal.subgoals.length > 0) {
      complexity += goal.subgoals.length;
    }

    return Math.min(complexity, 10); // Cap at 10
  }

  /**
   * Auto-generate subgoals based on goal analysis
   */
  private async autoGenerateSubgoals(
    goal: AgentGoal,
    agent: Agent
  ): Promise<AgentGoal[]> {
    const subgoals: AgentGoal[] = [];

    // Simple rule-based subgoal generation
    const description = goal.description.toLowerCase();

    if (description.includes('research') || description.includes('analyze')) {
      subgoals.push({
        id: nanoid(),
        description: 'Gather relevant information',
        priority: goal.priority,
        success_criteria: ['Information collected and organized'],
        progress: 0,
        status: 'pending',
      });

      subgoals.push({
        id: nanoid(),
        description: 'Analyze collected information',
        priority: goal.priority,
        success_criteria: ['Analysis completed with insights'],
        progress: 0,
        status: 'pending',
      });
    }

    if (description.includes('create') || description.includes('build')) {
      subgoals.push({
        id: nanoid(),
        description: 'Plan creation process',
        priority: goal.priority,
        success_criteria: ['Creation plan established'],
        progress: 0,
        status: 'pending',
      });

      subgoals.push({
        id: nanoid(),
        description: 'Execute creation',
        priority: goal.priority,
        success_criteria: ['Item created successfully'],
        progress: 0,
        status: 'pending',
      });
    }

    // If no specific subgoals generated, create a generic breakdown
    if (subgoals.length === 0) {
      subgoals.push({
        id: nanoid(),
        description: `Prepare for: ${goal.description}`,
        priority: goal.priority,
        success_criteria: ['Preparation completed'],
        progress: 0,
        status: 'pending',
      });

      subgoals.push({
        id: nanoid(),
        description: `Execute: ${goal.description}`,
        priority: goal.priority,
        success_criteria: goal.success_criteria,
        progress: 0,
        status: 'pending',
      });
    }

    return subgoals;
  }

  /**
   * Assess risk level of a set of actions
   */
  private assessRisk(actions: AgentAction[], context: AgentContext): number {
    let risk = 0;

    for (const action of actions) {
      // Base risk per action
      risk += 0.1;

      // Higher risk for actions that modify external systems
      if (
        action.type.includes('write') ||
        action.type.includes('delete') ||
        action.type.includes('modify')
      ) {
        risk += 0.3;
      }

      // Higher risk for actions with many parameters
      const paramCount = Object.keys(action.parameters).length;
      risk += paramCount * 0.05;

      // Check against constraints
      for (const constraint of context.constraints) {
        if (!constraint.rule(action, context)) {
          risk += 0.5; // High risk if constraints are violated
        }
      }
    }

    return Math.min(risk, 1.0); // Normalized to 0-1 scale
  }

  /**
   * Estimate duration for a set of actions
   */
  private estimateDuration(actions: AgentAction[]): number {
    let duration = 0;

    for (const action of actions) {
      // Base duration per action (in milliseconds)
      duration += 5000; // 5 seconds base

      // Adjust based on action complexity
      const paramCount = Object.keys(action.parameters).length;
      duration += paramCount * 1000; // 1 second per parameter

      // Adjust based on action type
      if (action.type.includes('analyze') || action.type.includes('process')) {
        duration += 10000; // 10 seconds for analysis
      }

      if (action.type.includes('create') || action.type.includes('generate')) {
        duration += 15000; // 15 seconds for creation
      }
    }

    return duration;
  }

  /**
   * Helper methods
   */
  private extractKeywords(text: string): string[] {
    return text
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(
        word =>
          !['the', 'and', 'for', 'with', 'from', 'that', 'this'].includes(word)
      );
  }

  private calculateRelevanceScore(
    capability: AgentCapability,
    goal: AgentGoal
  ): number {
    const goalText = goal.description.toLowerCase();
    const capabilityText =
      `${capability.name} ${capability.description}`.toLowerCase();

    const goalKeywords = this.extractKeywords(goalText);
    const capabilityKeywords = this.extractKeywords(capabilityText);

    let score = 0;

    for (const goalKeyword of goalKeywords) {
      for (const capKeyword of capabilityKeywords) {
        if (
          capKeyword.includes(goalKeyword) ||
          goalKeyword.includes(capKeyword)
        ) {
          score += 1;
        }
      }
    }

    return score;
  }

  private isCapabilityApplicable(
    capability: AgentCapability,
    context: AgentContext
  ): boolean {
    // Check if capability requirements are met by available resources
    const requiredResources = capability.parameters?.required_resources || [];

    for (const required of requiredResources) {
      const available = context.resources.find(r => r.name === required);
      if (!available) {
        return false;
      }
    }

    return true;
  }

  private predictOutcome(capability: AgentCapability, goal: AgentGoal): string {
    return `Expected to contribute to achieving: ${goal.description} using ${capability.name}`;
  }

  private identifyPreconditions(
    capability: AgentCapability,
    context: AgentContext
  ): string[] {
    const preconditions: string[] = [];

    // Add resource requirements as preconditions
    const requiredResources = capability.parameters?.required_resources || [];
    for (const resource of requiredResources) {
      preconditions.push(`Resource ${resource} must be available`);
    }

    // Add capability-specific preconditions
    if (capability.parameters?.preconditions) {
      preconditions.push(...capability.parameters.preconditions);
    }

    return preconditions;
  }

  private identifyPrerequisites(
    actions: AgentAction[],
    context: AgentContext
  ): AgentAction[] {
    const prerequisites: AgentAction[] = [];

    // Simple rule: if any action requires authentication, add auth action first
    const needsAuth = actions.some(
      action => action.parameters.requires_auth === true
    );

    if (needsAuth) {
      prerequisites.push({
        id: nanoid(),
        type: 'authenticate',
        description: 'Authenticate with required services',
        parameters: { context: context.userId },
        timestamp: new Date(),
      });
    }

    return prerequisites;
  }

  private async addActionWithDependencies(
    action: AgentAction,
    sorted: AgentAction[],
    processed: Set<string>,
    allActions: AgentAction[]
  ): Promise<void> {
    if (processed.has(action.id)) {
      return;
    }

    // Add dependencies first
    if (action.preconditions) {
      for (const precondition of action.preconditions) {
        const dependency = allActions.find(
          a =>
            a.expectedOutcome?.includes(precondition) ||
            a.description.includes(precondition)
        );

        if (dependency && !processed.has(dependency.id)) {
          await this.addActionWithDependencies(
            dependency,
            sorted,
            processed,
            allActions
          );
        }
      }
    }

    sorted.push(action);
    processed.add(action.id);
  }

  private async generateSimplePlan(
    goal: AgentGoal,
    agent: Agent,
    context: AgentContext
  ): Promise<AgentPlan | null> {
    // Generate a minimal plan with basic actions only
    const basicCapabilities = agent.capabilities.slice(0, 2); // Use first 2 capabilities
    const actions: AgentAction[] = [];

    for (const capability of basicCapabilities) {
      const action = await this.createActionFromCapability(
        capability,
        goal,
        context
      );
      if (action) {
        actions.push(action);
      }
    }

    if (actions.length === 0) {
      return null;
    }

    return {
      id: nanoid(),
      goal_id: goal.id,
      actions,
      estimated_duration: this.estimateDuration(actions),
      risk_assessment: this.assessRisk(actions, context) * 0.7, // Lower risk
      status: 'draft',
    };
  }

  private async generateComprehensivePlan(
    goal: AgentGoal,
    agent: Agent,
    context: AgentContext
  ): Promise<AgentPlan | null> {
    // Generate a comprehensive plan using all relevant capabilities
    const actions: AgentAction[] = [];

    // Add preparation actions
    actions.push({
      id: nanoid(),
      type: 'prepare',
      description: `Prepare comprehensive approach for: ${goal.description}`,
      parameters: { goal_id: goal.id },
      timestamp: new Date(),
    });

    // Add all relevant capability actions
    const relevantCapabilities = this.findRelevantCapabilities(
      goal,
      agent.capabilities
    );
    for (const capability of relevantCapabilities) {
      const action = await this.createActionFromCapability(
        capability,
        goal,
        context
      );
      if (action) {
        actions.push(action);
      }
    }

    // Add validation actions
    actions.push({
      id: nanoid(),
      type: 'validate',
      description: `Validate completion of: ${goal.description}`,
      parameters: {
        goal_id: goal.id,
        success_criteria: goal.success_criteria,
      },
      timestamp: new Date(),
    });

    return {
      id: nanoid(),
      goal_id: goal.id,
      actions,
      estimated_duration: this.estimateDuration(actions),
      risk_assessment: this.assessRisk(actions, context) * 1.2, // Higher risk
      status: 'draft',
    };
  }
}
