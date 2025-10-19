import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import { nanoid } from 'nanoid';
import { BehaviorSubject, Subject } from 'rxjs';

import {
  Agent,
  AgentAction,
  AgentCapability,
  AgentConfig,
  AgentContext,
  AgentExperience,
  AgentGoal,
  AgentKnowledge,
  AgentMemory,
  AgentMessage,
  AgentObservables,
  AgentPlan,
  AgentStatus,
} from './types';

/**
 * Core autonomous agent implementation
 */
@Injectable()
export class AutonomousAgent extends EventEmitter2 implements Agent {
  private readonly logger = new Logger(`Agent:${this.name}`);

  // Status and state
  private _status = new BehaviorSubject<AgentStatus>(AgentStatus.INITIALIZING);
  private _currentPlan?: AgentPlan;
  private _memory: AgentMemory;
  private _goals: AgentGoal[] = [];
  private _metrics: Record<string, any> = {};
  private _logs: any[] = [];

  // Observables for real-time monitoring
  private _actions$ = new Subject<AgentAction>();
  private _goals$ = new Subject<AgentGoal>();
  private _messages$ = new Subject<AgentMessage>();
  private _metrics$ = new Subject<Record<string, any>>();

  // Core properties
  public readonly id: string;
  public readonly name: string;
  public readonly type: string;
  public readonly capabilities: AgentCapability[];
  public context: AgentContext;

  constructor(config: AgentConfig) {
    super({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      maxListeners: 20,
    });

    this.id = nanoid();
    this.name = config.name;
    this.type = config.type;
    this.capabilities = this.initializeCapabilities(config.capabilities);
    this._memory = this.initializeMemory(config.memory_config);
    this._goals = config.initial_goals || [];

    this.logger.log(`Agent ${this.name} created with ID: ${this.id}`);
  }

  // Getters
  get status(): AgentStatus {
    return this._status.value;
  }

  get goals(): AgentGoal[] {
    return this._goals;
  }

  get memory(): AgentMemory {
    return this._memory;
  }

  get currentPlan(): AgentPlan | undefined {
    return this._currentPlan;
  }

  get observables(): AgentObservables {
    return {
      status$: this._status.asObservable(),
      actions$: this._actions$.asObservable(),
      goals$: this._goals$.asObservable(),
      messages$: this._messages$.asObservable(),
      metrics$: this._metrics$.asObservable(),
    };
  }

  // Lifecycle methods
  async initialize(context: AgentContext): Promise<void> {
    this.logger.log('Initializing agent...');
    this.context = context;
    this.setStatus(AgentStatus.INITIALIZING);

    // Validate constraints and resources
    await this.validateContext();

    // Initialize capabilities with context
    for (const capability of this.capabilities) {
      if (capability.parameters?.initialize) {
        await capability.parameters.initialize(this.context);
      }
    }

    this.setStatus(AgentStatus.IDLE);
    this.emit('agent.initialized', { agentId: this.id, context });
    this.logger.log('Agent initialized successfully');
  }

  async start(): Promise<void> {
    if (this.status !== AgentStatus.IDLE) {
      throw new Error(`Cannot start agent in status: ${this.status}`);
    }

    this.logger.log('Starting agent autonomous loop...');
    this.setStatus(AgentStatus.IDLE);
    this.emit('agent.started', { agentId: this.id });

    // Start the main autonomous loop
    this.autonomousLoop();
  }

  async pause(): Promise<void> {
    this.logger.log('Pausing agent...');
    this.setStatus(AgentStatus.PAUSED);
    this.emit('agent.paused', { agentId: this.id });
  }

  async resume(): Promise<void> {
    if (this.status !== AgentStatus.PAUSED) {
      throw new Error(`Cannot resume agent from status: ${this.status}`);
    }

    this.logger.log('Resuming agent...');
    this.setStatus(AgentStatus.IDLE);
    this.emit('agent.resumed', { agentId: this.id });
    this.autonomousLoop();
  }

  async terminate(): Promise<void> {
    this.logger.log('Terminating agent...');
    this.setStatus(AgentStatus.TERMINATED);
    this.emit('agent.terminated', { agentId: this.id });
    this.removeAllListeners();
  }

  // Core AGI functions
  async perceive(): Promise<any[]> {
    this.logger.debug('Perceiving environment...');
    const perceptions = [];

    // Gather information from available resources
    for (const resource of this.context.resources) {
      try {
        const perception = await this.gatherResourceData(resource);
        perceptions.push(perception);
      } catch (error) {
        this.logger.warn(
          `Failed to perceive from resource ${resource.name}:`,
          error
        );
      }
    }

    // Update short-term memory with current perceptions
    this._memory.short_term.current_perceptions = perceptions;
    this._memory.working_memory.unshift(...perceptions.slice(0, 5)); // Keep last 5
    this._memory.working_memory = this._memory.working_memory.slice(0, 20); // Max 20 items

    return perceptions;
  }

  async plan(goal: AgentGoal): Promise<AgentPlan> {
    this.logger.log(`Planning for goal: ${goal.description}`);
    this.setStatus(AgentStatus.PLANNING);

    // Simple hierarchical planning
    const actions: AgentAction[] = [];

    // Break down goal into actionable steps based on available capabilities
    for (const capability of this.capabilities) {
      if (this.isCapabilityRelevant(capability, goal)) {
        const action: AgentAction = {
          id: nanoid(),
          type: capability.name,
          description: `Execute ${capability.name} for goal: ${goal.description}`,
          parameters: capability.parameters || {},
          timestamp: new Date(),
        };
        actions.push(action);
      }
    }

    const plan: AgentPlan = {
      id: nanoid(),
      goal_id: goal.id,
      actions,
      estimated_duration: actions.length * 30000, // 30s per action estimate
      risk_assessment: 0.2, // Low risk by default
      status: 'draft',
    };

    this._currentPlan = plan;
    this.emit('agent.planned', { agentId: this.id, plan });
    return plan;
  }

  async execute(action: AgentAction): Promise<any> {
    this.logger.log(`Executing action: ${action.description}`);
    this.setStatus(AgentStatus.EXECUTING);

    // Find and execute the capability
    const capability = this.capabilities.find(c => c.name === action.type);
    if (!capability) {
      throw new Error(`No capability found for action type: ${action.type}`);
    }

    // Check constraints before execution
    for (const constraint of this.context.constraints) {
      if (!constraint.rule(action, this.context)) {
        throw new Error(
          `Action violates constraint: ${constraint.description}`
        );
      }
    }

    try {
      const result = await capability.execute(action.parameters, this.context);

      // Record experience
      const experience: AgentExperience = {
        id: nanoid(),
        context: this.context,
        action,
        outcome: result,
        success: true,
        timestamp: new Date(),
      };

      await this.learn(experience);
      this._actions$.next(action);
      this.emit('agent.action_executed', { agentId: this.id, action, result });

      return result;
    } catch (error) {
      const experience: AgentExperience = {
        id: nanoid(),
        context: this.context,
        action,
        outcome: error,
        success: false,
        timestamp: new Date(),
        lessons_learned: [`Action ${action.type} failed: ${error.message}`],
      };

      await this.learn(experience);
      this.logger.error(`Action execution failed:`, error);
      throw error;
    } finally {
      this.setStatus(AgentStatus.IDLE);
    }
  }

  async learn(experience: AgentExperience): Promise<void> {
    this.logger.debug('Learning from experience...');
    this.setStatus(AgentStatus.LEARNING);

    // Add to episodic memory
    this._memory.episodic.push(experience);

    // Extract knowledge if successful
    if (experience.success) {
      const knowledge: AgentKnowledge = {
        id: nanoid(),
        type: 'procedure',
        content: {
          action: experience.action,
          context: experience.context,
          outcome: experience.outcome,
        },
        confidence: 0.8,
        source: 'experience',
        timestamp: new Date(),
        tags: [experience.action.type, 'successful'],
      };

      await this.remember(knowledge);
    }

    // Keep episodic memory bounded
    if (this._memory.episodic.length > 1000) {
      this._memory.episodic = this._memory.episodic.slice(-1000);
    }

    this.emit('agent.learned', { agentId: this.id, experience });
  }

  async communicate(message: any, target?: Agent): Promise<any> {
    this.logger.debug('Communicating...', { target: target?.id });
    this.setStatus(AgentStatus.COMMUNICATING);

    const agentMessage: AgentMessage = {
      id: nanoid(),
      from: this.id,
      to: target?.id || 'broadcast',
      type: 'notification',
      content: message,
      timestamp: new Date(),
      priority: 1,
    };

    this._messages$.next(agentMessage);
    this.emit('agent.communicated', {
      agentId: this.id,
      message: agentMessage,
    });

    if (target) {
      return target.receiveMessage(agentMessage);
    }

    return agentMessage;
  }

  // Decision making
  async evaluate(options: any[]): Promise<any> {
    this.logger.debug(`Evaluating ${options.length} options...`);

    // Simple scoring based on past experiences
    let bestOption = options[0];
    let bestScore = -Infinity;

    for (const option of options) {
      const score = await this.scoreOption(option);
      if (score > bestScore) {
        bestScore = score;
        bestOption = option;
      }
    }

    return bestOption;
  }

  async decide(context: any): Promise<AgentAction> {
    this.logger.debug('Making decision based on context...');

    // Simple decision making: prioritize goals and select next action
    const activeGoals = this._goals.filter(g => g.status === 'active');
    if (activeGoals.length === 0) {
      throw new Error('No active goals to work on');
    }

    const topGoal = activeGoals.sort((a, b) => b.priority - a.priority)[0];

    if (!this._currentPlan || this._currentPlan.goal_id !== topGoal.id) {
      this._currentPlan = await this.plan(topGoal);
    }

    const nextAction = this._currentPlan.actions.find(
      a => !this.isActionCompleted(a)
    );
    if (!nextAction) {
      throw new Error('No more actions in current plan');
    }

    return nextAction;
  }

  // Goal management
  async addGoal(goal: AgentGoal): Promise<void> {
    this.logger.log(`Adding goal: ${goal.description}`);
    this._goals.push(goal);
    this._goals$.next(goal);
    this.emit('agent.goal_added', { agentId: this.id, goal });
  }

  async removeGoal(goalId: string): Promise<void> {
    this.logger.log(`Removing goal: ${goalId}`);
    const index = this._goals.findIndex(g => g.id === goalId);
    if (index >= 0) {
      const goal = this._goals.splice(index, 1)[0];
      this.emit('agent.goal_removed', { agentId: this.id, goal });
    }
  }

  async prioritizeGoals(): Promise<void> {
    this.logger.debug('Prioritizing goals...');
    this._goals.sort((a, b) => {
      // Consider deadline proximity and priority
      const aUrgency = a.deadline
        ? (a.deadline.getTime() - Date.now()) / 1000
        : Infinity;
      const bUrgency = b.deadline
        ? (b.deadline.getTime() - Date.now()) / 1000
        : Infinity;

      return b.priority / bUrgency - a.priority / aUrgency;
    });
  }

  // Memory management
  async remember(knowledge: AgentKnowledge): Promise<void> {
    this.logger.debug(`Remembering: ${knowledge.type}`);
    this._memory.long_term.push(knowledge);

    // Keep memory bounded
    if (this._memory.long_term.length > 10000) {
      this._memory.long_term = this._memory.long_term
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10000);
    }
  }

  async recall(query: any): Promise<AgentKnowledge[]> {
    this.logger.debug('Recalling knowledge...', query);

    // Simple keyword-based search
    const keywords = typeof query === 'string' ? [query] : query.keywords || [];

    return this._memory.long_term
      .filter(knowledge => {
        return keywords.some(
          keyword =>
            knowledge.tags.some(tag => tag.includes(keyword)) ||
            JSON.stringify(knowledge.content).includes(keyword)
        );
      })
      .sort((a, b) => b.confidence - a.confidence);
  }

  async forget(criteria: any): Promise<void> {
    this.logger.debug('Forgetting based on criteria...', criteria);

    if (criteria.confidence_threshold) {
      this._memory.long_term = this._memory.long_term.filter(
        k => k.confidence >= criteria.confidence_threshold
      );
    }

    if (criteria.age_threshold) {
      const cutoff = new Date(Date.now() - criteria.age_threshold);
      this._memory.long_term = this._memory.long_term.filter(
        k => k.timestamp >= cutoff
      );
    }
  }

  // Observability
  getStatus(): AgentStatus {
    return this._status.value;
  }

  getMetrics(): Record<string, any> {
    return {
      ...this._metrics,
      goals_count: this._goals.length,
      active_goals: this._goals.filter(g => g.status === 'active').length,
      memory_size: this._memory.long_term.length,
      experiences_count: this._memory.episodic.length,
      uptime: Date.now() - (this._metrics.start_time || Date.now()),
    };
  }

  getLogs(): any[] {
    return this._logs.slice(-100); // Return last 100 log entries
  }

  // Message handling
  async receiveMessage(message: AgentMessage): Promise<any> {
    this.logger.debug('Received message:', message);
    this._messages$.next(message);
    this.emit('agent.message_received', { agentId: this.id, message });

    // Process message based on type
    switch (message.type) {
      case 'request':
        return this.handleRequest(message);
      case 'coordination':
        return this.handleCoordination(message);
      default:
        return { acknowledged: true };
    }
  }

  // Private methods
  private setStatus(status: AgentStatus): void {
    this._status.next(status);
    this.emit('agent.status_changed', { agentId: this.id, status });
  }

  private initializeCapabilities(capabilityNames: string[]): AgentCapability[] {
    // Initialize with basic capabilities
    return capabilityNames.map(name => ({
      name,
      description: `${name} capability`,
      execute: async (params: any, context: AgentContext) => {
        // Placeholder implementation
        return { capability: name, params, executed: true };
      },
    }));
  }

  private initializeMemory(config?: any): AgentMemory {
    return {
      short_term: {},
      long_term: [],
      episodic: [],
      working_memory: [],
    };
  }

  private async validateContext(): Promise<void> {
    // Validate that required resources are available
    // This could include checking API connectivity, database access, etc.
  }

  private async autonomousLoop(): Promise<void> {
    while (
      this.status !== AgentStatus.TERMINATED &&
      this.status !== AgentStatus.PAUSED
    ) {
      try {
        // Perceive environment
        await this.perceive();

        // Check if there are active goals
        if (this._goals.filter(g => g.status === 'active').length === 0) {
          await this.sleep(5000); // Wait 5 seconds
          continue;
        }

        // Make decision and execute
        const action = await this.decide({});
        await this.execute(action);

        // Small delay between actions
        await this.sleep(1000);
      } catch (error) {
        this.logger.error('Error in autonomous loop:', error);
        this.setStatus(AgentStatus.ERROR);
        await this.sleep(5000); // Wait before retrying
        this.setStatus(AgentStatus.IDLE);
      }
    }
  }

  private async gatherResourceData(resource: any): Promise<any> {
    // Placeholder for resource data gathering
    return { resource: resource.name, data: 'perceived_data' };
  }

  private isCapabilityRelevant(
    capability: AgentCapability,
    goal: AgentGoal
  ): boolean {
    // Simple relevance check based on keywords
    return goal.description
      .toLowerCase()
      .includes(capability.name.toLowerCase());
  }

  private async scoreOption(option: any): Promise<number> {
    // Simple scoring based on past experiences
    let score = 0;

    // Look for similar past experiences
    const relevantExperiences = this._memory.episodic.filter(exp =>
      JSON.stringify(exp.action).includes(JSON.stringify(option))
    );

    for (const exp of relevantExperiences) {
      score += exp.success ? 1 : -1;
    }

    return score;
  }

  private isActionCompleted(action: AgentAction): boolean {
    // Check if action has been executed
    return this._memory.episodic.some(
      exp => exp.action.id === action.id && exp.success
    );
  }

  private async handleRequest(message: AgentMessage): Promise<any> {
    // Handle incoming requests from other agents
    return { handled: true, response: 'Request processed' };
  }

  private async handleCoordination(message: AgentMessage): Promise<any> {
    // Handle coordination messages
    return { coordinated: true };
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
