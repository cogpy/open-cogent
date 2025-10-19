import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import { nanoid } from 'nanoid';
import { BehaviorSubject, Subject } from 'rxjs';

import {
  Agent,
  AgentCoordination,
  AgentGoal,
  AgentMessage,
  AgentPlan,
  AgentStatus,
} from './types';

interface CoordinationTask {
  id: string;
  description: string;
  requiredCapabilities: string[];
  priority: number;
  deadline?: Date;
  assignedAgents: string[];
  status: 'pending' | 'assigned' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
}

interface AgentTeam {
  id: string;
  name: string;
  agentIds: string[];
  coordinator: string; // Agent ID of the coordinator
  goals: AgentGoal[];
  createdAt: Date;
}

interface CoordinationConflict {
  id: string;
  type: 'resource' | 'goal' | 'priority' | 'capability';
  description: string;
  involvedAgents: string[];
  proposedResolution?: any;
  status: 'pending' | 'resolving' | 'resolved';
  createdAt: Date;
}

/**
 * Multi-agent coordination and collaboration system
 */
@Injectable()
export class AgentCoordinationService
  extends EventEmitter2
  implements AgentCoordination
{
  private readonly logger = new Logger(AgentCoordinationService.name);

  // Agent registry
  private agents = new Map<string, Agent>();

  // Coordination structures
  private tasks = new Map<string, CoordinationTask>();
  private teams = new Map<string, AgentTeam>();
  private conflicts = new Map<string, CoordinationConflict>();

  // Communication channels
  private messageQueue = new Subject<AgentMessage>();
  private broadcastChannel = new Subject<AgentMessage>();

  // Coordination metrics
  private coordinationMetrics = {
    tasks_completed: 0,
    conflicts_resolved: 0,
    teams_formed: 0,
    messages_exchanged: 0,
  };

  constructor() {
    super({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      maxListeners: 100,
    });

    this.setupMessageHandling();
  }

  /**
   * Register an agent with the coordination system
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);

    // Set up message handling for the agent
    agent.observables.messages$.subscribe(message => {
      this.handleAgentMessage(message);
    });

    this.logger.log(`Agent ${agent.id} registered for coordination`);
    this.emit('agent.registered', { agentId: agent.id });
  }

  /**
   * Unregister an agent from the coordination system
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);

    // Remove from teams
    for (const [teamId, team] of this.teams.entries()) {
      if (team.agentIds.includes(agentId)) {
        team.agentIds = team.agentIds.filter(id => id !== agentId);
        if (team.agentIds.length === 0) {
          this.teams.delete(teamId);
        }
      }
    }

    this.logger.log(`Agent ${agentId} unregistered from coordination`);
    this.emit('agent.unregistered', { agentId });
  }

  /**
   * Negotiate agent assignment for a task
   */
  async negotiate(agents: Agent[], task: any): Promise<Agent[]> {
    this.logger.log(
      `Negotiating agent assignment for task: ${task.description}`
    );

    // Analyze task requirements
    const requiredCapabilities = this.extractRequiredCapabilities(task);
    const taskComplexity = this.assessTaskComplexity(task);

    // Score agents based on capability match and availability
    const agentScores = await this.scoreAgentsForTask(
      agents,
      task,
      requiredCapabilities
    );

    // Select optimal team size based on complexity
    const optimalTeamSize = Math.min(
      Math.max(1, Math.floor(taskComplexity / 3)),
      agents.length
    );

    // Select best agents
    const selectedAgents = agentScores
      .sort((a, b) => b.score - a.score)
      .slice(0, optimalTeamSize)
      .map(scored => scored.agent);

    // Create coordination task
    const coordinationTask: CoordinationTask = {
      id: nanoid(),
      description: task.description,
      requiredCapabilities,
      priority: task.priority || 1,
      deadline: task.deadline,
      assignedAgents: selectedAgents.map(a => a.id),
      status: 'assigned',
      createdAt: new Date(),
    };

    this.tasks.set(coordinationTask.id, coordinationTask);

    // Notify selected agents
    for (const agent of selectedAgents) {
      await this.sendMessage({
        id: nanoid(),
        from: 'coordination_system',
        to: agent.id,
        type: 'request',
        content: {
          task: coordinationTask,
          role: 'participant',
        },
        timestamp: new Date(),
        priority: task.priority || 1,
      });
    }

    this.emit('task.negotiated', { task: coordinationTask, selectedAgents });

    return selectedAgents;
  }

  /**
   * Delegate a task to a specific agent
   */
  async delegate(task: any, agent: Agent): Promise<any> {
    this.logger.log(`Delegating task to agent: ${agent.id}`);

    // Check agent availability and capability
    if (agent.status !== AgentStatus.IDLE) {
      throw new Error(
        `Agent ${agent.id} is not available (status: ${agent.status})`
      );
    }

    // Create delegation message
    const delegationMessage: AgentMessage = {
      id: nanoid(),
      from: 'coordination_system',
      to: agent.id,
      type: 'request',
      content: {
        type: 'delegation',
        task,
        deadline: task.deadline,
        priority: task.priority || 1,
      },
      timestamp: new Date(),
      priority: task.priority || 1,
    };

    // Send delegation
    const response = await this.sendMessage(delegationMessage);

    this.emit('task.delegated', { task, agentId: agent.id, response });

    return response;
  }

  /**
   * Facilitate collaboration between agents for a shared goal
   */
  async collaborate(agents: Agent[], goal: AgentGoal): Promise<AgentPlan> {
    this.logger.log(`Facilitating collaboration for goal: ${goal.description}`);

    // Create or join a team
    const team = await this.formTeam(agents, goal);

    // Designate coordinator (most capable agent)
    const coordinator = this.selectCoordinator(agents);
    team.coordinator = coordinator.id;

    // Break down goal into sub-tasks
    const subTasks = await this.decomposeGoalIntoTasks(goal, agents);

    // Assign sub-tasks to team members
    const taskAssignments = await this.assignTasksToTeam(subTasks, team);

    // Create collaborative plan
    const collaborativePlan: AgentPlan = {
      id: nanoid(),
      goal_id: goal.id,
      actions: [],
      estimated_duration: 0,
      risk_assessment: 0,
      status: 'draft',
    };

    // Aggregate individual plans
    for (const assignment of taskAssignments) {
      const agent = this.agents.get(assignment.agentId);
      if (agent) {
        const subPlan = await agent.plan(assignment.goal);
        collaborativePlan.actions.push(...subPlan.actions);
        collaborativePlan.estimated_duration += subPlan.estimated_duration;
        collaborativePlan.risk_assessment = Math.max(
          collaborativePlan.risk_assessment,
          subPlan.risk_assessment
        );
      }
    }

    // Set up inter-agent communication for the collaboration
    await this.setupCollaborationCommunication(team, collaborativePlan);

    this.emit('collaboration.initiated', {
      team,
      goal,
      plan: collaborativePlan,
    });

    return collaborativePlan;
  }

  /**
   * Resolve conflicts between agents
   */
  async resolve_conflict(conflict: any): Promise<any> {
    this.logger.log(`Resolving conflict: ${conflict.description}`);

    const coordinationConflict: CoordinationConflict = {
      id: nanoid(),
      type: conflict.type,
      description: conflict.description,
      involvedAgents: conflict.involvedAgents || [],
      status: 'resolving',
      createdAt: new Date(),
    };

    this.conflicts.set(coordinationConflict.id, coordinationConflict);

    let resolution;

    switch (conflict.type) {
      case 'resource':
        resolution = await this.resolveResourceConflict(coordinationConflict);
        break;
      case 'goal':
        resolution = await this.resolveGoalConflict(coordinationConflict);
        break;
      case 'priority':
        resolution = await this.resolvePriorityConflict(coordinationConflict);
        break;
      case 'capability':
        resolution = await this.resolveCapabilityConflict(coordinationConflict);
        break;
      default:
        resolution = await this.resolveGenericConflict(coordinationConflict);
    }

    coordinationConflict.status = 'resolved';
    coordinationConflict.proposedResolution = resolution;

    // Notify involved agents
    for (const agentId of coordinationConflict.involvedAgents) {
      await this.sendMessage({
        id: nanoid(),
        from: 'coordination_system',
        to: agentId,
        type: 'notification',
        content: {
          type: 'conflict_resolved',
          conflict: coordinationConflict,
          resolution,
        },
        timestamp: new Date(),
        priority: 2,
      });
    }

    this.coordinationMetrics.conflicts_resolved++;
    this.emit('conflict.resolved', {
      conflict: coordinationConflict,
      resolution,
    });

    return resolution;
  }

  /**
   * Get coordination statistics
   */
  getCoordinationStats(): Record<string, any> {
    return {
      ...this.coordinationMetrics,
      active_agents: this.agents.size,
      active_tasks: Array.from(this.tasks.values()).filter(
        t => t.status === 'executing'
      ).length,
      active_teams: this.teams.size,
      pending_conflicts: Array.from(this.conflicts.values()).filter(
        c => c.status === 'pending'
      ).length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Broadcast message to all agents
   */
  async broadcastMessage(message: Omit<AgentMessage, 'to'>): Promise<void> {
    const broadcastMessage: AgentMessage = {
      ...message,
      to: 'broadcast',
    };

    this.broadcastChannel.next(broadcastMessage);

    for (const agent of this.agents.values()) {
      await agent.receiveMessage(broadcastMessage);
    }

    this.coordinationMetrics.messages_exchanged++;
    this.emit('message.broadcast', broadcastMessage);
  }

  /**
   * Private helper methods
   */
  private setupMessageHandling(): void {
    this.messageQueue.subscribe(async message => {
      await this.processMessage(message);
    });

    this.broadcastChannel.subscribe(message => {
      this.logger.debug(`Broadcasting message: ${message.type}`);
    });
  }

  private async handleAgentMessage(message: AgentMessage): void {
    this.messageQueue.next(message);
  }

  private async processMessage(message: AgentMessage): Promise<void> {
    this.coordinationMetrics.messages_exchanged++;

    switch (message.type) {
      case 'coordination':
        await this.handleCoordinationMessage(message);
        break;
      case 'request':
        await this.handleRequestMessage(message);
        break;
      case 'response':
        await this.handleResponseMessage(message);
        break;
      default:
        this.logger.debug(
          `Processed ${message.type} message from ${message.from}`
        );
    }
  }

  private async sendMessage(message: AgentMessage): Promise<any> {
    const targetAgent = this.agents.get(message.to);
    if (targetAgent) {
      return await targetAgent.receiveMessage(message);
    } else {
      this.logger.warn(`Target agent not found: ${message.to}`);
      return null;
    }
  }

  private extractRequiredCapabilities(task: any): string[] {
    // Extract capabilities from task description using keywords
    const description = task.description.toLowerCase();
    const capabilities: string[] = [];

    const capabilityKeywords = {
      analyze: ['analysis', 'research', 'investigation'],
      create: ['generation', 'building', 'construction'],
      process: ['processing', 'transformation', 'conversion'],
      communicate: ['messaging', 'notification', 'reporting'],
      monitor: ['surveillance', 'tracking', 'observation'],
    };

    for (const [capability, keywords] of Object.entries(capabilityKeywords)) {
      if (keywords.some(keyword => description.includes(keyword))) {
        capabilities.push(capability);
      }
    }

    return capabilities.length > 0 ? capabilities : ['general'];
  }

  private assessTaskComplexity(task: any): number {
    let complexity = 1;

    const description = task.description.toLowerCase();

    // Add complexity for certain keywords
    const complexKeywords = [
      'integrate',
      'coordinate',
      'analyze',
      'optimize',
      'multiple',
    ];
    complexity += complexKeywords.filter(keyword =>
      description.includes(keyword)
    ).length;

    // Add complexity for deadline pressure
    if (task.deadline) {
      const timeToDeadline = task.deadline.getTime() - Date.now();
      if (timeToDeadline < 60 * 60 * 1000) {
        // Less than 1 hour
        complexity += 2;
      }
    }

    return Math.min(complexity, 10);
  }

  private async scoreAgentsForTask(
    agents: Agent[],
    task: any,
    requiredCapabilities: string[]
  ): Promise<Array<{ agent: Agent; score: number }>> {
    const scores = [];

    for (const agent of agents) {
      let score = 0;

      // Capability matching
      const agentCapabilities = agent.capabilities.map(c => c.name);
      const capabilityMatch = requiredCapabilities.filter(req =>
        agentCapabilities.some(cap => cap.includes(req))
      ).length;
      score += capabilityMatch * 2;

      // Availability bonus
      if (agent.status === AgentStatus.IDLE) {
        score += 3;
      } else if (agent.status === AgentStatus.PLANNING) {
        score += 1;
      }

      // Experience bonus (based on memory)
      const relevantExperiences = agent.memory.episodic.filter(
        exp =>
          exp.success &&
          requiredCapabilities.some(cap => exp.action.type.includes(cap))
      ).length;
      score += Math.min(relevantExperiences * 0.5, 2);

      // Load penalty
      const activeGoalsCount = agent.goals.filter(
        g => g.status === 'active'
      ).length;
      score -= activeGoalsCount * 0.5;

      scores.push({ agent, score });
    }

    return scores;
  }

  private async formTeam(agents: Agent[], goal: AgentGoal): Promise<AgentTeam> {
    const team: AgentTeam = {
      id: nanoid(),
      name: `Team-${goal.description.substring(0, 20)}`,
      agentIds: agents.map(a => a.id),
      coordinator: agents[0].id, // Temporary, will be updated
      goals: [goal],
      createdAt: new Date(),
    };

    this.teams.set(team.id, team);
    this.coordinationMetrics.teams_formed++;

    return team;
  }

  private selectCoordinator(agents: Agent[]): Agent {
    // Select coordinator based on experience and current load
    return agents.reduce((best, current) => {
      const bestScore = this.calculateCoordinatorScore(best);
      const currentScore = this.calculateCoordinatorScore(current);
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateCoordinatorScore(agent: Agent): number {
    let score = 0;

    // Experience with coordination
    const coordinationExperience = agent.memory.episodic.filter(
      exp =>
        exp.action.type.includes('coordinate') ||
        exp.action.type.includes('manage')
    ).length;
    score += coordinationExperience * 2;

    // Number of capabilities (versatility)
    score += agent.capabilities.length * 0.5;

    // Low current load
    const activeGoals = agent.goals.filter(g => g.status === 'active').length;
    score -= activeGoals;

    return score;
  }

  private async decomposeGoalIntoTasks(
    goal: AgentGoal,
    agents: Agent[]
  ): Promise<any[]> {
    // Simple goal decomposition
    const tasks = [];

    if (goal.subgoals && goal.subgoals.length > 0) {
      // Use existing subgoals as tasks
      tasks.push(
        ...goal.subgoals.map(subgoal => ({
          id: nanoid(),
          description: subgoal.description,
          priority: subgoal.priority,
          goal: subgoal,
        }))
      );
    } else {
      // Auto-decompose based on available capabilities
      const uniqueCapabilities = new Set(
        agents.flatMap(agent => agent.capabilities.map(c => c.name))
      );

      for (const capability of uniqueCapabilities) {
        if (this.isCapabilityRelevantToGoal(capability, goal)) {
          tasks.push({
            id: nanoid(),
            description: `Use ${capability} for: ${goal.description}`,
            priority: goal.priority,
            capability,
            goal: {
              id: nanoid(),
              description: `Apply ${capability} to achieve ${goal.description}`,
              priority: goal.priority,
              success_criteria: [`Successfully applied ${capability}`],
              progress: 0,
              status: 'pending' as const,
            },
          });
        }
      }
    }

    return tasks;
  }

  private isCapabilityRelevantToGoal(
    capability: string,
    goal: AgentGoal
  ): boolean {
    const goalKeywords = goal.description.toLowerCase().split(/\s+/);
    const capabilityKeywords = capability.toLowerCase().split(/\s+/);

    return goalKeywords.some(gKeyword =>
      capabilityKeywords.some(
        cKeyword => gKeyword.includes(cKeyword) || cKeyword.includes(gKeyword)
      )
    );
  }

  private async assignTasksToTeam(
    tasks: any[],
    team: AgentTeam
  ): Promise<any[]> {
    const assignments = [];
    const teamAgents = team.agentIds
      .map(id => this.agents.get(id)!)
      .filter(Boolean);

    // Assign tasks based on capability matching
    for (const task of tasks) {
      let bestAgent = teamAgents[0];
      let bestScore = 0;

      for (const agent of teamAgents) {
        const score = this.calculateTaskAssignmentScore(task, agent);
        if (score > bestScore) {
          bestScore = score;
          bestAgent = agent;
        }
      }

      assignments.push({
        taskId: task.id,
        agentId: bestAgent.id,
        goal: task.goal,
      });
    }

    return assignments;
  }

  private calculateTaskAssignmentScore(task: any, agent: Agent): number {
    let score = 0;

    // Capability matching
    if (task.capability) {
      const hasCapability = agent.capabilities.some(
        c => c.name === task.capability
      );
      score += hasCapability ? 5 : 0;
    }

    // Experience with similar tasks
    const relevantExperience = agent.memory.episodic.filter(
      exp =>
        exp.success &&
        (exp.action.type === task.capability ||
          exp.action.description.includes(task.description.substring(0, 20)))
    ).length;
    score += relevantExperience;

    // Current load (prefer less loaded agents)
    const currentLoad = agent.goals.filter(g => g.status === 'active').length;
    score -= currentLoad;

    return score;
  }

  private async setupCollaborationCommunication(
    team: AgentTeam,
    plan: AgentPlan
  ): Promise<void> {
    // Set up communication channels for the team
    const collaborationMessage: AgentMessage = {
      id: nanoid(),
      from: 'coordination_system',
      to: 'broadcast',
      type: 'coordination',
      content: {
        type: 'collaboration_setup',
        team,
        plan,
        communication_protocol: {
          progress_updates: 'every_5_minutes',
          error_reporting: 'immediate',
          completion_notification: 'immediate',
        },
      },
      timestamp: new Date(),
      priority: 2,
    };

    // Send to all team members
    for (const agentId of team.agentIds) {
      const message = { ...collaborationMessage, to: agentId };
      await this.sendMessage(message);
    }
  }

  // Conflict resolution methods
  private async resolveResourceConflict(
    conflict: CoordinationConflict
  ): Promise<any> {
    // Implement resource scheduling or alternative resource allocation
    return {
      type: 'resource_scheduling',
      solution: 'Time-based resource sharing implemented',
      priority_queue: conflict.involvedAgents.sort(),
    };
  }

  private async resolveGoalConflict(
    conflict: CoordinationConflict
  ): Promise<any> {
    // Implement goal prioritization or goal merging
    return {
      type: 'goal_prioritization',
      solution: 'Goals prioritized based on urgency and importance',
      priority_order: conflict.involvedAgents,
    };
  }

  private async resolvePriorityConflict(
    conflict: CoordinationConflict
  ): Promise<any> {
    // Implement priority arbitration
    return {
      type: 'priority_arbitration',
      solution: 'Priority levels adjusted based on system-wide optimization',
      new_priorities: conflict.involvedAgents.map((id, index) => ({
        agentId: id,
        priority: index + 1,
      })),
    };
  }

  private async resolveCapabilityConflict(
    conflict: CoordinationConflict
  ): Promise<any> {
    // Implement capability delegation or skill sharing
    return {
      type: 'capability_sharing',
      solution: 'Capabilities shared or delegated between agents',
      sharing_arrangement: conflict.involvedAgents,
    };
  }

  private async resolveGenericConflict(
    conflict: CoordinationConflict
  ): Promise<any> {
    // Generic conflict resolution
    return {
      type: 'generic_resolution',
      solution: 'Conflict resolved through mediation',
      mediation_result: 'Compromise reached between involved parties',
    };
  }

  private async handleCoordinationMessage(
    message: AgentMessage
  ): Promise<void> {
    this.logger.debug(`Handling coordination message from ${message.from}`);
    // Process coordination-specific messages
  }

  private async handleRequestMessage(message: AgentMessage): Promise<void> {
    this.logger.debug(`Handling request message from ${message.from}`);
    // Process request messages
  }

  private async handleResponseMessage(message: AgentMessage): Promise<void> {
    this.logger.debug(`Handling response message from ${message.from}`);
    // Process response messages
  }
}
