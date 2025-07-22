import { Logger } from '@nestjs/common';
import { tool } from 'ai';
import { z } from 'zod';

import { PromptService } from '../prompt';
import { CopilotProviderFactory } from '../providers';
import { toolError } from './error';
const logger = new Logger('MakeItRealTool');

export const makeItRealTool = (
  promptService: PromptService,
  factory: CopilotProviderFactory
) => {
  return tool({
    description: `This tool(make-it-real) is used to improve the document with more beautiful layout and professional appearance.`,
    parameters: z.object({
      instructions: z
        .string()
        .optional()
        .describe("User's special requirements."),
      markdown: z.string().describe('The markdown content'),
    }),
    execute: async ({ instructions, markdown }) => {
      console.log('makeItRealTool', instructions, markdown);
      try {
        const prompt = await promptService.get('make-it-real');
        if (!prompt) {
          throw new Error(`Prompt('make-it-real') not found`);
        }
        const provider = await factory.getProviderByModel(prompt.model);
        if (!provider) {
          throw new Error('Provider not found');
        }

        const content = await provider.text(
          { modelId: prompt.model },
          prompt.finish({
            instructions: instructions ?? 'No instructions',
            content: markdown,
          })
        );
        return { content };
      } catch (err: any) {
        logger.error(`Failed to make it real layout enhancer`, err);
        return toolError(
          'Make It Real Layout Enhancer Failed',
          err.message ?? String(err)
        );
      }
    },
  });
};
