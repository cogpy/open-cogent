import { Logger } from '@nestjs/common';
import { tool } from 'ai';
import { z } from 'zod';

import { toolError } from './error';

const logger = new Logger('BrowserUseTool');

const BROWSER_USE_API_URL = 'https://api.browser-use.com/api/v1';
const BROWSER_USE_API_KEY = 'bu_CG7O6Zu5IRfb2O5tzNGi3_A5_5Kc_m4lqaNkTuSAnV4';

interface BrowserUseTaskResponse {
  id: string;
}

interface BrowserUseScreenshotsResponse {
  screenshots: string[];
}

interface BrowserUseGifResponse {
  gif: string;
}

interface BrowserUseOutputFileResponse {
  download_url: string;
}

interface BrowserUseStepsResponse {
  id: string;
  task: string;
  output: string | null;
  status: 'created' | 'running' | 'finished' | 'stopped' | 'paused' | 'failed';
  created_at: string;
  steps: Array<{
    id: string;
    step: number;
    evaluation_previous_goal: string;
    next_goal: string;
    url: string;
    live_url: string | null;
    finished_at: string | null;
    browser_data: {
      cookies: Array<{
        name: string;
        value: string;
        domain: string;
        path: string;
        expires: number | null;
        httpOnly: boolean;
        secure: boolean;
        sameSite: string;
      }>;
    } | null;
  }>;
  finished_at: string | null;
  browser_data: {
    cookies: Array<{
      name: string;
      value: string;
      domain: string;
      path: string;
      expires: number | null;
      httpOnly: boolean;
      secure: boolean;
      sameSite: string;
    }>;
  } | null;
  user_uploaded_files: string[] | null;
  output_files: string[] | null;
  public_share_url: string | null;
}

/**
 * Downloads and parses markdown content from a URL
 */
async function downloadMarkdownContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      logger.warn(
        `Failed to download markdown from ${url}: ${response.statusText}`
      );
      return null;
    }

    const content = await response.text();
    return content;
  } catch (error: any) {
    logger.error(`Error downloading markdown from ${url}:`, error);
    return null;
  }
}

/**
 * A copilot tool that uses browser-use API to accomplish web tasks.
 * It creates a task, polls for status, and returns screenshots and markdown results.
 */
export const createBrowserUseTool = () => {
  return tool({
    description:
      'Use the browser to accomplish a task, return the markdown file and the screenshot of the browser',
    parameters: z.object({
      task_description: z.string().describe('The task to accomplish'),
    }),
    execute: async ({ task_description }) => {
      try {
        // Step 1: Create the task
        const taskResponse = await fetch(`${BROWSER_USE_API_URL}/run-task`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${BROWSER_USE_API_KEY}`,
          },
          body: JSON.stringify({
            task:
              task_description + ' The final result is saved using result.md',
            save_browser_data: true,
            llm_model: 'claude-sonnet-4-20250514',
            use_adblock: true,
            use_proxy: true,
            proxy_country_code: 'us',
            highlight_elements: true,
            browser_viewport_width: 1280,
            browser_viewport_height: 960,
            enable_public_share: true,
          }),
        });

        if (!taskResponse.ok) {
          throw new Error(`Failed to create task: ${taskResponse.statusText}`);
        }

        const taskData: BrowserUseTaskResponse =
          (await taskResponse.json()) as BrowserUseTaskResponse;
        const taskId = taskData.id;

        // Step 2: Poll for status and screenshots
        let currentStatus: string = 'created';
        let currentScreenshot: string | null = null;
        let finalGif: string | null = null;
        let finalMarkdown: string | null = null;
        let stepsInfo: {
          next_goal: string;
          url: string;
        }[] = [];

        while (currentStatus === 'created' || currentStatus === 'running') {
          // Wait 3 seconds before polling
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Get status
          const statusResponse = await fetch(
            `${BROWSER_USE_API_URL}/task/${taskId}/status`,
            {
              headers: {
                Authorization: `Bearer ${BROWSER_USE_API_KEY}`,
              },
            }
          );

          if (!statusResponse.ok) {
            throw new Error(
              `Failed to get task status: ${statusResponse.statusText}`
            );
          }

          const statusData: string = await statusResponse.text();
          currentStatus = statusData.replace(/"/g, ''); // 去掉双引号

          if (currentStatus === 'stopped' || currentStatus === 'failed') {
            return toolError(
              'Browser Use Task Failed',
              `Task ${currentStatus}`
            );
          }

          // if (currentStatus === 'created' || currentStatus === 'running') {
          //   // Get screenshots
          //   const screenshotsResponse = await fetch(`${BROWSER_USE_API_URL}/task/${taskId}/screenshots`, {
          //     headers: {
          //       'Authorization': `Bearer ${BROWSER_USE_API_KEY}`,
          //     },
          //   });

          //   if (screenshotsResponse.ok) {
          //     const screenshotsData: BrowserUseScreenshotsResponse = await screenshotsResponse.json() as BrowserUseScreenshotsResponse;
          //     if (screenshotsData.screenshots && screenshotsData.screenshots.length > 0) {
          //       currentScreenshot = screenshotsData.screenshots[screenshotsData.screenshots.length - 1];
          //     }
          //   }
          // }

          if (currentStatus === 'finished') {
            // Get final results
            const gifResponse = await fetch(
              `${BROWSER_USE_API_URL}/task/${taskId}/gif`,
              {
                headers: {
                  Authorization: `Bearer ${BROWSER_USE_API_KEY}`,
                },
              }
            );

            if (gifResponse.ok) {
              const gifData: BrowserUseGifResponse =
                (await gifResponse.json()) as BrowserUseGifResponse;
              finalGif = gifData.gif;
            }

            const outputFileResponse = await fetch(
              `${BROWSER_USE_API_URL}/task/${taskId}/output-file/result.md`,
              {
                headers: {
                  Authorization: `Bearer ${BROWSER_USE_API_KEY}`,
                },
              }
            );

            if (outputFileResponse.ok) {
              const outputFileData: BrowserUseOutputFileResponse =
                (await outputFileResponse.json()) as BrowserUseOutputFileResponse;
              const finalMarkdownUrl = outputFileData.download_url;

              // Download and parse markdown content
              if (finalMarkdownUrl) {
                finalMarkdown = await downloadMarkdownContent(finalMarkdownUrl);
                if (finalMarkdown) {
                  logger.log(
                    `Successfully downloaded markdown content: ${finalMarkdown.length} characters`
                  );
                }
              }
            }

            const stepsResponse = await fetch(
              `${BROWSER_USE_API_URL}/task/${taskId}`,
              {
                headers: {
                  Authorization: `Bearer ${BROWSER_USE_API_KEY}`,
                },
              }
            );

            if (stepsResponse.ok) {
              const stepsData: BrowserUseStepsResponse =
                (await stepsResponse.json()) as BrowserUseStepsResponse;

              // 提取steps中每一项的next_goal和url
              stepsInfo = stepsData.steps.map(step => ({
                next_goal: step.next_goal,
                url: step.url,
              }));
            }
            // 如果获取steps失败，返回空数组
            return {
              currentScreenshot,
              finalGif,
              finalMarkdown,
              stepsInfo,
            };
          }
        }

        return {
          currentScreenshot,
          finalGif,
          finalMarkdown,
          stepsInfo,
        };
      } catch (err: any) {
        logger.error(`Failed to execute browser use task`, err);
        return toolError('Browser Use Task Failed', err.message ?? String(err));
      }
    },
  });
};
