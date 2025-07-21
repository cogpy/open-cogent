import { AffineSchemas } from '@blocksuite/affine/schemas';
import {
  Schema,
  Text,
  Transformer,
  type Workspace,
} from '@blocksuite/affine/store';
import { SimpleLayoutConverter } from '@blocksuite/affine-shared/adapters';

// import { combinedMarkdownContent } from './markdown-parts/index.js';
import type { InitFn } from './utils.js';

// 使用拆分的 Markdown 内容
const testMarkdownContent = `# Markdown 布局解析器测试

这个页面用于测试新的多列布局 Markdown 解析器功能。

## 📝 支持的语法

下面是基本的多列布局语法示例：

<!-- layout:multi-column {"id":"container-0","columns":[{"id":"col-1","width":50},{"id":"col-2","width":50}]} -->

<!-- content:column {"parent":"container-0","insert":"col-1"} -->

### 布局声明语法

\`\`\`markdown
<!-- layout:multi-column
{
  "id": "layout-id",
  "gap": 20,
  "columns": [
    {"id": "col1", "width": 60},
    {"id": "col2", "width": 40}
  ]
}
-->
\`\`\`

特性：

- 支持任意列数

- 灵活的宽度配置

- 可自定义间距

<!-- end:content:column -->

<!-- content:column {"parent":"container-0","insert":"col-2"} -->

### 内容块语法

\`\`\`markdown
<!-- content:column
{
  "parent": "layout-id",
  "insert": "col1"
}
-->
列内容...
<!-- end:content:column -->
\`\`\`

优势：

- 语法简洁明了

- 易于理解和维护

- 支持复杂嵌套结构

<!-- end:content:column -->

## 🎯 基本两列布局示例

下面展示一个实际的两列布局：

<!-- layout:multi-column {"id":"container-1","columns":[{"id":"col-1","width":65},{"id":"col-2","width":35}]} -->

<!-- content:column {"parent":"container-1","insert":"col-1"} -->

### 主要内容区域

这是主要的内容区域，占据较大的宽度用于显示核心信息。

#### 功能特性

1. 完整的 Markdown 支持 - 兼容标准 Markdown 语法

1. 灵活的布局配置 - 支持任意列数和宽度比例

1. 无限嵌套能力 - 可以创建复杂的布局结构

1. 高性能解析 - 优化的解析算法，快速处理

#### 技术实现

解析器采用以下技术栈：

- TypeScript - 类型安全的开发体验

- Remark.js - 强大的 Markdown 处理引擎

- BlockSuite - 现代化的块编辑器框架

- Vite - 快速的构建工具

\`\`\`typescript
// 使用示例
const snapshot = await SimpleLayoutConverter
  .markdownToSnapshot(markdown);
\`\`\`

<!-- end:content:column -->

<!-- content:column {"parent":"container-1","insert":"col-2"} -->

### 侧边栏信息

这是侧边栏区域，用于显示辅助信息。

#### 快速导航

- 语法文档

- 示例代码

- API 参考

- 常见问题

#### 统计信息

- 解析速度: < 10ms

- 支持嵌套: 无限层级

- 兼容性: 100%

- 文件大小: < 50KB

#### 版本信息

- 当前版本: v1.0.0

- 最后更新: 2025-01-21

- 许可证: MIT

- 维护状态: 活跃开发

<!-- end:content:column -->

## 🔧 三列布局示例

下面展示更复杂的三列布局：

<!-- layout:multi-column {"id":"container-2","columns":[{"id":"col-1","width":20},{"id":"col-2","width":60},{"id":"col-3","width":20}]} -->

<!-- content:column {"parent":"container-2","insert":"col-1"} -->

### 导航菜单

主要功能

- 首页

- 文档

- 示例

- API

工具链接

- GitHub

- 问题反馈

- 社区讨论

- 更新日志

相关资源

- 教程视频

- 最佳实践

- 性能优化

- 故障排除

<!-- end:content:column -->

<!-- content:column {"parent":"container-2","insert":"col-2"} -->

### 核心内容区域

这是三列布局的核心内容区域，展示主要信息。

#### 解析器工作原理

解析过程分为以下几个步骤：

1. 词法分析 - 扫描 Markdown 文本，识别布局注释

1. 语法解析 - 解析 JSON 配置，构建布局树结构

1. 内容提取 - 提取各个内容块并关联到对应位置

1. 树构建 - 构建完整的 BlockSuite 块树结构

1. 渲染输出 - 生成最终的可视化布局

#### 性能优化策略

- 增量解析 - 只处理变更的部分，减少重复计算

- 缓存机制 - 缓存布局配置和解析结果

- 懒加载 - 支持大型文档的按需加载

- 并行处理 - 多线程处理复杂布局

\`\`\`javascript
// 性能监控示例
console.time('markdown-parse');
const result = parseLayoutMarkdown(content);
console.timeEnd('markdown-parse');
\`\`\`

<!-- end:content:column -->

<!-- content:column {"parent":"container-2","insert":"col-3"} -->

### 辅助信息

技术指标

- 内存占用: < 10MB

- CPU 使用: < 5%

- 网络请求: 0

- 依赖包: 最小化

浏览器支持

- Chrome 90+

- Firefox 88+

- Safari 14+

- Edge 90+

开发工具

- VS Code 插件

- 语法高亮

- 实时预览

- 错误检查

社区支持

- 活跃的开发者社区

- 定期的版本更新

- 完善的文档体系

- 及时的技术支持

<!-- end:content:column -->

## 🚀 嵌套布局示例

展示布局的嵌套能力：

<!-- layout:multi-column {"id":"container-3","columns":[{"id":"col-1","width":75},{"id":"col-2","width":25}]} -->

<!-- content:column {"parent":"container-3","insert":"col-1"} -->

### 嵌套内容区域

这个区域内部包含另一个嵌套的布局结构：

<!-- layout:multi-column {"id":"container-4","columns":[{"id":"col-1","width":50},{"id":"col-2","width":50}],"parent":"container-3","insert":"col-1"} -->

<!-- content:column {"parent":"container-4","insert":"col-1"} -->

#### 嵌套左列

这是嵌套布局的左列内容。

嵌套特性：

- 支持任意深度嵌套

- 每个布局独立配置

- 可以混合不同列数

- 自动处理布局冲突

使用场景：

- 复杂的页面布局

- 响应式设计

- 内容分组展示

- 层次化信息架构

<!-- end:content:column -->

<!-- content:column {"parent":"container-4","insert":"col-2"} -->

#### 嵌套右列

这是嵌套布局的右列内容。

配置示例：

\`\`\`json
{
  "layout": "nested",
  "depth": 2,
  "parent": "nested-outer",
  "children": ["inner-left", "inner-right"]
}
\`\`\`

注意事项：

- 避免过深的嵌套

- 保持合理的宽度比例

- 考虑移动端适配

- 测试不同屏幕尺寸

<!-- end:content:column -->

<!-- end:content:column -->

<!-- content:column {"parent":"container-3","insert":"col-2"} -->

### 元数据信息

布局层级：

1. 外层布局 (75% + 25%)

1. 内层布局 (50% + 50%)

技术细节：

- 递归解析算法

- 树形数据结构

- 自动验证机制

- 错误恢复策略

性能指标：

- 解析时间: < 5ms

- 内存使用: < 2MB

<!-- end:content:column -->

## 🎨 深度嵌套布局展示

<!-- layout:multi-column {"id":"container-5","columns":[{"id":"col-1","width":25},{"id":"col-2","width":50},{"id":"col-3","width":25}]} -->

<!-- content:column {"parent":"container-5","insert":"col-1"} -->

### 🧭 导航

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

### 🌟 主要展示

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

### 📊 数据面板

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

<!-- end:content:column -->

## ✅ 总结

这个多列布局 Markdown 解析器提供了强大而灵活的布局能力：

### 核心优势

- 🎯 精确控制 - 精确的列宽和间距控制

- 🔄 双向转换 - Markdown ↔ BlockSnapshot 无损转换

- 🏗️ 无限嵌套 - 支持任意深度的布局嵌套

- ⚡ 高性能 - 优化的解析和渲染算法

- 🛠️ 易于集成 - 简单的 API 和完善的文档

### 使用方法

\`\`\`typescript
// 将 Markdown 转换为 BlockSnapshot
const snapshot = await SimpleLayoutConverter
  .markdownToSnapshot(markdown);

// 将 BlockSnapshot 转换回 Markdown
const markdown = await SimpleLayoutConverter
  .snapshotToMarkdown(snapshot);
\`\`\`

通过这个解析器，你可以轻松创建复杂的多列文档布局，同时保持 Markdown 的简洁性和可读性。`;

export const markdownLayout: InitFn = async (
  collection: Workspace,
  id: string
) => {
  const doc = collection.getDoc(id) ?? collection.createDoc(id);
  const store = doc.getStore();
  doc.clear();

  // 先创建基本的页面结构，确保 root 存在
  const rootId = store.addBlock('affine:page', {
    title: new Text('Markdown 布局解析器测试'),
  });
  store.addBlock('affine:surface', {}, rootId);

  // 然后异步加载内容
  doc.load(async () => {
    console.log('🚀 开始通过 Markdown 解析器生成页面内容...');

    try {
      // 使用 SimpleLayoutConverter 解析 Markdown 并生成 snapshot
      const snapshot =
        await SimpleLayoutConverter.markdownToSnapshot(testMarkdownContent);

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
markdownLayout.displayName = 'Markdown 布局解析器';
markdownLayout.description = '测试多列布局 Markdown 解析功能';
