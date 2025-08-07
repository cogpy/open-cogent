import {
  Body,
  Controller,
  Logger,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Cache } from '../../../base/cache';
import { AuthGuard, CurrentUser } from '../../../core/auth';
import { UserType } from '../../../core/user';

const logger = new Logger('ComputerUseCCController');

interface TaskCallbackDto {
  taskId: string;
  output?: string;
  status: 'completed' | 'failed' | 'discovered';
  error?: string;
  phase?: 'discover' | 'execute';
  tools?: Array<{
    name: string;
    title?: string;
    serverId?: string;
    vendor?: string;
  }>;
}

@Controller('api/copilot/computer-use-cc')
@UseGuards(AuthGuard)
export class ComputerUseCCController {
  constructor(private readonly cache: Cache) {}

  @Post('callback')
  async handleCallback(
    @Body() body: TaskCallbackDto,
    @CurrentUser() _user: UserType
  ) {
    const { taskId, output, status, error } = body;
    const taskKey = `computer-use-cc:${taskId}`;

    logger.log(`Received callback for task ${taskId}: ${status}`);

    const task = await this.cache.get<any>(taskKey);

    if (!task) {
      logger.warn(`Task ${taskId} not found`);
      throw new NotFoundException('Task not found');
    }

    // TODO: Add user validation when user context is available in task
    // For now, we'll allow any authenticated user to update tasks

    // Update task status
    const updatedTask = {
      ...task,
      status,
      output,
      error,
      phase: body.phase ?? task.phase,
      tools: body.tools ?? task.tools,
      updatedAt: Date.now(),
    };

    await this.cache.set(taskKey, updatedTask, { ttl: 300000 });

    logger.log(`Task ${taskId} updated to status: ${status}`);

    return { success: true };
  }
}
