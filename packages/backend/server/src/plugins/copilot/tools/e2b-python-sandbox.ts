import { createHash } from 'node:crypto';

import { Result, Sandbox } from '@e2b/code-interpreter';
import { Logger } from '@nestjs/common';
import { tool } from 'ai';
import { z } from 'zod';

import { Config } from '../../../base';
import { StreamObjectToolResult } from '../providers';
import { CopilotStorage } from '../storage';
import { toolError } from './error';

// Type definition for processed result
type ProcessedResult = {
  extra?: any;
  text?: string;
  html?: string;
  markdown?: string;
  svg?: string;
  png?: string; // Will contain URL instead of base64
  jpeg?: string; // Will contain URL instead of base64
  pdf?: string; // Will contain URL instead of base64
  latex?: string;
  json?: string;
  javascript?: string;
  data?: Record<string, unknown>;
  chart?: any;
  // Allow additional fields
  [key: string]: any;
};

const logger = new Logger('E2bPythonSandboxTool');

export const createE2bPythonSandboxTool = (
  toolStream: WritableStream<StreamObjectToolResult>,
  config: Config,
  copilotStorage: CopilotStorage,
  userId: string
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

        let processedResults: ProcessedResult[] = [];

        if (execution) {
          // Process execution results to extract and save binary data
          processedResults = await Promise.all(
            execution.results.map(async (result: Result) => {
              // Convert Result to JSON format
              const jsonResult = result.toJSON();

              // Create a mutable copy with index signature
              const processedResult: Record<string, any> = { ...jsonResult };

              // Define binary formats that need to be saved
              const binaryFormats = ['png', 'jpeg', 'pdf', 'svg'] as const;

              // Process each binary format
              for (const format of binaryFormats) {
                const value = processedResult[format];
                if (value && typeof value === 'string') {
                  try {
                    // Generate a unique key for the file
                    const fileHash = createHash('sha256')
                      .update(value)
                      .digest('hex');
                    const fileKey = `e2b-${format}-${fileHash}.${format}`;

                    // Convert base64 to buffer
                    const fileBuffer = Buffer.from(value, 'base64');

                    // Save the file using CopilotStorage
                    const fileUrl = await copilotStorage.put(
                      userId,
                      fileKey,
                      fileBuffer,
                      true
                    );

                    // Replace base64 data with URL
                    processedResult[format] = fileUrl;

                    logger.log(`Saved ${format} file: ${fileKey}`);
                  } catch (error) {
                    logger.error(`Failed to save ${format} file:`, error);
                    // Keep original data if saving fails
                  }
                }
              }

              // Special handling for extra field if it contains binary data
              if (
                processedResult.extra &&
                typeof processedResult.extra === 'object'
              ) {
                processedResult.extra = await processBinaryInExtra(
                  processedResult.extra,
                  userId,
                  copilotStorage,
                  logger
                );
              }

              return processedResult;
            })
          );
        }

        // Close sandbox
        if (sbx && typeof sbx.kill === 'function') {
          await sbx.kill();
        }

        console.log('processedResults', processedResults);

        return {
          error: execution.error,
          result: processedResults,
        };
      } catch (e: any) {
        return toolError('E2B Python Sandbox Failed', e.message);
      }
    },
  });
};

// Helper function to process binary data in extra field
async function processBinaryInExtra(
  extra: any,
  userId: string,
  copilotStorage: CopilotStorage,
  logger: Logger
): Promise<any> {
  if (Array.isArray(extra)) {
    return Promise.all(
      extra.map(item =>
        processBinaryInExtra(item, userId, copilotStorage, logger)
      )
    );
  }

  if (extra && typeof extra === 'object') {
    const processed: any = {};
    for (const [key, value] of Object.entries(extra)) {
      // Check if value looks like base64 binary data
      if (
        typeof value === 'string' &&
        value.length > 1000 && // Likely binary if large
        /^[A-Za-z0-9+/]+=*$/.test(value) // Base64 pattern
      ) {
        try {
          // Try to detect format from key or content
          const format = detectBinaryFormat(key, value);
          if (format) {
            const fileHash = createHash('sha256').update(value).digest('hex');
            const fileKey = `e2b-extra-${format}-${fileHash}.${format}`;
            const fileBuffer = Buffer.from(value, 'base64');

            const fileUrl = await copilotStorage.put(
              userId,
              fileKey,
              fileBuffer,
              true
            );

            processed[`${key}_url`] = fileUrl;
            logger.log(`Saved extra binary data as ${format}: ${fileKey}`);
          } else {
            processed[key] = value;
          }
        } catch (error) {
          logger.error('Failed to process extra binary data:', error);
          processed[key] = value;
        }
      } else if (value && typeof value === 'object') {
        processed[key] = await processBinaryInExtra(
          value,
          userId,
          copilotStorage,
          logger
        );
      } else {
        processed[key] = value;
      }
    }
    return processed;
  }

  return extra;
}

// Helper function to detect binary format from key name or content
function detectBinaryFormat(key: string, content: string): string | null {
  const keyLower = key.toLowerCase();

  // Check key for format hints
  if (keyLower.includes('png') || keyLower.includes('image')) return 'png';
  if (keyLower.includes('jpg') || keyLower.includes('jpeg')) return 'jpeg';
  if (keyLower.includes('pdf')) return 'pdf';
  if (keyLower.includes('svg')) return 'svg';

  // Check base64 header for format
  if (content.startsWith('iVBORw0KGgo')) return 'png'; // PNG magic number
  if (content.startsWith('/9j/')) return 'jpeg'; // JPEG magic number
  if (content.startsWith('JVBERi')) return 'pdf'; // PDF magic number
  if (content.includes('PHN2Zy')) return 'svg'; // SVG <svg tag in base64

  return null;
}
