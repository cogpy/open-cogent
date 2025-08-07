import { Module } from '@nestjs/common';

import { CacheModule } from '../../../base/cache';
import { ComputerUseCCController } from './controller';

@Module({
  imports: [CacheModule],
  controllers: [ComputerUseCCController],
  providers: [],
  exports: [],
})
export class ComputerUseCCModule {}

export { ComputerUseCCController } from './controller';
