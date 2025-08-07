import { Module } from '@nestjs/common';

import { ClaudeCodeService } from './claude-code.service';

@Module({
  providers: [ClaudeCodeService],
})
export class ClaudeCodeModule {}
