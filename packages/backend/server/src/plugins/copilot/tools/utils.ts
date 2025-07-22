import { Logger } from '@nestjs/common';

import {
  StreamObject,
  StreamObjectPure,
  StreamObjectToolResult,
} from '../providers';

const logger = new Logger('CopilotToolsUtils');

export function duplicateToolStream(
  toolCallId: string,
  originalStream: AsyncIterable<StreamObject>,
  targetStream: WritableStream<StreamObjectToolResult>,
  abortSignal?: AbortSignal
): { branch: ReadableStream<StreamObject>; done: Promise<void> } {
  const aiStream = ReadableStream.from(originalStream);
  const [branchA, branchB] = aiStream.tee();

  const transformStream = new TransformStream<
    StreamObjectPure,
    StreamObjectToolResult
  >({
    transform(chunk, controller) {
      if (abortSignal?.aborted) {
        controller.error(new Error('Operation aborted'));
        return;
      }
      controller.enqueue({
        type: 'tool-incomplete-result',
        toolCallId,
        data: chunk,
      });
    },
    flush() {
      logger.verbose(`Tool stream ${toolCallId} completed`);
    },
  });

  const pipelineDone = branchA
    .pipeThrough(transformStream)
    .pipeTo(targetStream, { signal: abortSignal })
    .catch(err => {
      if (!abortSignal?.aborted) {
        logger.warn(`Tool stream ${toolCallId} pipeline error: ${err}`);
      }
      throw err;
    });

  return { branch: branchB, done: pipelineDone };
}

export async function duplicateStreamObjectStream(
  toolCallId: string,
  originalStream: AsyncIterable<StreamObject>,
  targetStream: WritableStream<StreamObjectToolResult>,
  abortSignal?: AbortSignal
): Promise<string> {
  const { branch: aiStream, done: pipelineDone } = duplicateToolStream(
    toolCallId,
    originalStream,
    targetStream,
    abortSignal
  );

  let content = '';
  const reader = aiStream.getReader();

  const readBranchB = (async () => {
    try {
      while (true) {
        if (abortSignal?.aborted) throw new Error('Operation aborted');
        const { done, value } = await reader.read();
        if (done) break;
        if (value.type === 'text-delta') content += value.textDelta;
      }
    } finally {
      logger.verbose(`Tool stream ${toolCallId} read completed`);
      reader.releaseLock();
    }
  })();

  try {
    await Promise.all([readBranchB, pipelineDone]);
    return content;
  } catch (err) {
    try {
      await targetStream.abort();
    } catch (_) {
      /* ignore */
    }
    throw err;
  }
}
