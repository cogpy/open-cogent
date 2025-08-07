import { Loading } from '@afk/component';
import { apis } from '@afk/electron-api';
import { useEffect } from 'react';

import { GenericToolCalling } from './generic-tool-calling';

// Maintain a set to avoid duplicate IPC invocations for the same task
const started = new Set<string>();

type ComputerUseCCRequest = Parameters<typeof apis.claudeCode.execute>[0];
type ComputerUseCCRequests = ComputerUseCCRequest | ComputerUseCCRequest[];

export function ComputerUseCCCalling({
  request,
}: {
  request: ComputerUseCCRequests;
}) {
  useEffect(() => {
    const requests = Array.isArray(request) ? request : [request];
    for (const req of requests) {
      const key = req?.taskId
        ? `${req.taskId}:${req.phase ?? 'execute'}`
        : undefined;
      if (!req?.taskId || (key && started.has(key))) continue;
      if (key) started.add(key);
      apis.claudeCode.execute(req).catch(err => {
        console.error('Failed to run Claude Code task', err);
      });
    }
  }, [request]);

  const latest = Array.isArray(request) ? request[request.length - 1] : request;

  const isDiscover = latest?.phase === 'discover';
  const allowed = Array.isArray(latest?.allowedTools)
    ? latest.allowedTools
    : [];
  const toolsText = allowed.length > 0 ? allowed.join(', ') : 'none';
  const title = isDiscover
    ? 'Claude Code (Step 1/2): Discovering available tools…'
    : `Claude Code (Step 2/2): Executing${
        allowed.length ? ` with tools: ${toolsText}` : ''
      }…`;

  return <GenericToolCalling icon={<Loading />} title={title} />;
}
