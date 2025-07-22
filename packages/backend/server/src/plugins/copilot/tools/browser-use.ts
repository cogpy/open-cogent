import { Logger } from '@nestjs/common';
import { tool } from 'ai';
import { z } from 'zod';

import { toolError } from './error';

const logger = new Logger('BrowserUseTool');

const BROWSER_USE_API_URL = 'https://api.browser-use.com/api/v1';
const BROWSER_USE_API_KEY = 'bu_CG7O6Zu5IRfb2O5tzNGi3_A5_5Kc_m4lqaNkTuSAnV4';

const BROWSER_USE_TASK_STATUS = {
  CREATED: 'created',
  RUNNING: 'running',
  FINISHED: 'finished',
  STOPPED: 'stopped',
  PAUSED: 'paused',
  FAILED: 'failed',
};

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
  status: (typeof BROWSER_USE_TASK_STATUS)[keyof typeof BROWSER_USE_TASK_STATUS];
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
            task: task_description + '\n\nSave the final result as result.md',
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
        let currentStatus: string = BROWSER_USE_TASK_STATUS.CREATED;
        let currentScreenshot: string | null = null;
        let finalGif: string | null = null;
        let finalMarkdown: string | null = null;
        let stepsInfo: {
          next_goal: string;
          url: string;
        }[] = [];
        let internalScreenshots: string[] = [];

        while (
          currentStatus === BROWSER_USE_TASK_STATUS.CREATED ||
          currentStatus === BROWSER_USE_TASK_STATUS.RUNNING
        ) {
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
          currentStatus = statusData.replace(/"/g, ''); // Remove quotes

          if (
            currentStatus === BROWSER_USE_TASK_STATUS.STOPPED ||
            currentStatus === BROWSER_USE_TASK_STATUS.FAILED ||
            currentStatus === BROWSER_USE_TASK_STATUS.PAUSED
          ) {
            return toolError(
              'Browser Use Task Failed',
              `Task ${currentStatus}`
            );
          }

          if (
            currentStatus === BROWSER_USE_TASK_STATUS.CREATED ||
            currentStatus === BROWSER_USE_TASK_STATUS.RUNNING
          ) {
            // Get screenshots
            const screenshotsResponse = await fetch(
              `${BROWSER_USE_API_URL}/task/${taskId}/screenshots`,
              {
                headers: {
                  Authorization: `Bearer ${BROWSER_USE_API_KEY}`,
                },
              }
            );

            if (screenshotsResponse.ok) {
              const screenshotsData: BrowserUseScreenshotsResponse =
                (await screenshotsResponse.json()) as BrowserUseScreenshotsResponse;
              // Only update internal array if the returned screenshotsData has more elements than the internal array
              if (
                screenshotsData.screenshots &&
                screenshotsData.screenshots.length > 0 &&
                screenshotsData.screenshots.length > internalScreenshots.length
              ) {
                internalScreenshots = [...screenshotsData.screenshots];
                // Return the URL of the last screenshot in the array
                currentScreenshot =
                  internalScreenshots[internalScreenshots.length - 1];
              }
            }
          }

          if (currentStatus === BROWSER_USE_TASK_STATUS.FINISHED) {
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

              // Extract next_goal and url from each item in steps
              stepsInfo = stepsData.steps.map(step => ({
                next_goal: step.next_goal,
                url: step.url,
              }));
            }
            // If getting steps fails, return empty array
            return {
              currentStatus,
              currentScreenshot,
              finalGif,
              finalMarkdown,
              stepsInfo,
            };
          }
        }

        return {
          currentStatus,
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
