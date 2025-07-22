import type { BlockSnapshot } from '@blocksuite/store';
import { nanoid } from '@blocksuite/store';
import type {
  Code,
  Delete,
  Emphasis,
  Heading,
  Html,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Node,
  Paragraph,
  Root,
  Strong,
  Table,
  TableCell,
  TableRow,
} from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

interface LayoutState {
  containerMap: Map<string, BlockSnapshot>;
  currentColumnKey: string | null;
}

export class MarkdownToSnapshotConverter {
  private layoutState: LayoutState;

  constructor() {
    this.layoutState = {
      containerMap: new Map<string, BlockSnapshot>(),
      currentColumnKey: null,
    };
  }

  static async convert(markdown: string): Promise<BlockSnapshot> {
    const converter = new MarkdownToSnapshotConverter();
    return converter.convertMarkdownToSnapshot(markdown);
  }

  static async convertWithSplit(markdown: string): Promise<BlockSnapshot[]> {
    const converter = new MarkdownToSnapshotConverter();
    return converter.convertMarkdownToSnapshotsWithSplit(markdown);
  }

  async convertMarkdownToSnapshot(markdown: string): Promise<BlockSnapshot> {
    this.resetState();

    // 预处理自定义语法
    const processedMarkdown = this.preprocessCustomSyntax(markdown);

    const processor = unified().use(remarkParse).use(remarkGfm);
    const ast = processor.parse(processedMarkdown) as Root;

    const children = await this.convertAstToBlocks(ast);

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

    return noteSnapshot;
  }

  async convertMarkdownToSnapshotsWithSplit(
    markdown: string
  ): Promise<BlockSnapshot[]> {
    // 按分割标记分割 markdown，同时提取配置信息
    const sectionsWithConfig =
      this.splitMarkdownBySeparatorWithConfig(markdown);
    const noteSnapshots: BlockSnapshot[] = [];

    for (let i = 0; i < sectionsWithConfig.length; i++) {
      const { content, config } = sectionsWithConfig[i];
      if (content.trim()) {
        this.resetState();

        // 预处理自定义语法
        const processedMarkdown = this.preprocessCustomSyntax(content);

        const processor = unified().use(remarkParse).use(remarkGfm);
        const ast = processor.parse(processedMarkdown) as Root;

        const children = await this.convertAstToBlocks(ast);

        if (children.length > 0) {
          // 使用配置中的背景颜色，如果没有则使用默认
          const background =
            config?.backgroundColor || this.getNoteBackground(i);

          const noteSnapshot: BlockSnapshot = {
            type: 'block',
            id: nanoid(),
            flavour: 'affine:note',
            props: {
              xywh: `[0,${i * 100},800,95]`,
              background: this.mapBackgroundColor(background),
              index: `a${i}`,
              hidden: false,
              displayMode: 'both',
              // 如果配置中有标题，添加到 note 的属性中
              ...(config?.title && { title: config.title }),
            },
            children,
          };

          noteSnapshots.push(noteSnapshot);
        }
      }
    }

    return noteSnapshots;
  }

  private splitMarkdownBySeparator(markdown: string): string[] {
    // 只支持 <!-- note:split --> 分割标记
    return markdown
      .split(/<!-- note:split([\s\S]*?)-->/g)
      .filter(section => section.trim().length > 0);
  }

  private splitMarkdownBySeparatorWithConfig(
    markdown: string
  ): Array<{ content: string; config?: any }> {
    // 支持 <!-- note:split --> 和 <!-- note:split{"title":"xxx","backgroundColor":"red"} --> 格式
    const parts = markdown.split(/<!-- note:split([\s\S]*?)-->/g);
    const result: Array<{ content: string; config?: any }> = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (i % 2 === 0) {
        // 这是内容部分
        if (part.trim().length > 0) {
          result.push({ content: part, config: null });
        }
      } else {
        // 这是分割标记中的配置部分
        let config = null;
        if (part.trim().length > 0) {
          try {
            // 尝试解析 JSON 配置
            config = JSON.parse(part.trim());
          } catch (e) {
            // 如果解析失败，忽略配置
            config = null;
          }
        }

        // 获取下一个内容部分
        if (i + 1 < parts.length) {
          const nextContent = parts[i + 1];
          if (nextContent.trim().length > 0) {
            result.push({ content: nextContent, config });
          }
          i++; // 跳过下一个内容部分，因为我们已经处理了
        }
      }
    }

    return result;
  }

  private mapBackgroundColor(color: string): string {
    // 将用户指定的颜色映射到 AFFiNE 的背景颜色变量
    const colorMap: { [key: string]: string } = {
      red: '--affine-note-background-red',
      blue: '--affine-note-background-blue',
      green: '--affine-note-background-green',
      yellow: '--affine-note-background-yellow',
      pink: '--affine-note-background-pink',
      purple: '--affine-note-background-purple',
      orange: '--affine-note-background-orange',
      gray: '--affine-note-background-gray',
      grey: '--affine-note-background-gray',
    };

    // 如果是已知的颜色名称，返回对应的 CSS 变量
    if (colorMap[color.toLowerCase()]) {
      return colorMap[color.toLowerCase()];
    }

    // 如果已经是 CSS 变量格式，直接返回
    if (color.startsWith('--affine-note-background-')) {
      return color;
    }

    // 如果是其他格式（如十六进制颜色），直接返回
    return color;
  }

  private getNoteBackground(index: number): string {
    const backgrounds = [
      '--affine-note-background-blue',
      '--affine-note-background-green',
      '--affine-note-background-yellow',
      '--affine-note-background-pink',
      '--affine-note-background-purple',
      '--affine-note-background-orange',
    ];
    return backgrounds[index % backgrounds.length];
  }

  private resetState(): void {
    this.layoutState = {
      containerMap: new Map<string, BlockSnapshot>(),
      currentColumnKey: null,
    };
  }

  private async convertAstToBlocks(ast: Root): Promise<BlockSnapshot[]> {
    const blocks: BlockSnapshot[] = [];

    for (const node of ast.children) {
      await this.processAstNode(node, blocks);
    }

    return blocks;
  }

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

      case 'image':
        const imageBlock = this.createImageBlock(node as Image);
        this.insertBlock(imageBlock, blocks);
        break;

      case 'table':
        const tableBlock = this.createTableBlock(node as Table);
        this.insertBlock(tableBlock, blocks);
        break;
    }
  }

  private async processHtmlNode(
    node: Html,
    blocks: BlockSnapshot[]
  ): Promise<void> {
    const html = node.value;

    if (html.includes('layout:multi-column')) {
      const layoutMatch = html.match(/^<!-- layout:multi-column([\s\S]*?)-->$/);
      if (layoutMatch) {
        try {
          const config = JSON.parse(layoutMatch[1]);

          const container = this.createMultiColumnContainer(config);
          this.layoutState.containerMap.set(config.id, container);

          if (config.parent && config.insert) {
            const parentKey = `${config.parent}.${config.insert}`;
            const parentContainer =
              this.layoutState.containerMap.get(parentKey);
            if (parentContainer) {
              parentContainer.children.push(container);
            } else {
              blocks.push(container);
            }
          } else {
            blocks.push(container);
          }

          for (const columnConfig of config.columns) {
            const column = this.createColumnBlock(columnConfig);
            const columnKey = `${config.id}.${columnConfig.id}`;
            this.layoutState.containerMap.set(columnKey, column);
            container.children.push(column);
          }
        } catch (e) {}
      }
      return;
    } else if (html.includes('end:content:column')) {
      this.layoutState.currentColumnKey = null;
      return;
    } else if (html.includes('content:column')) {
      const columnMatch = html.match(/^<!-- content:column([\s\S]*?)-->$/);
      if (columnMatch) {
        try {
          const config = JSON.parse(columnMatch[1]);
          this.layoutState.currentColumnKey = `${config.parent}.${config.insert}`;
        } catch (e) {}
      }
      return;
    }
  }

  private createHeadingBlock(node: Heading): BlockSnapshot {
    const delta = this.extractDeltaFromMdastNode(node);
    const level = node.depth;

    return {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:paragraph',
      props: {
        text: {
          '$blocksuite:internal:text$': true,
          delta,
        },
        type: `h${Math.min(level, 6)}`,
      },
      children: [],
    };
  }

  private createParagraphBlock(node: Paragraph): BlockSnapshot {
    const delta = this.extractDeltaFromMdastNode(node);

    return {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:paragraph',
      props: {
        text: {
          '$blocksuite:internal:text$': true,
          delta,
        },
        type: 'text',
      },
      children: [],
    };
  }

  private insertBlock(block: BlockSnapshot, blocks: BlockSnapshot[]): void {
    if (this.layoutState.currentColumnKey) {
      const column = this.layoutState.containerMap.get(
        this.layoutState.currentColumnKey
      );
      if (column) {
        column.children.push(block);
      } else {
        blocks.push(block);
      }
    } else {
      blocks.push(block);
    }
  }

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

  private createListBlock(node: ListItem, ordered: boolean): BlockSnapshot {
    let delta: any[] = [];
    if (node.children.length > 0 && node.children[0].type === 'paragraph') {
      delta = this.extractDeltaFromMdastNode(node.children[0]);
    }

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
          delta,
        },
        checked: node.checked ?? false,
        collapsed: false,
      },
      children: [],
    };
  }

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

  private createImageBlock(node: Image): BlockSnapshot {
    return {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:image',
      props: {
        sourceId: node.url,
        caption: node.alt || '',
        width: 0,
        height: 0,
        index: 'a0',
        xywh: '[0,0,0,0]',
        rotate: 0,
      },
      children: [],
    };
  }

  private createTableBlock(node: Table): BlockSnapshot {
    const tableProps = this.parseTableFromMarkdown(node);
    return {
      type: 'block',
      id: nanoid(),
      flavour: 'affine:table',
      props: tableProps,
      children: [],
    };
  }

  private parseTableFromMarkdown(node: Table): any {
    const rowTextLists: any[][] = [];
    node.children.forEach(row => {
      const rowText: any[] = [];
      row.children.forEach(cell => {
        rowText.push(this.extractDeltaFromMdastNode(cell));
      });
      rowTextLists.push(rowText);
    });
    return this.createTableProps(rowTextLists);
  }

  private createTableProps(deltasLists: any[][]): any {
    const createIdAndOrder = (count: number) => {
      const result: { id: string; order: string }[] = Array.from({
        length: count,
      });
      for (let i = 0; i < count; i++) {
        const id = nanoid();
        const order = this.generateFractionalIndexingKeyBetween(
          result[i - 1]?.order ?? null,
          null
        );
        result[i] = { id, order };
      }
      return result;
    };

    const columnCount = Math.max(...deltasLists.map(row => row.length));
    const rowCount = deltasLists.length;

    const columns = createIdAndOrder(columnCount).map(v => ({
      columnId: v.id,
      order: v.order,
    }));
    const rows = createIdAndOrder(rowCount).map(v => ({
      rowId: v.id,
      order: v.order,
    }));

    const cells: Record<string, any> = {};
    for (let i = 0; i < rowCount; i++) {
      for (let j = 0; j < columnCount; j++) {
        const row = rows[i];
        const column = columns[j];
        if (!row || !column) {
          continue;
        }
        const cellId = `${row.rowId}:${column.columnId}`;
        const text = deltasLists[i]?.[j];
        cells[cellId] = {
          text: {
            '$blocksuite:internal:text$': true,
            delta: text ?? [],
          },
        };
      }
    }

    return {
      columns: Object.fromEntries(
        columns.map(column => [column.columnId, column])
      ),
      rows: Object.fromEntries(rows.map(row => [row.rowId, row])),
      cells,
    };
  }

  private generateFractionalIndexingKeyBetween(
    prev: string | null,
    next: string | null
  ): string {
    if (!prev && !next) {
      return 'a0';
    }
    if (!prev) {
      return 'a0';
    }
    if (!next) {
      const lastChar = prev.charCodeAt(prev.length - 1);
      if (lastChar < 122) {
        return prev.slice(0, -1) + String.fromCharCode(lastChar + 1);
      }
      return prev + 'a';
    }
    // Simple implementation for between two keys
    return prev + '5';
  }

  private extractTextFromMdastNode(node: any): string {
    if (node.type === 'text') {
      return node.value || '';
    }

    if (node.type === 'link') {
      const linkNode = node as Link;
      const text = linkNode.children
        .map((child: any) => this.extractTextFromMdastNode(child))
        .join('');
      return text;
    }

    if (node.type === 'image') {
      const imageNode = node as Image;
      return imageNode.alt || '';
    }

    if (node.children) {
      return node.children
        .map((child: any) => this.extractTextFromMdastNode(child))
        .join('');
    }

    return '';
  }

  private extractDeltaFromMdastNode(node: any): any[] {
    if (node.type === 'text') {
      // 处理自定义语法
      return this.parseCustomSyntax(node.value || '');
    }

    // 支持加粗
    if (node.type === 'strong') {
      const childDeltas = node.children
        ? node.children.flatMap((child: any) =>
            this.extractDeltaFromMdastNode(child)
          )
        : [];
      return this.mergeAttributes(childDeltas, { bold: true });
    }

    // 支持斜体
    if (node.type === 'emphasis') {
      const childDeltas = node.children
        ? node.children.flatMap((child: any) =>
            this.extractDeltaFromMdastNode(child)
          )
        : [];
      return this.mergeAttributes(childDeltas, { italic: true });
    }

    // 支持删除线
    if (node.type === 'delete') {
      const childDeltas = node.children
        ? node.children.flatMap((child: any) =>
            this.extractDeltaFromMdastNode(child)
          )
        : [];
      return this.mergeAttributes(childDeltas, { strike: true });
    }

    // 支持行内代码
    if (node.type === 'inlineCode') {
      return [{ insert: node.value, attributes: { code: true } }];
    }

    if (node.type === 'link') {
      const linkNode = node as Link;
      const childDeltas = linkNode.children
        ? linkNode.children.flatMap((child: any) =>
            this.extractDeltaFromMdastNode(child)
          )
        : [];
      return this.mergeAttributes(childDeltas, { link: linkNode.url });
    }

    if (node.type === 'image') {
      const imageNode = node as Image;
      return [{ insert: imageNode.alt || '' }];
    }

    if (node.children) {
      return node.children.flatMap((child: any) =>
        this.extractDeltaFromMdastNode(child)
      );
    }

    return [];
  }

  /**
   * 合并属性到 Delta 数组中
   */
  private mergeAttributes(deltas: any[], newAttributes: any): any[] {
    return deltas.map(delta => ({
      ...delta,
      attributes: {
        ...delta.attributes,
        ...newAttributes,
      },
    }));
  }

  /**
   * 预处理自定义语法，将其转换为标准markdown
   */
  private preprocessCustomSyntax(markdown: string): string {
    // 处理高亮语法 ==text== -> <mark>text</mark>
    markdown = markdown.replace(/==(.*?)==/g, '<mark>$1</mark>');

    return markdown;
  }

  /**
   * 解析自定义语法 [文本]{属性}
   */
  private parseCustomSyntax(text: string): any[] {
    const customSyntaxRegex = /\[([^\]]+)\]\{([^}]+)\}/g;
    const result: any[] = [];
    let lastIndex = 0;
    let match;

    while ((match = customSyntaxRegex.exec(text)) !== null) {
      // 添加匹配前的普通文本
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        if (beforeText) {
          result.push({ insert: beforeText });
        }
      }

      const content = match[1];
      const attributesStr = match[2];
      const attributes = this.parseAttributes(attributesStr);

      result.push({
        insert: content,
        attributes,
      });

      lastIndex = match.index + match[0].length;
    }

    // 添加剩余的普通文本
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText) {
        result.push({ insert: remainingText });
      }
    }

    // 如果没有自定义语法，返回原始文本
    if (result.length === 0) {
      return [{ insert: text }];
    }

    return result;
  }

  /**
   * 解析属性字符串
   */
  private parseAttributes(attributesStr: string): any {
    const attributes: any = {};

    // 解析 key: value 格式
    const keyValueRegex = /(\w+):\s*([^,;]+)/g;
    let match;

    while ((match = keyValueRegex.exec(attributesStr)) !== null) {
      const key = match[1].trim();
      const value = match[2].trim();

      switch (key) {
        case 'color':
          attributes.color = value;
          break;
        case 'background':
        case 'bg':
          attributes.background = value;
          break;
        case 'bold':
          attributes.bold = value === 'true' || value === '1';
          break;
        case 'italic':
          attributes.italic = value === 'true' || value === '1';
          break;
        case 'strike':
          attributes.strike = value === 'true' || value === '1';
          break;
        case 'underline':
          attributes.underline = value === 'true' || value === '1';
          break;
        case 'code':
          attributes.code = value === 'true' || value === '1';
          break;
        default:
          attributes[key] = value;
      }
    }

    // 解析简单的类名格式 .red, .bold 等
    const classRegex = /\.(\w+)/g;
    while ((match = classRegex.exec(attributesStr)) !== null) {
      const className = match[1];

      switch (className) {
        case 'red':
        case 'blue':
        case 'green':
        case 'yellow':
        case 'purple':
        case 'orange':
        case 'pink':
        case 'gray':
        case 'black':
        case 'white':
          attributes.color = className;
          break;
        case 'bold':
          attributes.bold = true;
          break;
        case 'italic':
          attributes.italic = true;
          break;
        case 'strike':
          attributes.strike = true;
          break;
        case 'underline':
          attributes.underline = true;
          break;
        case 'code':
          attributes.code = true;
          break;
        case 'highlight':
          attributes.background = 'yellow';
          break;
      }
    }

    return attributes;
  }
}
type Context = {
  container?: {
    id: string;
    col: string;
  };
};
export class SnapshotToMarkdownConverter {
  static async convert(snapshot: BlockSnapshot): Promise<string> {
    const converter = new SnapshotToMarkdownConverter();
    return converter.convertSnapshotToMarkdown(snapshot);
  }

  static async convertMultiple(snapshots: BlockSnapshot[]): Promise<string> {
    const converter = new SnapshotToMarkdownConverter();
    return converter.convertMultipleSnapshotsToMarkdown(snapshots);
  }

  async convertSnapshotToMarkdown(snapshot: BlockSnapshot): Promise<string> {
    const parts: string[] = [];

    for (const child of snapshot.children) {
      const markdown = await this.blockToMarkdown(child, {});
      if (markdown.trim()) {
        parts.push(markdown);
      }
    }

    const result = parts.join('\n\n');
    return result;
  }

  async convertMultipleSnapshotsToMarkdown(
    snapshots: BlockSnapshot[]
  ): Promise<string> {
    const sectionMarkdowns: string[] = [];

    for (const snapshot of snapshots) {
      const sectionMarkdown = await this.convertSnapshotToMarkdown(snapshot);
      if (sectionMarkdown.trim()) {
        sectionMarkdowns.push(sectionMarkdown);
      }
    }

    // 使用分割标记连接各个部分
    return sectionMarkdowns.join('\n\n<!-- note:split -->\n\n');
  }

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
        return '';

      case 'affine:list':
        return this.listToMarkdown(block);

      case 'affine:code':
        return this.codeToMarkdown(block);

      case 'affine:image':
        return this.imageToMarkdown(block);

      case 'affine:table':
        return this.tableToMarkdown(block);

      default:
        const text = this.extractTextFromBlock(block);
        return text || '';
    }
  }

  private paragraphToMarkdown(block: BlockSnapshot): string {
    const markdown = this.extractMarkdownFromBlock(block);
    const type = block.props?.type || 'text';

    switch (type) {
      case 'h1':
        return `# ${markdown}`;
      case 'h2':
        return `## ${markdown}`;
      case 'h3':
        return `### ${markdown}`;
      case 'h4':
        return `#### ${markdown}`;
      case 'h5':
        return `##### ${markdown}`;
      case 'h6':
        return `###### ${markdown}`;
      default:
        return markdown;
    }
  }
  count = 0;
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

  private listToMarkdown(block: BlockSnapshot): string {
    const markdown = this.extractMarkdownFromBlock(block);
    const type = block.props?.type || 'bulleted';
    const checked = block.props?.checked;

    switch (type) {
      case 'numbered':
        return `1. ${markdown}`;
      case 'todo':
        const checkmark = checked ? '[x]' : '[ ]';
        return `- ${checkmark} ${markdown}`;
      case 'bulleted':
      default:
        return `- ${markdown}`;
    }
  }

  private codeToMarkdown(block: BlockSnapshot): string {
    const text = this.extractTextFromBlock(block);
    const language = block.props?.language || '';

    return `\`\`\`${language}\n${text}\n\`\`\``;
  }

  private imageToMarkdown(block: BlockSnapshot): string {
    const sourceId = block.props?.sourceId || '';
    const caption = block.props?.caption || '';

    return `![${caption}](${sourceId})`;
  }

  private tableToMarkdown(block: BlockSnapshot): string {
    const { columns, rows, cells } = block.props || {};
    if (!columns || !rows || !cells) {
      return '';
    }

    const table = this.processTableForMarkdown(columns, rows, cells);
    return this.formatTableAsMarkdown(table.rows);
  }

  private processTableForMarkdown(columns: any, rows: any, cells: any): any {
    const sortedColumns = Object.values(columns).sort((a: any, b: any) =>
      a.order.localeCompare(b.order)
    );
    const sortedRows = Object.values(rows).sort((a: any, b: any) =>
      a.order.localeCompare(b.order)
    );

    const tableRows: any[] = [];
    sortedRows.forEach((r: any) => {
      const row: any[] = [];
      sortedColumns.forEach((col: any) => {
        const cell = cells[`${r.rowId}:${col.columnId}`];
        if (!cell) {
          row.push('');
          return;
        }
        const cellText = this.extractMarkdownFromCellText(cell.text);
        row.push(cellText);
      });
      tableRows.push(row);
    });

    return { rows: tableRows };
  }

  private extractMarkdownFromCellText(text: any): string {
    if (text && typeof text === 'object' && 'delta' in text) {
      return (text as any).delta
        .map((d: any) => {
          let insert = d.insert || '';

          if (d.attributes) {
            // 处理链接
            if (d.attributes.link) {
              insert = `[${insert}](${d.attributes.link})`;
            }
            // 处理标准markdown格式
            else if (
              d.attributes.bold &&
              !d.attributes.color &&
              !d.attributes.background
            ) {
              insert = `**${insert}**`;
            } else if (
              d.attributes.italic &&
              !d.attributes.color &&
              !d.attributes.background
            ) {
              insert = `*${insert}*`;
            } else if (
              d.attributes.strike &&
              !d.attributes.color &&
              !d.attributes.background
            ) {
              insert = `~~${insert}~~`;
            } else if (
              d.attributes.code &&
              !d.attributes.color &&
              !d.attributes.background
            ) {
              insert = `\`${insert}\``;
            }
            // 处理自定义语法
            else {
              const customAttributes = this.buildCustomAttributes(d.attributes);
              if (customAttributes) {
                insert = `[${insert}]{${customAttributes}}`;
              }
            }
          }

          return insert;
        })
        .join('');
    }
    return '';
  }

  private formatTableAsMarkdown(rows: string[][]): string {
    if (rows.length === 0) {
      return '';
    }

    const columnWidths = this.calculateColumnWidths(rows);
    const formattedRows = rows.map((row, index) =>
      this.formatTableRow(row, columnWidths, index === 0)
    );
    return formattedRows.join('\n');
  }

  private calculateColumnWidths(rows: string[][]): number[] {
    return (
      rows[0]?.map((_, colIndex) =>
        Math.max(...rows.map(row => (row[colIndex] || '').length))
      ) ?? []
    );
  }

  private formatTableRow(
    row: string[],
    columnWidths: number[],
    isHeader: boolean
  ): string {
    const cells = row.map((cell, colIndex) =>
      cell?.padEnd(columnWidths[colIndex] ?? 0, ' ')
    );
    const rowString = `| ${cells.join(' | ')} |`;
    return isHeader
      ? `${rowString}\n${this.formatTableSeparator(columnWidths)}`
      : rowString;
  }

  private formatTableSeparator(columnWidths: number[]): string {
    const separator = columnWidths.map(width => '-'.repeat(width)).join(' | ');
    return `| ${separator} |`;
  }

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

  private extractMarkdownFromBlock(block: BlockSnapshot): string {
    const text = block.props?.text;

    if (text && typeof text === 'object' && 'delta' in text) {
      return (text as any).delta
        .map((d: any) => {
          let insert = d.insert || '';

          if (d.attributes) {
            // 处理链接
            if (d.attributes.link) {
              insert = `[${insert}](${d.attributes.link})`;
            }
            // 处理标准markdown格式
            else if (
              d.attributes.bold &&
              !d.attributes.color &&
              !d.attributes.background
            ) {
              insert = `**${insert}**`;
            } else if (
              d.attributes.italic &&
              !d.attributes.color &&
              !d.attributes.background
            ) {
              insert = `*${insert}*`;
            } else if (
              d.attributes.strike &&
              !d.attributes.color &&
              !d.attributes.background
            ) {
              insert = `~~${insert}~~`;
            } else if (
              d.attributes.code &&
              !d.attributes.color &&
              !d.attributes.background
            ) {
              insert = `\`${insert}\``;
            }
            // 处理自定义语法
            else {
              const customAttributes = this.buildCustomAttributes(d.attributes);
              if (customAttributes) {
                insert = `[${insert}]{${customAttributes}}`;
              }
            }
          }

          return insert;
        })
        .join('');
    }

    if (typeof text === 'string') {
      return text;
    }

    return '';
  }

  /**
   * 构建自定义属性字符串
   */
  private buildCustomAttributes(attributes: any): string {
    const parts: string[] = [];

    // 处理颜色
    if (attributes.color) {
      if (
        [
          'red',
          'blue',
          'green',
          'yellow',
          'purple',
          'orange',
          'pink',
          'gray',
          'black',
          'white',
        ].includes(attributes.color)
      ) {
        parts.push(`.${attributes.color}`);
      } else {
        parts.push(`color: ${attributes.color}`);
      }
    }

    // 处理背景色
    if (attributes.background) {
      if (attributes.background === 'yellow') {
        parts.push('.highlight');
      } else {
        parts.push(`background: ${attributes.background}`);
      }
    }

    // 处理其他属性
    if (attributes.bold) {
      parts.push('.bold');
    }
    if (attributes.italic) {
      parts.push('.italic');
    }
    if (attributes.strike) {
      parts.push('.strike');
    }
    if (attributes.underline) {
      parts.push('.underline');
    }
    if (attributes.code) {
      parts.push('.code');
    }

    // 处理其他自定义属性
    Object.keys(attributes).forEach(key => {
      if (
        ![
          'color',
          'background',
          'bold',
          'italic',
          'strike',
          'underline',
          'code',
          'link',
        ].includes(key)
      ) {
        parts.push(`${key}: ${attributes[key]}`);
      }
    });

    return parts.join(', ');
  }
}

export class SimpleLayoutConverter {
  static async markdownToSnapshot(markdown: string): Promise<BlockSnapshot> {
    return MarkdownToSnapshotConverter.convert(markdown);
  }

  static async markdownToMultipleSnapshots(
    markdown: string
  ): Promise<BlockSnapshot[]> {
    return MarkdownToSnapshotConverter.convertWithSplit(markdown);
  }

  static async snapshotToMarkdown(snapshot: BlockSnapshot): Promise<string> {
    return SnapshotToMarkdownConverter.convert(snapshot);
  }

  static async multipleSnapshotsToMarkdown(
    snapshots: BlockSnapshot[]
  ): Promise<string> {
    return SnapshotToMarkdownConverter.convertMultiple(snapshots);
  }
}
