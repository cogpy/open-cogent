import type { BlockSnapshot } from '@blocksuite/store';
import { nanoid } from '@blocksuite/store';
import type {
  Code,
  Heading,
  Html,
  List,
  ListItem,
  Node,
  Paragraph,
  Root,
} from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

/**
 * 简化的布局状态接口
 */
interface LayoutState {
  containerMap: Map<string, BlockSnapshot>; // 存储所有容器和列的映射
  currentColumnKey: string | null; // 当前列的完整键名 (containerId.columnId)
}

/**
 * Markdown 转 BlockSnapshot 转换器
 */
export class MarkdownToSnapshotConverter {
  private layoutState: LayoutState;

  constructor() {
    this.layoutState = {
      containerMap: new Map<string, BlockSnapshot>(),
      currentColumnKey: null,
    };
  }

  /**
   * 静态方法：创建实例并转换 Markdown
   */
  static async convert(markdown: string): Promise<BlockSnapshot> {
    const converter = new MarkdownToSnapshotConverter();
    return converter.convertMarkdownToSnapshot(markdown);
  }

  /**
   * 将 Markdown 转换为 BlockSnapshot
   */
  async convertMarkdownToSnapshot(markdown: string): Promise<BlockSnapshot> {
    console.log('🔄 开始解析 Markdown...');

    // 重置状态
    this.resetState();

    // 使用 unified + remark-parse 解析 Markdown 为 AST
    const processor = unified().use(remarkParse);
    const ast = processor.parse(markdown) as Root;

    console.log('📊 AST 解析完成，节点数:', ast.children.length, ast);

    // 转换 AST 为 BlockSnapshot
    const children = await this.convertAstToBlocks(ast);

    // 创建根 note 块
    const noteSnapshot: BlockSnapshot = {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:note',
      props: {
        xywh: '[0,0,800,95]',
        background: '--affine-note-background-blue',
        index: 'a0',
        hidden: false,
        displayMode: 'both',
      },
      children,
    };

    console.log('✅ 转换完成！生成了', children.length, '个子块');
    return noteSnapshot;
  }

  /**
   * 重置布局状态
   */
  private resetState(): void {
    this.layoutState = {
      containerMap: new Map<string, BlockSnapshot>(),
      currentColumnKey: null,
    };
  }

  /**
   * 将 AST 转换为块数组
   */
  private async convertAstToBlocks(ast: Root): Promise<BlockSnapshot[]> {
    const blocks: BlockSnapshot[] = [];

    for (const node of ast.children) {
      await this.processAstNode(node, blocks);
    }

    return blocks;
  }

  /**
   * 处理单个 AST 节点
   */
  private async processAstNode(
    node: Node,
    blocks: BlockSnapshot[]
  ): Promise<void> {
    switch (node.type) {
      case 'html':
        await this.processHtmlNode(node as Html, blocks);
        break;

      case 'heading':
        const headingBlock = this.createHeadingBlock(node as Heading);
        this.insertBlock(headingBlock, blocks);
        break;

      case 'paragraph':
        const paragraphBlock = this.createParagraphBlock(node as Paragraph);
        this.insertBlock(paragraphBlock, blocks);
        break;

      case 'list':
        await this.processListNode(node as List, blocks);
        break;

      case 'code':
        const codeBlock = this.createCodeBlock(node as Code);
        this.insertBlock(codeBlock, blocks);
        break;

      default:
        console.log('🔍 未处理的节点类型:', node.type);
        break;
    }
  }

  /**
   * 处理 HTML 节点（布局注释）
   */
  private async processHtmlNode(
    node: Html,
    blocks: BlockSnapshot[]
  ): Promise<void> {
    const html = node.value;

    // 检查是否是布局声明
    if (html.includes('layout:multi-column')) {
      const layoutMatch = html.match(/^<!-- layout:multi-column([\s\S]*?)-->$/);
      if (layoutMatch) {
        try {
          const config = JSON.parse(layoutMatch[1]);

          // 创建多列容器
          const container = this.createMultiColumnContainer(config);
          this.layoutState.containerMap.set(config.id, container);

          // 处理容器嵌套：如果指定了 parent 和 insert，插入到父容器中
          if (config.parent && config.insert) {
            const parentKey = `${config.parent}.${config.insert}`;
            const parentContainer =
              this.layoutState.containerMap.get(parentKey);
            if (parentContainer) {
              parentContainer.children.push(container);
              console.log(
                '📐 创建嵌套布局容器:',
                config.id,
                '插入到父容器:',
                parentKey
              );
            } else {
              console.error('❌ 找不到父容器:', parentKey, '，将插入到主列表');
              blocks.push(container);
            }
          } else {
            // 没有指定父容器，插入到主列表
            blocks.push(container);
          }

          // 创建所有列并存储到 containerMap 中
          for (const columnConfig of config.columns) {
            const column = this.createColumnBlock(columnConfig);
            const columnKey = `${config.id}.${columnConfig.id}`;
            this.layoutState.containerMap.set(columnKey, column);
            container.children.push(column);
          }

          console.log(
            '📐 创建布局容器:',
            config.id,
            '包含',
            config.columns.length,
            '列'
          );
        } catch (e) {
          console.error('❌ 解析布局配置失败:', e);
        }
      }
      return;
    }

    // 检查是否是列内容结束
    else if (html.includes('end:content:column')) {
      console.log('📝 结束列内容:', this.layoutState.currentColumnKey);
      this.layoutState.currentColumnKey = null;
      return;
    }

    // 检查是否是列内容开始
    else if (html.includes('content:column')) {
      const columnMatch = html.match(/^<!-- content:column([\s\S]*?)-->$/);
      if (columnMatch) {
        try {
          const config = JSON.parse(columnMatch[1]);
          this.layoutState.currentColumnKey = `${config.parent}.${config.insert}`;

          console.log('📝 开始列内容:', this.layoutState.currentColumnKey);
        } catch (e) {
          console.error('❌ 解析列配置失败:', e);
        }
      }
      return;
    }
  }

  /**
   * 创建标题块
   */
  private createHeadingBlock(node: Heading): BlockSnapshot {
    const text = this.extractTextFromMdastNode(node);
    const level = node.depth;

    return {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:paragraph',
      props: {
        text: {
          '$blocksuite:internal:text$': true,
          delta: [{ insert: text }],
        },
        type: `h${Math.min(level, 6)}`,
      },
      children: [],
    };
  }

  /**
   * 创建段落块
   */
  private createParagraphBlock(node: Paragraph): BlockSnapshot {
    const text = this.extractTextFromMdastNode(node);

    return {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:paragraph',
      props: {
        text: {
          '$blocksuite:internal:text$': true,
          delta: [{ insert: text }],
        },
        type: 'text',
      },
      children: [],
    };
  }

  /**
   * 统一的插入函数：根据当前上下文决定插入位置
   */
  private insertBlock(block: BlockSnapshot, blocks: BlockSnapshot[]): void {
    if (this.layoutState.currentColumnKey) {
      // 当前在列内容中，插入到对应的列
      const column = this.layoutState.containerMap.get(
        this.layoutState.currentColumnKey
      );
      if (column) {
        column.children.push(block);
        console.log(
          '📝 添加块到列:',
          this.layoutState.currentColumnKey,
          block.flavour
        );
      } else {
        console.error('❌ 找不到列:', this.layoutState.currentColumnKey);
        blocks.push(block); // 降级到主列表
      }
    } else {
      // 不在列内容中，插入到最外层
      blocks.push(block);
      console.log('📝 添加块到主列表:', block.flavour);
    }
  }

  /**
   * 创建多列容器块
   */
  private createMultiColumnContainer(config: {
    id: string;
    columns: Array<{ id: string; width: number }>;
  }): BlockSnapshot {
    return {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:multi-column-container',
      props: {},
      children: [],
    };
  }

  /**
   * 创建列块
   */
  private createColumnBlock(columnConfig: {
    id: string;
    width: number;
  }): BlockSnapshot {
    return {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:column',
      props: {
        width: columnConfig.width,
      },
      children: [],
    };
  }

  /**
   * 处理列表节点
   */
  private async processListNode(
    node: List,
    blocks: BlockSnapshot[]
  ): Promise<void> {
    for (const listItem of node.children) {
      const listBlock = this.createListBlock(
        listItem as ListItem,
        node.ordered || false
      );
      this.insertBlock(listBlock, blocks);

      // 处理嵌套列表
      if (listItem.children.length > 1) {
        for (let i = 1; i < listItem.children.length; i++) {
          const child = listItem.children[i];
          if (child.type === 'list') {
            await this.processListNode(child as List, blocks);
          }
        }
      }
    }
  }

  /**
   * 创建列表块
   */
  private createListBlock(node: ListItem, ordered: boolean): BlockSnapshot {
    // 提取第一个段落的文本作为列表项内容
    let text = '';
    if (node.children.length > 0 && node.children[0].type === 'paragraph') {
      text = this.extractTextFromMdastNode(node.children[0]);
    }

    // 确定列表类型
    let listType: string;
    if (node.checked !== null && node.checked !== undefined) {
      listType = 'todo';
    } else if (ordered) {
      listType = 'numbered';
    } else {
      listType = 'bulleted';
    }

    return {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:list',
      props: {
        type: listType,
        text: {
          '$blocksuite:internal:text$': true,
          delta: [{ insert: text }],
        },
        checked: node.checked ?? false,
        collapsed: false,
      },
      children: [],
    };
  }

  /**
   * 创建代码块
   */
  private createCodeBlock(node: Code): BlockSnapshot {
    return {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:code',
      props: {
        language: node.lang || 'plain text',
        text: {
          '$blocksuite:internal:text$': true,
          delta: [{ insert: node.value }],
        },
        wrap: false,
      },
      children: [],
    };
  }

  /**
   * 从 mdast 节点提取文本
   */
  private extractTextFromMdastNode(node: any): string {
    if (node.type === 'text') {
      return node.value || '';
    }

    if (node.children) {
      return node.children
        .map((child: any) => this.extractTextFromMdastNode(child))
        .join('');
    }

    return '';
  }
}
type Context = {
  container?: {
    id: string;
    col: string;
  };
};
/**
 * BlockSnapshot 转 Markdown 转换器
 */
export class SnapshotToMarkdownConverter {
  /**
   * 静态方法：转换 BlockSnapshot 为 Markdown
   */
  static async convert(snapshot: BlockSnapshot): Promise<string> {
    const converter = new SnapshotToMarkdownConverter();
    return converter.convertSnapshotToMarkdown(snapshot);
  }

  /**
   * 将 BlockSnapshot 转换为 Markdown
   */
  async convertSnapshotToMarkdown(snapshot: BlockSnapshot): Promise<string> {
    console.log('🔄 开始将 BlockSnapshot 转换为 Markdown...');

    const parts: string[] = [];

    for (const child of snapshot.children) {
      const markdown = await this.blockToMarkdown(child, {});
      if (markdown.trim()) {
        parts.push(markdown);
      }
    }

    const result = parts.join('\n\n');
    console.log('✅ 转换完成！生成了', result.length, '个字符的 Markdown');
    return result;
  }

  /**
   * 将单个块转换为 Markdown
   */
  private async blockToMarkdown(
    block: BlockSnapshot,
    context: Context
  ): Promise<string> {
    switch (block.flavour) {
      case 'affine:paragraph':
        return this.paragraphToMarkdown(block);

      case 'affine:multi-column-container':
        return this.multiColumnToMarkdown(block, context);

      case 'affine:column':
        // 列块本身不直接转换，由容器处理
        return '';

      case 'affine:list':
        return this.listToMarkdown(block);

      case 'affine:code':
        return this.codeToMarkdown(block);

      default:
        // 其他类型的块，尝试提取文本
        const text = this.extractTextFromBlock(block);
        return text || '';
    }
  }

  /**
   * 段落块转 Markdown
   */
  private paragraphToMarkdown(block: BlockSnapshot): string {
    const text = this.extractTextFromBlock(block);
    const type = block.props?.type || 'text';

    switch (type) {
      case 'h1':
        return `# ${text}`;
      case 'h2':
        return `## ${text}`;
      case 'h3':
        return `### ${text}`;
      case 'h4':
        return `#### ${text}`;
      case 'h5':
        return `##### ${text}`;
      case 'h6':
        return `###### ${text}`;
      default:
        return text;
    }
  }
  count = 0;
  /**
   * 多列容器转 Markdown
   */
  private async multiColumnToMarkdown(
    block: BlockSnapshot,
    context: Context
  ): Promise<string> {
    const parts: string[] = [];
    const containerId = `container-${this.count++}`;
    const containerDeclaration = `<!-- layout:multi-column ${JSON.stringify({
      id: containerId,
      columns: block.children.map((child, index) => ({
        id: `col-${index + 1}`,
        width: child.props?.width,
      })),
      ...(context.container
        ? { parent: context.container.id, insert: context.container.col }
        : {}),
    })} -->`;

    parts.push(containerDeclaration);

    // 生成列内容
    for (let i = 0; i < block.children.length; i++) {
      const column = block.children[i];
      const columnId = `col-${i + 1}`;

      if (column.children.length > 0) {
        const contentStart = `<!-- content:column ${JSON.stringify({
          parent: containerId,
          insert: columnId,
        })} -->`;

        const contentParts: string[] = [];
        for (const contentChild of column.children) {
          const markdown = await this.blockToMarkdown(contentChild, {
            container: {
              id: containerId,
              col: columnId,
            },
          });
          if (markdown.trim()) {
            contentParts.push(markdown);
          }
        }

        const contentEnd = '<!-- end:content:column -->';

        parts.push(contentStart);
        if (contentParts.length > 0) {
          parts.push(contentParts.join('\n\n'));
        }
        parts.push(contentEnd);
      }
    }

    return parts.join('\n\n');
  }

  /**
   * 列表块转 Markdown
   */
  private listToMarkdown(block: BlockSnapshot): string {
    const text = this.extractTextFromBlock(block);
    const type = block.props?.type || 'bulleted';
    const checked = block.props?.checked;

    switch (type) {
      case 'numbered':
        return `1. ${text}`;
      case 'todo':
        const checkmark = checked ? '[x]' : '[ ]';
        return `- ${checkmark} ${text}`;
      case 'bulleted':
      default:
        return `- ${text}`;
    }
  }

  /**
   * 代码块转 Markdown
   */
  private codeToMarkdown(block: BlockSnapshot): string {
    const text = this.extractTextFromBlock(block);
    const language = block.props?.language || '';

    return `\`\`\`${language}\n${text}\n\`\`\``;
  }

  /**
   * 从块中提取文本
   */
  private extractTextFromBlock(block: BlockSnapshot): string {
    const text = block.props?.text;

    if (text && typeof text === 'object' && 'delta' in text) {
      return (text as any).delta.map((d: any) => d.insert || '').join('');
    }

    if (typeof text === 'string') {
      return text;
    }

    return '';
  }
}

/**
 * 保持向后兼容的简单布局转换器
 */
export class SimpleLayoutConverter {
  /**
   * 静态方法：创建实例并转换 Markdown
   * @deprecated 请使用 MarkdownToSnapshotConverter.convert()
   */
  static async markdownToSnapshot(markdown: string): Promise<BlockSnapshot> {
    return MarkdownToSnapshotConverter.convert(markdown);
  }

  /**
   * 将 BlockSnapshot 转换为 Markdown
   * @deprecated 请使用 SnapshotToMarkdownConverter.convert()
   */
  static async snapshotToMarkdown(snapshot: BlockSnapshot): Promise<string> {
    return SnapshotToMarkdownConverter.convert(snapshot);
  }
}
