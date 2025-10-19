import {
  Args,
  Field,
  ID,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { Injectable, Logger } from '@nestjs/common';

import { AGISystemService } from '../agi-system.service';
import { CurrentUser } from '../auth';
import { AgentLifecycleManager } from '../agent';

@ObjectType()
class AgentInfo {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  type: string;

  @Field()
  status: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => [String])
  capabilities: string[];
}

@ObjectType()
class SystemStatus {
  @Field()
  running: boolean;

  @Field()
  uptime: number;

  @Field(() => String)
  metrics: string; // JSON stringified

  @Field(() => String)
  agentStats: string; // JSON stringified

  @Field(() => String)
  goalStats: string; // JSON stringified
}

@ObjectType()
class GoalResponse {
  @Field(() => ID)
  id: string;

  @Field()
  description: string;

  @Field()
  status: string;
}

@InputType()
class CreateAgentInput {
  @Field()
  name: string;

  @Field(() => [String])
  capabilities: string[];

  @Field()
  purpose: string;

  @Field({ nullable: true })
  type?: string;
}

@InputType()
class SubmitGoalInput {
  @Field()
  description: string;

  @Field({ defaultValue: 5 })
  priority: number;
}

@InputType()
class UpdateSystemConfigInput {
  @Field({ nullable: true })
  maxAgents?: number;

  @Field({ nullable: true })
  autoSpawnAgents?: boolean;

  @Field({ nullable: true })
  goalDiscoveryEnabled?: boolean;

  @Field({ nullable: true })
  selfImprovementEnabled?: boolean;

  @Field({ nullable: true })
  coordinationEnabled?: boolean;

  @Field(() => [String], { nullable: true })
  safetyConstraints?: string[];
}

/**
 * GraphQL Resolver for AGI System
 */
@Resolver()
@Injectable()
export class AGIResolver {
  private readonly logger = new Logger(AGIResolver.name);

  constructor(
    private readonly agiSystem: AGISystemService,
    private readonly agentLifecycle: AgentLifecycleManager
  ) {}

  @Query(() => SystemStatus, { description: 'Get current AGI system status' })
  async agiSystemStatus(): Promise<SystemStatus> {
    const status = this.agiSystem.getSystemStatus();

    return {
      running: status.running,
      uptime: status.uptime,
      metrics: JSON.stringify(status.metrics),
      agentStats: JSON.stringify(status.agents),
      goalStats: JSON.stringify(status.goals),
    };
  }

  @Query(() => [AgentInfo], { description: 'List all active agents' })
  async listAgents(): Promise<AgentInfo[]> {
    const agents = this.agentLifecycle.listAgents();

    return agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      status: agent.status,
      createdAt: new Date(), // Would come from database in full implementation
      capabilities: agent.capabilities.map(c => c.name),
    }));
  }

  @Query(() => AgentInfo, { description: 'Get specific agent information' })
  async getAgent(
    @Args('agentId', { type: () => ID }) agentId: string
  ): Promise<AgentInfo> {
    const agent = this.agentLifecycle.getAgent(agentId);

    return {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      status: agent.status,
      createdAt: new Date(),
      capabilities: agent.capabilities.map(c => c.name),
    };
  }

  @Mutation(() => Boolean, { description: 'Start the AGI system' })
  async startAGISystem(@CurrentUser() user: any): Promise<boolean> {
    this.logger.log(`Starting AGI system requested by user: ${user?.id}`);
    await this.agiSystem.startSystem();
    return true;
  }

  @Mutation(() => Boolean, { description: 'Stop the AGI system' })
  async stopAGISystem(@CurrentUser() user: any): Promise<boolean> {
    this.logger.log(`Stopping AGI system requested by user: ${user?.id}`);
    await this.agiSystem.stopSystem();
    return true;
  }

  @Mutation(() => GoalResponse, {
    description: 'Submit a goal to the AGI system',
  })
  async submitGoal(
    @Args('input') input: SubmitGoalInput,
    @CurrentUser() user: any
  ): Promise<GoalResponse> {
    this.logger.log(`Goal submitted by user ${user?.id}: ${input.description}`);

    const goalId = await this.agiSystem.submitGoal(
      input.description,
      input.priority
    );

    return {
      id: goalId,
      description: input.description,
      status: 'pending',
    };
  }

  @Mutation(() => AgentInfo, { description: 'Create a new specialized agent' })
  async createAgent(
    @Args('input') input: CreateAgentInput,
    @CurrentUser() user: any
  ): Promise<AgentInfo> {
    this.logger.log(
      `Agent creation requested by user ${user?.id}: ${input.name}`
    );

    const agent = await this.agiSystem.createSpecializedAgent(
      input.name,
      input.capabilities,
      input.purpose
    );

    return {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      status: agent.status,
      createdAt: new Date(),
      capabilities: agent.capabilities.map(c => c.name),
    };
  }

  @Mutation(() => Boolean, { description: 'Pause an agent' })
  async pauseAgent(
    @Args('agentId', { type: () => ID }) agentId: string,
    @CurrentUser() user: any
  ): Promise<boolean> {
    this.logger.log(`Agent pause requested by user ${user?.id}: ${agentId}`);
    await this.agentLifecycle.pauseAgent(agentId);
    return true;
  }

  @Mutation(() => Boolean, { description: 'Resume an agent' })
  async resumeAgent(
    @Args('agentId', { type: () => ID }) agentId: string,
    @CurrentUser() user: any
  ): Promise<boolean> {
    this.logger.log(`Agent resume requested by user ${user?.id}: ${agentId}`);
    await this.agentLifecycle.resumeAgent(agentId);
    return true;
  }

  @Mutation(() => Boolean, { description: 'Terminate an agent' })
  async terminateAgent(
    @Args('agentId', { type: () => ID }) agentId: string,
    @CurrentUser() user: any
  ): Promise<boolean> {
    this.logger.log(
      `Agent termination requested by user ${user?.id}: ${agentId}`
    );
    await this.agentLifecycle.terminateAgent(agentId);
    return true;
  }

  @Mutation(() => Boolean, { description: 'Update system configuration' })
  async updateSystemConfig(
    @Args('input') input: UpdateSystemConfigInput,
    @CurrentUser() user: any
  ): Promise<boolean> {
    this.logger.log(`System config update requested by user ${user?.id}`);

    const config: any = {};

    if (input.maxAgents !== undefined) {
      config.max_agents = input.maxAgents;
    }
    if (input.autoSpawnAgents !== undefined) {
      config.auto_spawn_agents = input.autoSpawnAgents;
    }
    if (input.goalDiscoveryEnabled !== undefined) {
      config.goal_discovery_enabled = input.goalDiscoveryEnabled;
    }
    if (input.selfImprovementEnabled !== undefined) {
      config.self_improvement_enabled = input.selfImprovementEnabled;
    }
    if (input.coordinationEnabled !== undefined) {
      config.coordination_enabled = input.coordinationEnabled;
    }
    if (input.safetyConstraints !== undefined) {
      config.safety_constraints = input.safetyConstraints;
    }

    this.agiSystem.updateConfig(config);
    return true;
  }

  @Mutation(() => Boolean, { description: 'Emergency stop all agents' })
  async emergencyStop(@CurrentUser() user: any): Promise<boolean> {
    this.logger.warn(`Emergency stop requested by user ${user?.id}`);
    await this.agentLifecycle.emergencyStop();
    return true;
  }

  @Query(() => String, { description: 'Get system health check' })
  async systemHealthCheck(): Promise<string> {
    const health = await this.agentLifecycle.healthCheck();
    return JSON.stringify(health);
  }
}
