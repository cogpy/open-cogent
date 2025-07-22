import {
  StreamObject,
  StreamObjectPure,
  StreamObjectToolResult,
} from '../providers';

export function duplicateToolStream(
  toolCallId: string,
  originalStream: AsyncIterable<StreamObject>,
  targetStream: WritableStream<StreamObjectToolResult>
): ReadableStream<StreamObject> {
  const aiStream = ReadableStream.from(originalStream);
  const [branchA, branchB] = aiStream.tee();

  const transformStream = new TransformStream<
    StreamObjectPure,
    StreamObjectToolResult
  >({
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

export async function duplicateStreamObjectStream(
  toolCallId: string,
  originalStream: AsyncIterable<StreamObject>,
  targetStream: WritableStream<StreamObjectToolResult>
): Promise<string> {
  const aiStream = duplicateToolStream(
    toolCallId,
    originalStream,
    targetStream
  );

  let content = '';

  for await (const chunk of aiStream) {
    if (chunk.type === 'text-delta') {
      content += chunk.textDelta;
    }
  }
  return content;
}
