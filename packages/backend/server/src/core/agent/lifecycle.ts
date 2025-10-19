import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import { nanoid } from 'nanoid';

import { Agent, AgentConfig, AgentContext, AgentStatus } from './types';
import { AutonomousAgent } from './agent.service';

/**
 * Manages the lifecycle of autonomous agents
 */
@Injectable()
export class AgentLifecycleManager extends EventEmitter2 {
  private readonly logger = new Logger(AgentLifecycleManager.name);
  private agents = new Map<string, Agent>();
  private agentConfigs = new Map<string, AgentConfig>();

  constructor() {
    super({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      maxListeners: 50,
    });
  }

  /**
   * Create a new agent instance
   */
  async createAgent(config: AgentConfig): Promise<Agent> {
    this.logger.log(`Creating agent: ${config.name} of type: ${config.type}`);

    // Validate configuration
    this.validateConfig(config);

    // Create agent instance
    const agent = new AutonomousAgent(config);

    // Store references
    this.agents.set(agent.id, agent);
    this.agentConfigs.set(agent.id, config);

    // Set up event listeners
    this.setupAgentEventListeners(agent);

    this.emit('agent.created', { agentId: agent.id, config });
    this.logger.log(`Agent created successfully: ${agent.id}`);

    return agent;
  }

  /**
   * Initialize and start an agent
   */
  async initializeAgent(agentId: string, context: AgentContext): Promise<void> {
    const agent = this.getAgent(agentId);

    this.logger.log(`Initializing agent: ${agentId}`);
    await agent.initialize(context);

    this.emit('agent.initialized', { agentId, context });
  }

  /**
   * Start an agent's autonomous execution
   */
  async startAgent(agentId: string): Promise<void> {
    const agent = this.getAgent(agentId);

    if (agent.status !== AgentStatus.IDLE) {
      throw new Error(
        `Agent ${agentId} must be in IDLE status to start, current: ${agent.status}`
      );
    }

    this.logger.log(`Starting agent: ${agentId}`);
    await agent.start();

    this.emit('agent.started', { agentId });
  }

  /**
   * Pause an agent's execution
   */
  async pauseAgent(agentId: string): Promise<void> {
    const agent = this.getAgent(agentId);

    this.logger.log(`Pausing agent: ${agentId}`);
    await agent.pause();

    this.emit('agent.paused', { agentId });
  }

  /**
   * Resume a paused agent
   */
  async resumeAgent(agentId: string): Promise<void> {
    const agent = this.getAgent(agentId);

    if (agent.status !== AgentStatus.PAUSED) {
      throw new Error(
        `Agent ${agentId} must be paused to resume, current: ${agent.status}`
      );
    }

    this.logger.log(`Resuming agent: ${agentId}`);
    await agent.resume();

    this.emit('agent.resumed', { agentId });
  }

  /**
   * Stop and terminate an agent
   */
  async terminateAgent(agentId: string): Promise<void> {
    const agent = this.getAgent(agentId);

    this.logger.log(`Terminating agent: ${agentId}`);
    await agent.terminate();

    // Clean up references
    this.agents.delete(agentId);
    this.agentConfigs.delete(agentId);

    this.emit('agent.terminated', { agentId });
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): Agent {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    return agent;
  }

  /**
   * List all agents
   */
  listAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by status
   */
  getAgentsByStatus(status: AgentStatus): Agent[] {
    return this.listAgents().filter(agent => agent.status === status);
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type: string): Agent[] {
    return this.listAgents().filter(agent => agent.type === type);
  }

  /**
   * Get agent configuration
   */
  getAgentConfig(agentId: string): AgentConfig {
    const config = this.agentConfigs.get(agentId);
    if (!config) {
      throw new Error(`Agent config not found: ${agentId}`);
    }
    return config;
  }

  /**
   * Update agent configuration (requires restart)
   */
  async updateAgentConfig(
    agentId: string,
    config: Partial<AgentConfig>
  ): Promise<void> {
    const currentConfig = this.getAgentConfig(agentId);
    const newConfig = { ...currentConfig, ...config };

    this.validateConfig(newConfig);
    this.agentConfigs.set(agentId, newConfig);

    this.emit('agent.config_updated', { agentId, config: newConfig });
  }

  /**
   * Get system-wide agent statistics
   */
  getSystemStats(): Record<string, any> {
    const agents = this.listAgents();
    const statusCounts = agents.reduce(
      (acc, agent) => {
        acc[agent.status] = (acc[agent.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const typeCounts = agents.reduce(
      (acc, agent) => {
        acc[agent.type] = (acc[agent.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total_agents: agents.length,
      status_distribution: statusCounts,
      type_distribution: typeCounts,
      active_agents: agents.filter(a =>
        [
          AgentStatus.EXECUTING,
          AgentStatus.PLANNING,
          AgentStatus.LEARNING,
        ].includes(a.status)
      ).length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Emergency stop all agents
   */
  async emergencyStop(): Promise<void> {
    this.logger.warn('Emergency stop initiated for all agents');

    const activeAgents = this.listAgents().filter(
      agent => agent.status !== AgentStatus.TERMINATED
    );

    await Promise.all(
      activeAgents.map(async agent => {
        try {
          await agent.terminate();
        } catch (error) {
          this.logger.error(`Failed to terminate agent ${agent.id}:`, error);
        }
      })
    );

    this.agents.clear();
    this.agentConfigs.clear();

    this.emit('system.emergency_stop', { stopped_count: activeAgents.length });
  }

  /**
   * Health check for all agents
   */
  async healthCheck(): Promise<Record<string, any>> {
    const agents = this.listAgents();
    const healthStatus: Record<string, any> = {};

    for (const agent of agents) {
      try {
        const metrics = agent.getMetrics();
        const status = agent.getStatus();

        healthStatus[agent.id] = {
          status,
          healthy: status !== AgentStatus.ERROR,
          metrics,
          last_check: new Date().toISOString(),
        };
      } catch (error) {
        healthStatus[agent.id] = {
          status: AgentStatus.ERROR,
          healthy: false,
          error: error.message,
          last_check: new Date().toISOString(),
        };
      }
    }

    return {
      overall_health: Object.values(healthStatus).every((h: any) => h.healthy),
      agent_count: agents.length,
      agents: healthStatus,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Restart an agent with the same configuration
   */
  async restartAgent(agentId: string): Promise<void> {
    const agent = this.getAgent(agentId);
    const config = this.getAgentConfig(agentId);
    const context = agent.context;

    this.logger.log(`Restarting agent: ${agentId}`);

    // Terminate current instance
    await this.terminateAgent(agentId);

    // Create new instance
    const newAgent = await this.createAgent(config);

    // Initialize with the same context
    if (context) {
      await this.initializeAgent(newAgent.id, context);
      await this.startAgent(newAgent.id);
    }

    this.emit('agent.restarted', {
      oldAgentId: agentId,
      newAgentId: newAgent.id,
    });
  }

  /**
   * Clone an agent with a new ID
   */
  async cloneAgent(agentId: string, newName?: string): Promise<Agent> {
    const config = this.getAgentConfig(agentId);
    const newConfig = {
      ...config,
      name: newName || `${config.name}-clone-${nanoid(8)}`,
    };

    const clonedAgent = await this.createAgent(newConfig);

    this.emit('agent.cloned', {
      sourceAgentId: agentId,
      clonedAgentId: clonedAgent.id,
    });

    return clonedAgent;
  }

  /**
   * Private helper methods
   */
  private validateConfig(config: AgentConfig): void {
    if (!config.name || config.name.trim().length === 0) {
      throw new Error('Agent name is required');
    }

    if (!config.type || config.type.trim().length === 0) {
      throw new Error('Agent type is required');
    }

    if (!config.capabilities || config.capabilities.length === 0) {
      throw new Error('Agent must have at least one capability');
    }

    // Validate constraints
    if (config.constraints) {
      for (const constraint of config.constraints) {
        if (!constraint.type || !constraint.description || !constraint.rule) {
          throw new Error('Invalid constraint configuration');
        }
      }
    }

    // Validate resources
    if (config.resources) {
      for (const resource of config.resources) {
        if (!resource.type || !resource.name || !resource.permissions) {
          throw new Error('Invalid resource configuration');
        }
      }
    }
  }

  private setupAgentEventListeners(agent: Agent): void {
    // Forward all agent events with agent ID context
    agent.onAny((event: string, data: any) => {
      this.emit(`agent.${event}`, { agentId: agent.id, ...data });
    });

    // Handle specific events
    agent.on('agent.error', (error: any) => {
      this.logger.error(`Agent ${agent.id} error:`, error);
      this.emit('agent.error', { agentId: agent.id, error });
    });

    agent.on('agent.status_changed', (data: any) => {
      this.logger.debug(`Agent ${agent.id} status changed to: ${data.status}`);
    });
  }
}
