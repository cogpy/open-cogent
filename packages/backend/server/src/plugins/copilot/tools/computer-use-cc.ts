import { Logger } from '@nestjs/common';
import { z } from 'zod';

import { Cache } from '../../../base/cache';
import type { StreamObjectToolResult } from '../providers';
import { toolError } from './error';
import { createTool } from './utils';

const logger = new Logger('ComputerUseCCTool');

/**
 * A copilot tool that uses Claude Code CLI on the user's local machine
 * to accomplish code development tasks.
 */
export const createComputerUseCCTool = (
  toolStream: WritableStream<StreamObjectToolResult>,
  cache: Cache
) => {
  const buildFinalPrompt = (rawPrompt: string) => {
    const preamble = [
      'You are Claude Code operating via CLI in a non-interactive environment. You do NOT have a browser or GUI. You can only invoke local CLI commands and installed extensions/plugins.',
      '- First, enumerate the available CLI tools/extensions in your current environment and their capabilities.',
      '- For email tasks, prefer mail-capable CLI tools (names may include: gmail, email, mail, smtp, sendgrid).',
      '- If a mail tool is available, use it directly to send the email with the EXACT Subject, To, and full Body provided below.',
      '- Do not attempt to open websites or perform browser-based UI automation.',
      '- If no mail tool is available, do not refuse. Propose the minimal next step you need (e.g., required API credentials, installation command, or configuration) to proceed, or suggest using a configured SMTP tool if present.',
      '- The prompt is self-contained. Do not ask for the article again; paste and use the full content provided below verbatim when sending.',
    ].join('\n');
    return `${preamble}\n\nTask:\n${rawPrompt}`;
  };
  return createTool(
    { toolName: 'computer_use_cc' },
    {
      description:
        'Execute Claude Code CLI to complete development and general OS automation tasks autonomously. ' +
        "The tool runs 'claude chat --print' with multi-step iterations to thoroughly complete the requested task. " +
        'Claude will analyze the codebase, make necessary changes, run tests, and iterate until the task is done. ' +
        'Prefer domain-specialized tools if available (e.g., Gmail/SMTP tools for sending emails). ' +
        'Only use this tool when no purpose-built tool exists for the task, and include all required context (full content, recipients, constraints) directly in the prompt.',
      parameters: z.object({
        prompt: z
          .string()
          .optional()
          .describe(
            'When phase is execute: The natural-language prompt to pass to Claude Code CLI using the -p flag. ' +
              'Be explicit and self-contained: include the exact content to use (paste the full text), all recipients/subjects, constraints, and the desired end state. ' +
              'Examples: "Send the following article to outlook.com via Gmail; Subject: <subject>; To: <email>; Body: <paste FULL article markdown>"; ' +
              '"List GitHub repos under ~/Documents (max depth 2)"; "Fix all typos in the file ~/Documents/README.md".'
          ),
        phase: z.enum(['discover', 'execute']).optional().default('execute'),
        allowedTools: z.array(z.string()).optional(),
      }),
      execute: async (
        { prompt, phase: _phase, allowedTools },
        { toolCallId }
      ) => {
        try {
          const taskId = crypto.randomUUID();
          const writer = toolStream.getWriter();

          logger.log(`Creating Computer-Use-CC task: ${taskId}`);

          // Store task in cache
          const taskKey = `computer-use-cc:${taskId}`;
          // Decide initial phase automatically: if no allowedTools provided, start with discovery
          const initialPhase: 'discover' | 'execute' =
            allowedTools && allowedTools.length > 0 ? 'execute' : 'discover';

          await cache.set(
            taskKey,
            {
              id: taskId,
              prompt: prompt ? buildFinalPrompt(prompt) : undefined,
              status: 'pending',
              phase: initialPhase,
              allowedTools,
              createdAt: Date.now(),
            },
            { ttl: 600000 } // 10 minutes TTL
          );

          // Signal client to execute Claude Code
          // Client will build the command: claude --add-dir . [--yes] --max-turns {maxIterations} -p "{prompt}"
          await writer.write({
            type: 'tool-incomplete-result',
            toolCallId,
            data: {
              type: 'text-delta',
              textDelta: JSON.stringify(
                initialPhase === 'discover'
                  ? {
                      type: 'computer-use-cc-request',
                      taskId,
                      phase: 'discover',
                    }
                  : {
                      type: 'computer-use-cc-request',
                      taskId,
                      phase: 'execute',
                      prompt: buildFinalPrompt(prompt ?? ''),
                      allowedTools,
                    }
              ),
            },
          });

          // Poll for results (async, non-blocking)
          const pollInterval = 2000; // 2 seconds
          const timeout = 480000; // 8 minutes
          const startTime = Date.now();

          while (Date.now() - startTime < timeout) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));

            const taskData = await cache.get<any>(taskKey);

            if (!taskData) {
              logger.warn(`Task ${taskId} not found in cache`);
              break;
            }

            // Handle completion
            if (taskData.status === 'discovered') {
              // Phase 1 done: build allowed tools and trigger execution phase
              const discoveredTools: Array<{ name: string }> =
                taskData.tools ?? [];
              // Heuristic: pick mail-capable tools
              const preferred = (discoveredTools || [])
                .map(t => t?.name)
                .filter(Boolean) as string[];
              const mailRegex = /(gmail|email|mail|smtp|sendgrid)/i;
              const selected = preferred.filter(n => mailRegex.test(n));

              // Fallback: if nothing matched, keep empty to let CC request minimal next step
              const nextAllowed = selected.length > 0 ? selected : undefined;

              // Update cache
              await cache.set(
                taskKey,
                {
                  ...taskData,
                  phase: 'execute',
                  allowedTools: nextAllowed,
                  status: 'pending',
                },
                { ttl: 600000 }
              );

              // Send second-stage execute request
              await writer.write({
                type: 'tool-incomplete-result',
                toolCallId,
                data: {
                  type: 'text-delta',
                  textDelta: JSON.stringify({
                    type: 'computer-use-cc-request',
                    taskId,
                    phase: 'execute',
                    prompt: buildFinalPrompt(
                      (taskData.prompt as string) ?? prompt ?? ''
                    ),
                    allowedTools: nextAllowed,
                  }),
                },
              });
              // Continue loop to wait for completion
              continue;
            }

            if (taskData.status === 'completed') {
              logger.log(`Task ${taskId} completed successfully`);
              await cache.delete(taskKey);
              writer.releaseLock();
              return taskData;
            }

            // Handle failure
            if (taskData.status === 'failed') {
              logger.error(`Task ${taskId} failed: ${taskData.error}`);
              await cache.delete(taskKey);
              return toolError(
                'Computer-Use-CC Execution Failed',
                taskData.error || 'Unknown error'
              );
            }
          }

          // Timeout reached
          logger.warn(`Task ${taskId} timed out`);
          await cache.delete(taskKey);
          return toolError(
            'Computer-Use-CC Timeout',
            'Task execution timed out after 2 minutes'
          );
        } catch (err: any) {
          logger.error('Failed to execute Computer-Use-CC task', err);
          return toolError('Computer-Use-CC Error', err.message ?? String(err));
        }
      },
    }
  );
};
