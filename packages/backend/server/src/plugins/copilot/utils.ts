import { Readable } from 'node:stream';

import type { Request } from 'express';

import { readBufferWithLimit } from '../../base';
import { MAX_EMBEDDABLE_SIZE } from './types';

export function readStream(
  readable: Readable,
  maxSize = MAX_EMBEDDABLE_SIZE
): Promise<Buffer> {
  return readBufferWithLimit(readable, maxSize);
}

type RequestClosedCallback = (isAborted: boolean) => void;
type SignalReturnType = {
  signal: AbortSignal;
  onConnectionClosed: (cb: RequestClosedCallback) => void;
};

export function getSignal(req: Request): SignalReturnType {
  const controller = new AbortController();

  let hasEnded = false;
  let callback: ((isAborted: boolean) => void) | undefined = undefined;

  const onSocketEnd = () => {
    hasEnded = true;
  };
  const onSocketClose = (hadError: boolean) => {
    req.socket.off('end', onSocketEnd);
    req.socket.off('close', onSocketClose);
    // NOTE: the connection is considered abnormally interrupted:
    // 1. there is an error when the socket is closed.
    // 2. the connection is closed directly without going through the normal end process (the client disconnects actively).
    const aborted = hadError || !hasEnded;
    if (aborted) {
      controller.abort();
    }

    callback?.(aborted);
  };

  req.socket.on('end', onSocketEnd);
  req.socket.on('close', onSocketClose);

  return {
    signal: controller.signal,
    onConnectionClosed: cb => (callback = cb),
  };
}

export function mergeStream<F, S>(
  first: ReadableStream<F>,
  second: ReadableStream<S>
): ReadableStream<F | S> {
  const readers = [first, second].map(stream => stream.getReader());

  return new ReadableStream({
    async pull(controller) {
      const { value, done, idx } = await Promise.race(
        readers.map((r, i) => r.read().then(res => ({ ...res, idx: i })))
      );

      if (done) {
        readers.splice(idx, 1);
        // close the controller if all readers are done or first reader is done
        if (readers.length === 0 || idx === 0) controller.close();
        return;
      }
      controller.enqueue(value);
    },
    cancel() {
      readers.forEach(r => r.cancel());
    },
  });
}
