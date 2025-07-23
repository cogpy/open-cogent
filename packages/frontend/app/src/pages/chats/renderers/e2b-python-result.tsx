import { CodeIcon, EmptyIcon } from '@blocksuite/icons/rc';

import { MarkdownText } from '@/components/ui/markdown';

import { GenericToolResult } from './generic-tool-result';

export const E2bPythonResult = ({
  result,
}: {
  result: {
    status: string;
    result: string;
  };
}) => {
  const { status, result: resultString } = result;

  if (status === 'error') {
    return (
      <GenericToolResult
        icon={<EmptyIcon className="text-red-500" />}
        title={'Errored'}
      ></GenericToolResult>
    );
  }

  return (
    <GenericToolResult icon={<CodeIcon />} title={'Result'}>
      <div className="text-sm px-10 py-4">
        <MarkdownText text={resultString} />
      </div>
    </GenericToolResult>
  );
};
