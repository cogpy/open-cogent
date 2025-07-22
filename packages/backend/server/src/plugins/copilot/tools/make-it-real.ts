import { Logger } from '@nestjs/common';
import { tool } from 'ai';
import { z } from 'zod';

import { PromptService } from '../prompt';
import { CopilotProviderFactory } from '../providers';
import { SaveDocFunc } from './doc-compose';
import { toolError } from './error';
const logger = new Logger('MakeItRealTool');

export const createMakeItRealTool = (
  promptService: PromptService,
  factory: CopilotProviderFactory,
  saveDoc: SaveDocFunc
) => {
  return tool({
    description: `This tool(make-it-real) is used to enhance a document layout and visual effects.`,
    parameters: z.object({
      markdown: z.string().describe('The markdown content'),
    }),
    execute: async ({ markdown }) => {
      try {
        let content = markdown;
        for (const promptName of [
          'make-it-real:layout-enhancer',
          'make-it-real:visual-enhancer',
        ]) {
          const prompt = await promptService.get(promptName);
          if (!prompt) {
            throw new Error(`Prompt('${promptName}') not found`);
          }
          const provider = await factory.getProviderByModel(prompt.model);
          if (!provider) {
            throw new Error('Provider not found');
          }

          console.log('content', content);

          content = await provider.text(
            { modelId: prompt.model },
            prompt.finish({ content })
          );
        }

        if (content) {
          const ret = await saveDoc(content);
          if (ret) return ret;
        }
      } catch (err: any) {
        logger.error(`Failed to make it real`, err);
        return toolError('Make It Real Failed', err.message ?? String(err));
      }
    },
  });
};
