import { Module } from '@nestjs/common';

import { ElectronIpcModule } from '../../ipc';
import { ClaudeCodeModule } from './claude-code';
import { HelperProcessModule } from './helper-process';
import { MiscModule } from './misc';
import { StateModule } from './state';
import { WindowsModule } from './windows';

@Module({
  imports: [
    ElectronIpcModule.forMain(),
    HelperProcessModule,
    WindowsModule,
    MiscModule,
    ClaudeCodeModule,
    StateModule,
  ],
})
export class AppModule {}
