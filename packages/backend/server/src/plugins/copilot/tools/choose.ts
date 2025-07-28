import { z } from 'zod';

import { createTool } from './utils';

export const createChooseTool = () => {
  return createTool(
    { toolName: 'choose' },
    {
      description:
        'Present multiple options to the user for selection. The user can either choose from the provided options or provide their own input. The content of the options should be provided in the language used by the user.',
      parameters: z.object({
        question: z.string().describe('The question or prompt to ask the user'),
        options: z
          .array(z.string())
          .describe('Array of options for the user to choose from')
          .min(2, 'At least 2 options are required'),
        multiSelect: z
          .boolean()
          .optional()
          .default(false)
          .describe('Whether the user can select multiple options'),
      }),
      execute: async ({ question, options, multiSelect }) => {
        return { question, options, multiSelect };
      },
    }
  );
};
