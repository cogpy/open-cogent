import {
  StreamObject,
  StreamObjectPure,
  StreamObjectToolResult,
} from '../providers';

export function duplicateToolStream(
  toolCallId: string,
  stream: AsyncIterable<StreamObject>,
  targetStream: WritableStream<StreamObjectToolResult>
): ReadableStream<StreamObject> {
  const aiStream = ReadableStream.from(stream);
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
