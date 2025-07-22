import { Logger } from '@nestjs/common';

import {
  StreamObject,
  StreamObjectPure,
  StreamObjectToolResult,
} from '../providers';

const logger = new Logger('CopilotToolsUtils');

const MIN_LEN_BUFFER = 16;

export function duplicateToolStream(
  toolCallId: string,
  originalStream: AsyncIterable<StreamObject>,
  targetStream: WritableStream<StreamObjectToolResult>,
  abortSignal?: AbortSignal
): { branch: ReadableStream<StreamObject>; done: Promise<void> } {
  const aiStream = ReadableStream.from(originalStream);
  const [branchA, branchB] = aiStream.tee();

  let pending = '';

  const transformStream = new TransformStream<
    StreamObjectPure,
    StreamObjectToolResult
  >({
    transform(chunk, controller) {
      if (abortSignal?.aborted) {
        controller.error(new Error('Operation aborted'));
        return;
      }

      if (chunk.type === 'text-delta') {
        pending += chunk.textDelta;

        if (pending.length >= MIN_LEN_BUFFER) {
          controller.enqueue({
            type: 'tool-incomplete-result',
            toolCallId,
            data: { type: 'text-delta', textDelta: pending },
          });
          pending = '';
        }
      } else {
        controller.enqueue({
          type: 'tool-incomplete-result',
          toolCallId,
          data: chunk,
        });
      }
    },

    flush(controller) {
      if (pending.length > 0) {
        controller.enqueue({
          type: 'tool-incomplete-result',
          toolCallId,
          data: { type: 'text-delta', textDelta: pending },
        });
        pending = '';
      }
      logger.verbose(`Tool stream ${toolCallId} completed`);
    },
  });

  const pipelineDone = branchA
    .pipeThrough(transformStream)
    .pipeTo(targetStream, { signal: abortSignal, preventClose: true })
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
  toolStream: WritableStream<StreamObject>,
  abortSignal?: AbortSignal
): Promise<string> {
  const { branch: aiStream, done: pipelineDone } = duplicateToolStream(
    toolCallId,
    originalStream,
    toolStream,
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

  await Promise.all([readBranchB, pipelineDone]);

  return content;
}
