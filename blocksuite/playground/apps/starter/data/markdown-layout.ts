import { AffineSchemas } from '@blocksuite/affine/schemas';
import {
  Schema,
  Text,
  Transformer,
  type Workspace,
} from '@blocksuite/affine/store';
import { SimpleLayoutConverter } from '@blocksuite/affine-shared/adapters';

import type { InitFn } from './utils.js';

export const markdownLayout: InitFn = async (
  collection: Workspace,
  id: string
) => {
  const doc = collection.getDoc(id) ?? collection.createDoc(id);
  const store = doc.getStore();
  doc.clear();

  // 创建紧凑的混合测试内容，包含所有功能的精简示例
  const compactMixedContent = `
# 🎨 完整功能混合测试

这是一个包含 **加粗文本**、*斜体文本*、~~删除线~~、==高亮文本== 和 [红色文本]{"color": "red"} 的段落。

## 📊 表格功能测试

| 功能 | 状态 | 描述 |
|------|------|------|
| **富文本** | ✅ [完成]{"color": "green"} | 支持 *斜体*、**加粗**、==高亮== |
| 表格支持 | 🚧 [测试中]{"color": "orange"} | 包含格式化内容的表格 |
| 多列布局 | ❌ [待测试]{"color": "red"} | 复杂的 ~~嵌套~~ 布局 |

<!-- note:split -->

# 🚀 第二个 Note Block

这是文档分割功能的示例，具有 [蓝色背景]{"background": "#f0f9ff"}。

<!-- layout:multi-column {"id":"container-1","columns":[{"id":"col-1","width":50},{"id":"col-2","width":50}]} -->

<!-- content:column {"parent":"container-1","insert":"col-1"} -->

### 🧭 **左侧导航**

包含 **[加粗蓝色]{"color": "blue", "bold": true}** 和 *[斜体橙色]{"background": "orange", "italic": true}* 的混合格式。

\`\`\`html
<div style="background: #3b82f6; color: white; padding: 8px; border-radius: 4px;">组件示例</div>
\`\`\`

<!-- end:content:column -->

<!-- content:column {"parent":"container-1","insert":"col-2"} -->

### 📊 **右侧数据**

访问 [**AFFiNE 官网**](https://affine.pro) 了解更多。

- **加粗项目**
- *斜体项目* 
- [彩色项目]{"color": "purple"}
- ==高亮项目==

<!-- end:content:column -->

<!-- note:split -->

# 📄 第三个 Note Block

## 测试总结

✅ **富文本**: 加粗、斜体、删除线、高亮、自定义颜色\n✅ **表格**: 基础表格、格式化单元格、对齐方式\n✅ **文档分割**: 多个 note block、自定义背景\n✅ **多列布局**: 嵌套布局、HTML 组件、响应式设计
`;
  const contentToTest = compactMixedContent;
  const testTitle = '🎨 完整功能混合测试';
  const testDescription = '富文本语法、表格支持、文档分割与多列布局的完整解析';

  // 然后异步加载内容
  doc.load(async () => {
    // 先创建基本的页面结构，确保 root 存在
    const rootId = store.addBlock('affine:page', {
      title: new Text(testTitle),
    });
    store.addBlock('affine:surface', {}, rootId);
    console.log(`🚀 开始测试 ${testDescription} 功能...`);
    console.log(`📋 测试内容: 富文本语法 + 复杂多列布局 + HTML 组件`);
    console.log(
      `💡 功能包括: 加粗、斜体、删除线、高亮、自定义颜色、背景色、嵌套多列布局`
    );

    try {
      // 使用 SimpleLayoutConverter 解析 Markdown 并生成 snapshot
      const snapshots =
        await SimpleLayoutConverter.markdownToMultipleSnapshots(contentToTest);

      console.log('✅ Markdown 解析成功！', snapshots);

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

      for (const snapshot of snapshots) {
        await transformer.snapshotToBlock(snapshot, store, rootId);
      }

      console.log('✅ 页面内容生成完成！所有内容都通过 Markdown 解析器生成。');

      // 测试双向转换
      setTimeout(async () => {
        try {
          console.log('🔄 开始测试双向转换...');

          // 将生成的 snapshot 转换回 Markdown
          const backToMarkdown =
            await SimpleLayoutConverter.multipleSnapshotsToMarkdown(snapshots);
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

      console.log(
        '✅ 所有功能（富文本、表格、文档分割、多列布局）已通过合并内容一起解析完成！'
      );
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
markdownLayout.description =
  '测试富文本语法扩展、表格支持、文档分割与复杂多列布局的完整混合解析功能';
