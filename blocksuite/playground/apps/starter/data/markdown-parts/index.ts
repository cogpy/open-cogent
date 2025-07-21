import { basicSyntaxContent } from './basic-syntax.js';
import { twoColumnDemoContent } from './two-column-demo.js';
import { threeColumnDemoContent } from './three-column-demo.js';
import { nestedLayoutDemoContent } from './nested-layout-demo.js';
import { codeAndListsDemoContent } from './code-and-lists-demo.js';
import { summaryContent } from './summary.js';

// 组合所有 Markdown 内容
export const combinedMarkdownContent = [
  basicSyntaxContent,
  twoColumnDemoContent,
  threeColumnDemoContent,
  nestedLayoutDemoContent,
  codeAndListsDemoContent,
  summaryContent,
].join('\n\n');

// 导出各个模块，方便单独使用
export {
  basicSyntaxContent,
  twoColumnDemoContent,
  threeColumnDemoContent,
  nestedLayoutDemoContent,
  codeAndListsDemoContent,
  summaryContent,
};
