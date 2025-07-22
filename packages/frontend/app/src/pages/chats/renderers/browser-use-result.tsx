import { WebIcon } from '@blocksuite/icons/rc';
import { useState } from 'react';

import { MarkdownText } from '@/components/ui/markdown';

interface BrowserUseResultProps {
  /** The browser-use tool result */
  result: {
    taskId: string;
    status: string;
    currentScreenshot: string | null;
    finalGif: string | null;
    finalMarkdown: string | null;
    markdownContent: string | null;
    taskDescription: string;
    stepsInfo: Array<{
      next_goal: string;
      url: string;
    }>;
  };
}

/**
 * Specialized UI component for displaying browser-use tool results.
 * Shows task status, screenshots/GIFs, and markdown content.
 */
export function BrowserUseResult({ result }: BrowserUseResultProps) {
  const [currentImage, setCurrentImage] = useState<string | null>(
    result.finalGif || result.currentScreenshot || null
  );

  const { currentScreenshot, finalGif, finalMarkdown, stepsInfo } = result;

  // Determine display image and status text
  let displayImage = currentImage;

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
          <WebIcon className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      {/* Preview Content */}
      <div className="relative">
        {displayImage && (
          <div className="p-4">
            <img
              src={displayImage}
              alt="浏览器截图"
              className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
            />
          </div>
        )}

        {/* Markdown Content */}
        {finalMarkdown && (
          <div className="border-t border-gray-100 bg-gray-50 p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">任务结果</h4>
            <div className="text-sm text-gray-600 bg-white p-3 rounded border max-h-72 overflow-y-auto">
              <MarkdownText
                text={finalMarkdown}
                className="prose prose-sm max-w-none"
              />
            </div>
          </div>
        )}

        {/* Steps Info */}
        {stepsInfo && stepsInfo.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 p-4">
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {stepsInfo.map((step, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    步骤 {index + 1}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    <strong>目标:</strong> {step.next_goal}
                  </div>
                  <div className="text-xs text-blue-600">
                    <strong>URL:</strong> {step.url}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
