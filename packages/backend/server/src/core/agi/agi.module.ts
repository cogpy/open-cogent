import { Module } from '@nestjs/common';

import { AGISystemService } from '../agi-system.service';
import { AgentModule } from '../agent';
import { AGIResolver } from './agi.resolver';

/**
 * AGI System Module
 *
 * Integrates the complete Autonomous General Intelligence system including:
 * - AGI System orchestration
 * - Agent lifecycle management
 * - Multi-agent coordination
 * - GraphQL API for system control
 */
@Module({
  imports: [AgentModule],
  providers: [AGISystemService, AGIResolver],
  exports: [AGISystemService, AGIResolver],
})
export class AGIModule {}
