import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import { nanoid } from 'nanoid';
import { interval, Subscription } from 'rxjs';

import { Config } from '../base';
import {
  Agent,
  AgentConfig,
  AgentCoordinationService,
  AgentGoal,
  AgentLifecycleManager,
  AgentMemoryManager,
  AgentPlanningEngine,
  AgentStatus,
  AutonomousAgent,
} from './agent';

interface AGISystemConfig {
  max_agents: number;
  auto_spawn_agents: boolean;
  goal_discovery_enabled: boolean;
  self_improvement_enabled: boolean;
  coordination_enabled: boolean;
  safety_constraints: string[];
}

interface SystemGoal {
  id: string;
  description: string;
  type: 'user_requested' | 'system_generated' | 'emergent';
  priority: number;
  assigned_agents: string[];
  status: 'pending' | 'active' | 'completed' | 'failed';
  created_at: Date;
  updated_at: Date;
}

/**
 * Main AGI System Service
 *
 * Orchestrates autonomous AI agents to create an emergent AGI system
 * that can:
 * - Autonomously discover and pursue goals
 * - Self-improve through learning and adaptation
 * - Coordinate multiple agents for complex tasks
 * - Maintain safety and ethical constraints
 * - Evolve system capabilities over time
 */
@Injectable()
export class AGISystemService extends EventEmitter2 implements OnModuleInit {
  private readonly logger = new Logger(AGISystemService.name);

  // System configuration
  private config: AGISystemConfig = {
    max_agents: 10,
    auto_spawn_agents: true,
    goal_discovery_enabled: true,
    self_improvement_enabled: true,
    coordination_enabled: true,
    safety_constraints: ['no_harm', 'privacy_respect', 'resource_limits'],
  };

  // System state
  private isRunning = false;
  private systemGoals = new Map<string, SystemGoal>();
  private systemMetrics = {
    agents_created: 0,
    goals_achieved: 0,
    learning_iterations: 0,
    coordination_events: 0,
    uptime_start: Date.now(),
  };

  // Subscriptions for periodic tasks
  private subscriptions: Subscription[] = [];

  constructor(
    private readonly serverConfig: Config,
    private readonly lifecycleManager: AgentLifecycleManager,
    private readonly planningEngine: AgentPlanningEngine,
    private readonly memoryManager: AgentMemoryManager,
    private readonly coordinationService: AgentCoordinationService
  ) {
    super({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      maxListeners: 50,
    });
  }

  async onModuleInit() {
    this.logger.log('Initializing AGI System...');
    this.setupEventListeners();
    await this.initializeSystem();
  }

  /**
   * Start the AGI system
   */
  async startSystem(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('AGI System is already running');
      return;
    }

    this.logger.log('Starting AGI System...');
    this.isRunning = true;
    this.systemMetrics.uptime_start = Date.now();

    // Start system processes
    await this.startGoalDiscovery();
    await this.startSelfImprovement();
    await this.startSystemMonitoring();

    // Spawn initial agents if enabled
    if (this.config.auto_spawn_agents) {
      await this.spawnInitialAgents();
    }

    this.emit('agi.system.started');
    this.logger.log('AGI System started successfully');
  }

  /**
   * Stop the AGI system
   */
  async stopSystem(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.log('Stopping AGI System...');
    this.isRunning = false;

    // Stop all periodic processes
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    // Gracefully terminate all agents
    await this.lifecycleManager.emergencyStop();

    this.emit('agi.system.stopped');
    this.logger.log('AGI System stopped');
  }

  /**
   * Submit a goal to the AGI system
   */
  async submitGoal(description: string, priority: number = 5): Promise<string> {
    const systemGoal: SystemGoal = {
      id: nanoid(),
      description,
      type: 'user_requested',
      priority,
      assigned_agents: [],
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.systemGoals.set(systemGoal.id, systemGoal);

    // Immediately try to assign agents to the goal
    await this.assignGoalToAgents(systemGoal);

    this.emit('agi.goal.submitted', systemGoal);
    this.logger.log(`Goal submitted: ${description}`);

    return systemGoal.id;
  }

  /**
   * Create a specialized agent for a specific purpose
   */
  async createSpecializedAgent(
    name: string,
    capabilities: string[],
    purpose: string
  ): Promise<Agent> {
    const agentConfig: AgentConfig = {
      name,
      type: 'specialized',
      capabilities,
      constraints: this.getDefaultConstraints(),
      resources: this.getDefaultResources(),
      initial_goals: [
        {
          id: nanoid(),
          description: purpose,
          priority: 7,
          success_criteria: [`Successfully fulfill purpose: ${purpose}`],
          progress: 0,
          status: 'active',
        },
      ],
      memory_config: {
        short_term_capacity: 100,
        long_term_retention_policy: 'confidence_based',
        episodic_memory_limit: 500,
      },
    };

    const agent = await this.lifecycleManager.createAgent(agentConfig);

    // Initialize agent memory
    this.memoryManager.initializeMemory(agent.id);

    // Register with coordination service
    this.coordinationService.registerAgent(agent);

    // Initialize and start the agent
    await this.lifecycleManager.initializeAgent(
      agent.id,
      this.getDefaultContext()
    );
    await this.lifecycleManager.startAgent(agent.id);

    this.systemMetrics.agents_created++;
    this.emit('agi.agent.created', { agent, purpose });

    return agent;
  }

  /**
   * Get system status and metrics
   */
  getSystemStatus(): Record<string, any> {
    const agents = this.lifecycleManager.listAgents();

    return {
      running: this.isRunning,
      uptime: this.isRunning ? Date.now() - this.systemMetrics.uptime_start : 0,
      metrics: this.systemMetrics,
      agents: {
        total: agents.length,
        by_status: this.groupAgentsByStatus(agents),
        by_type: this.groupAgentsByType(agents),
      },
      goals: {
        total: this.systemGoals.size,
        pending: Array.from(this.systemGoals.values()).filter(
          g => g.status === 'pending'
        ).length,
        active: Array.from(this.systemGoals.values()).filter(
          g => g.status === 'active'
        ).length,
        completed: Array.from(this.systemGoals.values()).filter(
          g => g.status === 'completed'
        ).length,
      },
      coordination: this.coordinationService.getCoordinationStats(),
      config: this.config,
    };
  }

  /**
   * Update system configuration
   */
  updateConfig(newConfig: Partial<AGISystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('agi.config.updated', this.config);
    this.logger.log('AGI System configuration updated');
  }

  /**
   * Private methods for system initialization and management
   */
  private async initializeSystem(): Promise<void> {
    // Initialize default system goals
    await this.initializeSystemGoals();

    // Set up safety monitoring
    this.setupSafetyMonitoring();

    this.logger.log('AGI System initialized');
  }

  private async initializeSystemGoals(): Promise<void> {
    // Create foundational system goals
    const foundationalGoals = [
      {
        description: 'Continuously improve system capabilities and efficiency',
        priority: 8,
        type: 'system_generated' as const,
      },
      {
        description: 'Maintain system safety and ethical operation',
        priority: 10,
        type: 'system_generated' as const,
      },
      {
        description: 'Optimize resource utilization across all agents',
        priority: 6,
        type: 'system_generated' as const,
      },
    ];

    for (const goalData of foundationalGoals) {
      const systemGoal: SystemGoal = {
        id: nanoid(),
        description: goalData.description,
        type: goalData.type,
        priority: goalData.priority,
        assigned_agents: [],
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      };

      this.systemGoals.set(systemGoal.id, systemGoal);
    }
  }

  private setupEventListeners(): void {
    // Listen to agent events
    this.lifecycleManager.on('agent.**', (event: any) => {
      this.emit(`agi.${event.type}`, event.data);
    });

    // Listen to coordination events
    this.coordinationService.on('**', (event: any) => {
      this.systemMetrics.coordination_events++;
    });
  }

  private setupSafetyMonitoring(): void {
    // Monitor system for safety violations
    this.on('agi.**', (event: any) => {
      this.checkSafetyConstraints(event);
    });
  }

  private checkSafetyConstraints(event: any): void {
    // Implement safety constraint checking
    for (const constraint of this.config.safety_constraints) {
      if (!this.evaluateSafetyConstraint(constraint, event)) {
        this.logger.warn(`Safety constraint violated: ${constraint}`);
        this.emit('agi.safety.violation', { constraint, event });
      }
    }
  }

  private evaluateSafetyConstraint(constraint: string, event: any): boolean {
    switch (constraint) {
      case 'no_harm':
        // Check if any action could cause harm
        return (
          !event.description?.toLowerCase().includes('delete') &&
          !event.description?.toLowerCase().includes('destroy')
        );

      case 'privacy_respect':
        // Check for privacy violations
        return (
          !event.content?.includes('personal_data') &&
          !event.content?.includes('private_info')
        );

      case 'resource_limits':
        // Check resource usage
        const agents = this.lifecycleManager.listAgents();
        return agents.length <= this.config.max_agents;

      default:
        return true;
    }
  }

  private async startGoalDiscovery(): Promise<void> {
    if (!this.config.goal_discovery_enabled) return;

    // Periodic goal discovery process
    const subscription = interval(60000).subscribe(async () => {
      // Every minute
      await this.discoverNewGoals();
    });

    this.subscriptions.push(subscription);
  }

  private async startSelfImprovement(): Promise<void> {
    if (!this.config.self_improvement_enabled) return;

    // Periodic self-improvement process
    const subscription = interval(300000).subscribe(async () => {
      // Every 5 minutes
      await this.performSelfImprovement();
    });

    this.subscriptions.push(subscription);
  }

  private async startSystemMonitoring(): Promise<void> {
    // System health monitoring
    const subscription = interval(30000).subscribe(async () => {
      // Every 30 seconds
      await this.monitorSystemHealth();
    });

    this.subscriptions.push(subscription);
  }

  private async spawnInitialAgents(): Promise<void> {
    const initialAgentConfigs = [
      {
        name: 'General Purpose Agent',
        capabilities: ['analysis', 'planning', 'communication', 'learning'],
        purpose: 'Handle general tasks and assist with system operations',
      },
      {
        name: 'Research Agent',
        capabilities: ['research', 'analysis', 'information_gathering'],
        purpose: 'Conduct research and gather information for system goals',
      },
      {
        name: 'Coordination Agent',
        capabilities: ['coordination', 'communication', 'planning'],
        purpose: 'Coordinate between agents and optimize system workflow',
      },
    ];

    for (const config of initialAgentConfigs) {
      await this.createSpecializedAgent(
        config.name,
        config.capabilities,
        config.purpose
      );
    }
  }

  private async assignGoalToAgents(systemGoal: SystemGoal): Promise<void> {
    const agents = this.lifecycleManager.listAgents();
    const availableAgents = agents.filter(
      agent =>
        agent.status === AgentStatus.IDLE ||
        agent.status === AgentStatus.PLANNING
    );

    if (availableAgents.length === 0) {
      this.logger.warn(
        `No available agents for goal: ${systemGoal.description}`
      );
      return;
    }

    // Convert system goal to agent goal
    const agentGoal: AgentGoal = {
      id: nanoid(),
      description: systemGoal.description,
      priority: systemGoal.priority,
      success_criteria: [`Successfully complete: ${systemGoal.description}`],
      progress: 0,
      status: 'active',
    };

    // Use coordination service to assign goal
    if (this.config.coordination_enabled && availableAgents.length > 1) {
      const selectedAgents = await this.coordinationService.negotiate(
        availableAgents,
        {
          description: systemGoal.description,
          priority: systemGoal.priority,
        }
      );

      systemGoal.assigned_agents = selectedAgents.map(a => a.id);

      // Create collaborative plan
      await this.coordinationService.collaborate(selectedAgents, agentGoal);
    } else {
      // Assign to single best agent
      const bestAgent = this.selectBestAgentForGoal(availableAgents, agentGoal);
      await bestAgent.addGoal(agentGoal);
      systemGoal.assigned_agents = [bestAgent.id];
    }

    systemGoal.status = 'active';
    systemGoal.updated_at = new Date();
  }

  private selectBestAgentForGoal(agents: Agent[], goal: AgentGoal): Agent {
    // Score agents based on capability relevance
    return agents.reduce((best, current) => {
      const bestScore = this.scoreAgentForGoal(best, goal);
      const currentScore = this.scoreAgentForGoal(current, goal);
      return currentScore > bestScore ? current : best;
    });
  }

  private scoreAgentForGoal(agent: Agent, goal: AgentGoal): number {
    let score = 0;

    // Capability matching
    const goalKeywords = goal.description.toLowerCase().split(/\s+/);
    for (const capability of agent.capabilities) {
      const capKeywords = capability.name.toLowerCase().split(/\s+/);
      const overlap = goalKeywords.filter(gk =>
        capKeywords.some(ck => ck.includes(gk) || gk.includes(ck))
      ).length;
      score += overlap;
    }

    // Availability bonus
    if (agent.status === AgentStatus.IDLE) score += 5;

    // Experience bonus
    const relevantExperiences = agent.memory.episodic.filter(
      exp =>
        exp.success &&
        goalKeywords.some(keyword =>
          exp.action.description.toLowerCase().includes(keyword)
        )
    ).length;
    score += relevantExperiences * 0.5;

    return score;
  }

  private async discoverNewGoals(): Promise<void> {
    // Analyze system state to discover emergent goals
    const agents = this.lifecycleManager.listAgents();
    const systemStatus = this.getSystemStatus();

    // Example: If agents are underutilized, create optimization goals
    const idleAgents = agents.filter(a => a.status === AgentStatus.IDLE);
    if (idleAgents.length > agents.length * 0.5 && agents.length > 0) {
      const optimizationGoal: SystemGoal = {
        id: nanoid(),
        description:
          'Optimize system resource utilization and find productive tasks',
        type: 'emergent',
        priority: 4,
        assigned_agents: [],
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      };

      this.systemGoals.set(optimizationGoal.id, optimizationGoal);
      this.emit('agi.goal.discovered', optimizationGoal);
    }
  }

  private async performSelfImprovement(): Promise<void> {
    this.logger.debug('Performing self-improvement cycle...');

    const agents = this.lifecycleManager.listAgents();

    // Optimize agent memories
    for (const agent of agents) {
      await this.memoryManager.optimizeMemory(agent.id);
    }

    // Analyze system performance and adapt
    const systemStatus = this.getSystemStatus();
    await this.adaptSystemBasedOnPerformance(systemStatus);

    this.systemMetrics.learning_iterations++;
  }

  private async adaptSystemBasedOnPerformance(status: any): Promise<void> {
    // Example adaptations based on system performance

    // If too many agents are failing, reduce complexity
    const errorRate = status.agents.by_status[AgentStatus.ERROR] || 0;
    if (errorRate > status.agents.total * 0.3) {
      this.logger.warn('High error rate detected, adapting system...');
      // Could implement complexity reduction here
    }

    // If goal completion is low, spawn more specialized agents
    const completionRate = status.goals.completed / (status.goals.total || 1);
    if (completionRate < 0.5 && status.agents.total < this.config.max_agents) {
      await this.createSpecializedAgent(
        `Adaptive-Agent-${nanoid(8)}`,
        ['problem_solving', 'adaptation', 'analysis'],
        'Address system performance issues and improve goal completion'
      );
    }
  }

  private async monitorSystemHealth(): Promise<void> {
    const healthCheck = await this.lifecycleManager.healthCheck();

    if (!healthCheck.overall_health) {
      this.logger.warn('System health issues detected');
      this.emit('agi.health.warning', healthCheck);

      // Auto-healing: restart problematic agents
      for (const [agentId, health] of Object.entries(healthCheck.agents)) {
        if (!(health as any).healthy) {
          this.logger.log(`Restarting unhealthy agent: ${agentId}`);
          try {
            await this.lifecycleManager.restartAgent(agentId);
          } catch (error) {
            this.logger.error(`Failed to restart agent ${agentId}:`, error);
          }
        }
      }
    }
  }

  private getDefaultConstraints(): any[] {
    return [
      {
        type: 'safety',
        description: 'No harmful actions',
        rule: (action: any, context: any) => {
          const harmfulKeywords = ['delete', 'destroy', 'harm', 'damage'];
          return !harmfulKeywords.some(keyword =>
            action.description?.toLowerCase().includes(keyword)
          );
        },
      },
      {
        type: 'resource',
        description: 'Respect resource limits',
        rule: (action: any, context: any) => true, // Simplified
      },
    ];
  }

  private getDefaultResources(): any[] {
    return [
      {
        type: 'api',
        name: 'system_api',
        permissions: ['read', 'write'],
      },
      {
        type: 'database',
        name: 'agent_memory',
        permissions: ['read', 'write'],
      },
    ];
  }

  private getDefaultContext(): any {
    return {
      userId: 'system',
      sessionId: nanoid(),
      environment: {
        system_mode: 'autonomous',
        safety_level: 'high',
      },
      constraints: this.getDefaultConstraints(),
      resources: this.getDefaultResources(),
    };
  }

  private groupAgentsByStatus(agents: Agent[]): Record<string, number> {
    return agents.reduce(
      (acc, agent) => {
        acc[agent.status] = (acc[agent.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  private groupAgentsByType(agents: Agent[]): Record<string, number> {
    return agents.reduce(
      (acc, agent) => {
        acc[agent.type] = (acc[agent.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }
}
