import { Sandbox } from '@e2b/code-interpreter';
import { Logger } from '@nestjs/common';
import { tool } from 'ai';
import { z } from 'zod';

import { Config } from '../../../base';
import { StreamObjectToolResult } from '../providers';
import { toolError } from './error';

const logger = new Logger('E2bPythonSandboxTool');

export const createE2bPythonSandboxTool = (
  toolStream: WritableStream<StreamObjectToolResult>,
  config: Config
) => {
  return tool({
    description:
      'Execute a complete, standalone Python script in a secure E2B sandbox. The code should be self-contained and runnable as a single file. Each execution uses a fresh environment',
    parameters: z.object({
      code: z.string().describe('The Python code to execute in the sandbox.'),
    }),
    execute: async ({ code }, { toolCallId, abortSignal }) => {
      try {
        const writer = toolStream.getWriter();
        const { key } = config.copilot.e2b;
        console.log('e2b-python-sandbox-tool', code);

        if (!key) {
          return toolError(
            'E2B API Key Not Configured',
            'Please configure the E2B API key in the copilot settings.'
          );
        }

        // Create sandbox with API key
        const sbx = await Sandbox.create({
          apiKey: key,
        });

        // Execute the Python code
        const execution = await sbx.runCode(code, {
          onError: async error => {
            await writer.write({
              type: 'tool-incomplete-result',
              toolCallId,
              data: {
                type: 'text-delta',
                textDelta: `${error.name} ${error.value}`,
              },
            });
          },
          onStdout: async data => {
            await writer.write({
              type: 'tool-incomplete-result',
              toolCallId,
              data: {
                type: 'text-delta',
                textDelta: data.line,
              },
            });
          },
          onStderr: async data => {
            await writer.write({
              type: 'tool-incomplete-result',
              toolCallId,
              data: {
                type: 'text-delta',
                textDelta: data.line,
              },
            });
          },
        });

        writer.releaseLock();

        return {
          error: execution.error,
          result: execution.results,
        };
      } catch (e: any) {
        return toolError('E2B Python Sandbox Failed', e.message);
      }
    },
  });
};
