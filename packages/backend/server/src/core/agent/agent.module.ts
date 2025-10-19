import { Module } from '@nestjs/common';

import { AutonomousAgent } from './agent.service';
import { AgentCoordinationService } from './coordination';
import { AgentLifecycleManager } from './lifecycle';
import { AgentMemoryManager } from './memory';
import { AgentPlanningEngine } from './planning';

/**
 * Autonomous Agent Module
 *
 * Provides the complete AGI agent framework including:
 * - Agent lifecycle management
 * - Autonomous planning and execution
 * - Advanced memory systems
 * - Multi-agent coordination
 * - Real-time monitoring and control
 */
@Module({
  providers: [
    // Core agent services
    AutonomousAgent,
    AgentLifecycleManager,
    AgentPlanningEngine,
    AgentMemoryManager,
    AgentCoordinationService,
  ],
  exports: [
    AutonomousAgent,
    AgentLifecycleManager,
    AgentPlanningEngine,
    AgentMemoryManager,
    AgentCoordinationService,
  ],
})
export class AgentModule {}
