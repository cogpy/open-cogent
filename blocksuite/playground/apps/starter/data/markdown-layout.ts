import { AffineSchemas } from '@blocksuite/affine/schemas';
import {
  Schema,
  Text,
  Transformer,
  type Workspace,
} from '@blocksuite/affine/store';
import { SimpleLayoutConverter } from '@blocksuite/affine-shared/adapters';

import type { InitFn } from './utils.js';

// 富文本测试内容
const richTextTestContent = `
# 🎨 富文本功能测试

## 标准 Markdown 格式测试

这是一个包含 **加粗文本** 和 *斜体文本* 的段落。

你也可以使用 ~~删除线~~ 来标记已删除的内容。

行内代码示例：\`console.log('Hello World')\`

## 自定义富文本语法测试

### 颜色和背景测试

这是 [红色文本]{color: red} 和 [蓝色背景]{background: blue} 的示例。

你可以组合多个属性：[红色加粗文本]{color: red; bold: true} 和 [绿色斜体]{color: green; italic: true}。

### 高亮语法测试

这是 ==高亮文本== 的示例，用于强调重要内容。

### 组合格式测试

这个段落包含 **加粗**、*斜体*、~~删除线~~、\`行内代码\`、[彩色文本]{color: purple} 和 ==高亮== 的组合。

### 链接测试

访问 [AFFiNE 官网](https://affine.pro) 了解更多信息。

## 复杂格式组合

在这个段落中，我们测试 **[加粗的红色文本]{color: red; bold: true}** 和 *[斜体的蓝色背景]{background: lightblue; italic: true}*。

还可以在链接中使用格式：[**加粗链接**](https://example.com) 和 [*斜体链接*](https://example.com)。

### 代码块中的富文本

\`\`\`javascript
// 这是代码块，不应该解析富文本
const text = "**这不应该是加粗**";
console.log(text);
\`\`\`

### 列表中的富文本

- **加粗项目**
- *斜体项目*
- [彩色项目]{color: orange}
- ==高亮项目==
- ~~删除项目~~

1. **有序列表加粗**
2. *有序列表斜体*
3. [有序列表彩色]{color: green}

## 测试总结

这个测试页面验证了以下富文本功能：

- ✅ **标准 Markdown 格式**（加粗、斜体、删除线、行内代码）
- ✅ **自定义颜色语法** \`[文本]{color: 颜色}\`
- ✅ **自定义背景语法** \`[文本]{background: 颜色}\`
- ✅ **高亮语法** \`==文本==\`
- ✅ **组合属性** \`[文本]{color: red; bold: true}\`
- ✅ **双向转换** Markdown ↔ BlockSuite
`;

const testMarkdownContent = `
<!-- layout:multi-column {"id":"container-5","columns":[{"id":"col-1","width":25},{"id":"col-2","width":50},{"id":"col-3","width":25}]} -->

<!-- content:column {"parent":"container-5","insert":"col-1"} -->

### 🧭 **导航** [面板]{color: blue}

这是一个包含 **加粗文本** 和 *斜体文本* 的导航区域。

你也可以使用 ~~删除线~~ 来标记已删除的内容，还有 ==高亮文本== 用于强调。

行内代码示例：\`console.log('Hello World')\`

[红色提示]{color: red; background: #ffe6e6} 和 [绿色成功]{color: green; background: #e6ffe6} 状态。

\`\`\`html
<div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
  <div style="width: 24px; height: 24px; background: rgba(255, 255, 255, 0.2); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px;">🚀</div>
  <span style="color: white; font-weight: 600; font-size: 13px;">组件库</span>
</div>
\`\`\`

\`\`\`html
<a href="#" style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 6px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; text-decoration: none; font-size: 12px; border-left: 2px solid #3b82f6; margin-bottom: 4px;">
  <span>🎨</span>
  <span>UI 组件</span>
</a>
\`\`\`

\`\`\`html
<a href="#" style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 6px; color: #64748b; text-decoration: none; font-size: 12px; margin-bottom: 4px;">
  <span>📊</span>
  <span>图表组件</span>
</a>
\`\`\`

\`\`\`html
<a href="#" style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 6px; color: #64748b; text-decoration: none; font-size: 12px; margin-bottom: 4px;">
  <span>🔧</span>
  <span>工具组件</span>
</a>
\`\`\`

\`\`\`html
<div style="background: white; border-radius: 8px; padding: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); margin-top: 12px;">
  <button style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; border: none; border-radius: 4px; padding: 6px 10px; font-size: 11px; font-weight: 500; cursor: pointer; width: 100%; margin-bottom: 4px;">
    新建组件
  </button>
  <button style="background: #f8fafc; color: #374151; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 10px; font-size: 11px; font-weight: 500; cursor: pointer; width: 100%; margin-bottom: 4px;">
    导入模板
  </button>
  <button style="background: #f8fafc; color: #374151; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 10px; font-size: 11px; font-weight: 500; cursor: pointer; width: 100%;">
    导出项目
  </button>
</div>
\`\`\`

<!-- end:content:column -->

<!-- content:column {"parent":"container-5","insert":"col-2"} -->

### 🌟 **主要展示** [区域]{color: purple}

这个区域展示 **[加粗的蓝色文本]{color: blue; bold: true}** 和 *[斜体的橙色背景]{background: orange; italic: true}*。

访问 [**AFFiNE 官网**](https://affine.pro) 了解更多信息。

<!-- layout:multi-column {"id":"container-6","columns":[{"id":"col-1","width":70},{"id":"col-2","width":30}],"parent":"container-5","insert":"col-2"} -->

<!-- content:column {"parent":"container-6","insert":"col-1"} -->

\`\`\`html
<div style="background: white; border-radius: 12px; padding: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); margin-bottom: 12px;">
  <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #1e293b;">🎨 设计系统</h3>
</div>
\`\`\`

<!-- layout:multi-column {"id":"container-7","columns":[{"id":"col-1","width":50},{"id":"col-2","width":50}],"parent":"container-6","insert":"col-1"} -->

<!-- content:column {"parent":"container-7","insert":"col-1"} -->

\`\`\`html
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 16px; color: white; text-align: center; margin-bottom: 12px;">
  <div style="font-size: 24px; margin-bottom: 8px;">⚡</div>
  <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">快速</div>
  <div style="font-size: 11px; opacity: 0.9;">毫秒级响应</div>
</div>
\`\`\`

<!-- layout:multi-column {"id":"container-8","columns":[{"id":"col-1","width":100}],"parent":"container-7","insert":"col-1"} -->

<!-- content:column {"parent":"container-8","insert":"col-1"} -->

\`\`\`html
<div style="background: #f8fafc; border-radius: 12px; padding: 12px; border: 1px solid #e2e8f0; margin-top: 12px;">
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
    <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%;"></div>
    <span style="font-size: 13px; font-weight: 600; color: #374151;">实时状态</span>
  </div>
  <div style="display: flex; gap: 6px;">
    <span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 10px; flex: 1; text-align: center;">在线</span>
    <span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 10px; flex: 1; text-align: center;">处理中</span>
  </div>
</div>
\`\`\`

<!-- layout:multi-column {"id":"container-9","columns":[{"id":"col-1","width":100}],"parent":"container-8","insert":"col-1"} -->

<!-- content:column {"parent":"container-9","insert":"col-1"} -->

\`\`\`html
<div style="background: #1e1e1e; border-radius: 12px; padding: 16px; font-family: monospace; margin-top: 16px;">
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
    <div style="width: 12px; height: 12px; background: #ef4444; border-radius: 50%;"></div>
    <div style="width: 12px; height: 12px; background: #f59e0b; border-radius: 50%;"></div>
    <div style="width: 12px; height: 12px; background: #22c55e; border-radius: 50%;"></div>
    <span style="margin-left: auto; color: #9ca3af; font-size: 11px;">component.tsx</span>
  </div>
  <div style="color: #e5e7eb; font-size: 12px; line-height: 1.6;">
    <div style="color: #60a5fa;">import React from 'react'</div>
    <div style="color: #a78bfa;">import { useState } from 'react'</div>
    <div style="margin: 8px 0;">
      <span style="color: #f59e0b;">const</span>
      <span> Button = () => {</span>
    </div>
    <div style="margin-left: 16px; color: #f59e0b;">const [count, setCount] = useState(0)</div>
    <div style="margin-left: 16px; color: #f59e0b;">return (</div>
    <div style="margin-left: 32px; color: #22c55e;">&lt;button onClick={() => setCount(count + 1)}&gt;</div>
    <div style="margin-left: 48px; color: #22c55e;">Count: {count}</div>
    <div style="margin-left: 32px; color: #22c55e;">&lt;/button&gt;</div>
    <div style="margin-left: 16px; color: #f59e0b;">)</div>
    <div>}</div>
  </div>
</div>
\`\`\`

<!-- end:content:column -->

<!-- end:content:column -->

<!-- end:content:column -->

<!-- content:column {"parent":"container-7","insert":"col-2"} -->

\`\`\`html
<div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); border-radius: 12px; padding: 16px; color: #8b4513; text-align: center; margin-bottom: 12px;">
  <div style="font-size: 24px; margin-bottom: 8px;">🎯</div>
  <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">精准</div>
  <div style="font-size: 11px; opacity: 0.8;">像素级控制</div>
</div>
\`\`\`

<!-- end:content:column -->

<!-- end:content:column -->

<!-- content:column {"parent":"container-6","insert":"col-2"} -->

\`\`\`html
<div style="display: flex; gap: 6px; justify-content: flex-end; padding: 16px;">
  <span style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 4px 10px; border-radius: 10px; font-size: 10px; font-weight: 600;">BETA</span>
  <span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 4px 10px; border-radius: 10px; font-size: 10px; font-weight: 600;">NEW</span>
</div>
\`\`\`

<!-- end:content:column -->

<!-- end:content:column -->

<!-- content:column {"parent":"container-5","insert":"col-3"} -->

### 📊 **数据面板** [监控]{color: green}

实时监控数据，包含 **性能指标** 和 *响应时间*。

- **[加载速度]{color: green}**: 98ms
- *[内存使用]{color: blue}*: 2.1MB  
- ~~[旧指标]{color: gray}~~: 已废弃
- ==[响应时间]{color: orange}==: 12ms

[优化建议]{background: lightblue}: 启用代码分割和图片优化。

\`\`\`html
<div style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; margin-bottom: 8px;">
  <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 6px;">
    <span>📈</span>
    性能指标
  </h4>
</div>
\`\`\`

\`\`\`html
<div style="background: white; border-radius: 8px; padding: 10px; border: 1px solid #e2e8f0; margin-bottom: 6px;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
    <span style="font-size: 11px; color: #64748b;">加载速度</span>
    <span style="font-size: 12px; font-weight: 700; color: #059669;">98ms</span>
  </div>
  <div style="height: 4px; background: #f1f5f9; border-radius: 2px; overflow: hidden;">
    <div style="height: 100%; width: 95%; background: linear-gradient(90deg, #059669 0%, #10b981 100%); border-radius: 2px;"></div>
  </div>
</div>
\`\`\`

\`\`\`html
<div style="background: white; border-radius: 8px; padding: 10px; border: 1px solid #e2e8f0; margin-bottom: 6px;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
    <span style="font-size: 11px; color: #64748b;">内存使用</span>
    <span style="font-size: 12px; font-weight: 700; color: #3b82f6;">2.1MB</span>
  </div>
  <div style="height: 4px; background: #f1f5f9; border-radius: 2px; overflow: hidden;">
    <div style="height: 100%; width: 65%; background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%); border-radius: 2px;"></div>
  </div>
</div>
\`\`\`

\`\`\`html
<div style="background: white; border-radius: 8px; padding: 10px; border: 1px solid #e2e8f0; margin-bottom: 6px;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
    <span style="font-size: 11px; color: #64748b;">响应时间</span>
    <span style="font-size: 12px; font-weight: 700; color: #f59e0b;">12ms</span>
  </div>
  <div style="height: 4px; background: #f1f5f9; border-radius: 2px; overflow: hidden;">
    <div style="height: 100%; width: 88%; background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%); border-radius: 2px;"></div>
  </div>
</div>
\`\`\`

\`\`\`html
<div style="background: white; border-radius: 8px; padding: 12px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); border: 1px solid #f1f5f9; margin-top: 12px;">
  <h5 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 4px;">
    <span>🎯</span>
    优化建议
  </h5>
  <div style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: #f0fdf4; border-radius: 4px; border-left: 2px solid #22c55e; margin-bottom: 4px;">
    <span style="font-size: 9px;">✅</span>
    <span style="font-size: 10px; color: #166534;">启用代码分割</span>
  </div>
  <div style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: #fffbeb; border-radius: 4px; border-left: 2px solid #f59e0b;">
    <span style="font-size: 9px;">⚠️</span>
    <span style="font-size: 10px; color: #92400e;">优化图片加载</span>
  </div>
</div>
\`\`\`

<!-- end:content:column -->`;

export const markdownLayout: InitFn = async (
  collection: Workspace,
  id: string
) => {
  const doc = collection.getDoc(id) ?? collection.createDoc(id);
  const store = doc.getStore();
  doc.clear();

  // 使用混合了富文本语法的多列布局内容进行测试
  const contentToTest = testMarkdownContent;
  const testTitle = '🎨 富文本 + 多列布局混合测试';
  const testDescription = '富文本语法扩展与多列布局解析';

  // 先创建基本的页面结构，确保 root 存在
  const rootId = store.addBlock('affine:page', {
    title: new Text(testTitle),
  });
  store.addBlock('affine:surface', {}, rootId);

  // 然后异步加载内容
  doc.load(async () => {
    console.log(`🚀 开始测试 ${testDescription} 功能...`);
    console.log(`📋 测试内容: 富文本语法 + 复杂多列布局 + HTML 组件`);
    console.log(`💡 功能包括: 加粗、斜体、删除线、高亮、自定义颜色、背景色、嵌套多列布局`);

    try {
      // 使用 SimpleLayoutConverter 解析 Markdown 并生成 snapshot
      const snapshot =
        await SimpleLayoutConverter.markdownToSnapshot(contentToTest);

      console.log('✅ Markdown 解析成功！', snapshot);

      // 创建 Transformer 实例
      const schema = new Schema();
      schema.register(AffineSchemas);

      const transformer = new Transformer({
        schema,
        blobCRUD: {
          get: async () => null,
          set: async () => '',
          delete: async () => {},
          list: async () => [],
        },
        docCRUD: {
          create: (id: string) => collection.createDoc(id).getStore(),
          get: (id: string) => collection.getDoc(id)?.getStore() || null,
          delete: async () => {},
        },
      });

      // 直接使用 Transformer 将整个 snapshot 添加到页面
      // SimpleLayoutConverter 已经返回了一个 note 块，所以直接添加到页面根部
      await transformer.snapshotToBlock(snapshot, store, rootId);

      console.log('✅ 页面内容生成完成！所有内容都通过 Markdown 解析器生成。');

      // 测试双向转换
      setTimeout(async () => {
        try {
          console.log('🔄 开始测试双向转换...');

          // 将生成的 snapshot 转换回 Markdown
          const backToMarkdown =
            await SimpleLayoutConverter.snapshotToMarkdown(snapshot);
          console.log('✅ 双向转换测试成功！');
          console.log(
            '📄 转换回的 Markdown 长度:',
            backToMarkdown.length,
            '字符'
          );
          console.log('📄 转换回的 Markdown 内容:', backToMarkdown);
        } catch (error) {
          console.error('❌ 双向转换测试失败:', error);
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Markdown 解析失败:', error);

      // 如果解析失败，添加错误信息到已存在的页面
      const noteId = store.addBlock(
        'affine:note',
        { xywh: '[0, 100, 800, 95%]' },
        rootId
      );

      store.addBlock(
        'affine:paragraph',
        {
          text: new Text('❌ Markdown 解析失败'),
          type: 'h1',
        },
        noteId
      );

      store.addBlock(
        'affine:paragraph',
        {
          text: new Text('查看控制台了解详细错误信息。'),
          type: 'text',
        },
        noteId
      );

      store.addBlock(
        'affine:code',
        {
          text: new Text(
            `错误信息: ${error instanceof Error ? error.message : String(error)}`
          ),
          language: 'text',
        },
        noteId
      );
    }
  });

  store.resetHistory();
};

markdownLayout.id = 'markdown-layout';
markdownLayout.displayName = 'Markdown 解析器测试';
markdownLayout.description = '测试富文本语法扩展与复杂多列布局的混合解析功能';
