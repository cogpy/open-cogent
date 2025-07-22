import { StreamObject } from '../providers';
import { ToolStreamObject } from './types';

export function duplicateToolStream(
  toolCallId: string,
  stream: AsyncIterable<StreamObject>,
  targetStream: WritableStream<ToolStreamObject>
): ReadableStream<StreamObject> {
  const aiStream = ReadableStream.from(stream);
  const [branchA, branchB] = aiStream.tee();

  const transformStream = new TransformStream<StreamObject, ToolStreamObject>({
    transform: (chunk, controller) => {
      controller.enqueue({
        type: 'tool-incomplete-result',
        toolCallId,
        data: chunk,
      });
    },
  });

  branchA.pipeThrough(transformStream).pipeTo(targetStream);

  return branchB;
}
