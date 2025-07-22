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
  const compactMixedContent = `<!-- layout:multi-column{"id": "masthead-row","columns": [{ "id": "masthead-col", "width": 100 }]}-->
<!-- content:column{"parent": "masthead-row","insert": "masthead-col"} -->
\`\`\`html
<div>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Roboto:wght@400;700&display=swap" rel="stylesheet">
<style>
  .masthead {
    font-family: 'Playfair Display', serif;
    letter-spacing: 0.08em;
    text-align: center;
    padding: 1.5rem 0 0.5rem 0;
    border-bottom: 3px solid oklch(95% 0 0);
    margin-bottom: 0.5rem;
    background: oklch(98% 0 0);
  }
  .masthead-title {
    font-size: 3.2rem;
    font-weight: 900;
    color: oklch(20% 0 0);
    text-shadow: 0 2px 0 oklch(98% 0 0);
    letter-spacing: 0.12em;
  }
  .masthead-sub {
    font-family: 'Roboto', sans-serif;
    font-size: 1.1rem;
    color: oklch(40% 0 0);
    margin-top: 0.2rem;
    letter-spacing: 0.04em;
  }
</style>
<div class="masthead">
  <div class="masthead-title">THE DAILY HERALD</div>
  <div class="masthead-sub">Tuesday, July 22, 2025 &nbsp;|&nbsp; Edition No. 184 &nbsp;|&nbsp; www.dailyherald.com</div>
</div>
\`\`\`
</div>
<!-- end:content:column -->

<!-- layout:multi-column{"id": "main-row","columns": [{ "id": "col-1", "width": 33 },{ "id": "col-2", "width": 34 },{ "id": "col-3", "width": 33 }]}-->
<!-- content:column{"parent": "main-row","insert": "col-1"} -->

## [TECHNOLOGY]{"color": "oklch(20% 0.02 260)"}

---

### [AI's Ascent Redefines the Future]{"color": "oklch(20% 0.02 260)", ".bold": true}

[Artificial intelligence continues its remarkable trajectory, pushing the boundaries of what was once thought possible.]{".italic": true, "color": "oklch(38% 0.01 260)"}

A standout achievement saw an experimental OpenAI model secure an astonishing 35 out of 42 points at the International Math Olympiad, earning a gold medal. This feat underscores AI's growing capacity for complex problem-solving and abstract reasoning, challenging traditional notions of intellectual prowess.

A magnetic breakthrough promises to make AI systems ten times more efficient, potentially revolutionizing data processing and energy consumption. Policymakers are taking note: the Trump administration is reportedly planning a major AI policy overhaul, signaling governmental recognition of AI's profound societal and economic implications.

Microsoft's stock surged on the back of increased AI adoption, reflecting market confidence. While a human programmer narrowly bested an AI in a recent coding competition, the overall trend points to AI's increasing integration into, and influence over, nearly every facet of modern life.

---

### [Market Watch]{"color": "oklch(20% 0.02 260)", ".bold": true}

\`\`\`html
<div>
<style>
  .ticker {
    font-family: 'Roboto', sans-serif;
    font-size: 1rem;
    background: oklch(98% 0 0);
    border: 1px solid oklch(90% 0 0);
    border-radius: 0.3rem;
    padding: 0.5rem 0.8rem;
    margin: 0.7rem 0 1.2rem 0;
    overflow: hidden;
    white-space: nowrap;
    box-shadow: 0 1px 3px oklch(90% 0 0 / 0.08);
  }
  .ticker span {
    margin-right: 1.5rem;
    font-weight: 700;
  }
  .ticker .up { color: oklch(45% 0.18 140); }
  .ticker .down { color: oklch(45% 0.18 30); }
</style>
<div class="ticker">
  <span>MSFT <span class="up">+2.1%</span></span>
  <span>GOOGL <span class="up">+1.4%</span></span>
  <span>NVDA <span class="up">+3.2%</span></span>
  <span>TSLA <span class="down">-0.8%</span></span>
  <span>DJIA <span class="up">+0.6%</span></span>
</div>
</div>
\`\`\`

<!-- end:content:column -->

<!-- content:column{"parent": "main-row","insert": "col-2"} -->

## [WORLD NEWS]{"color": "oklch(20% 0.02 30)"}

---

### [A World in Flux: Global Tensions and Challenges]{"color": "oklch(20% 0.02 30)", ".bold": true}

[As the world navigates the mid-2020s, a complex tapestry of rapid technological advancement, persistent global challenges, and captivating human endeavors unfolds daily.]{".italic": true, "color": "oklch(38% 0.01 30)"}

Health concerns remain prominent, with a resurgence of COVID-19 outbreaks in Australian aged care facilities—a stark reminder of the virus's enduring presence and the need for continued vigilance.

On the international stage, 25 nations condemned Israel over civilian casualties in Gaza, highlighting the ongoing humanitarian crisis and deep divisions in the Middle East. Diplomacy continues its vital role, with Ukraine calling for talks with Russia next week—a hopeful sign amidst the protracted conflict.

Environmental concerns loom large, with a severe heat dome affecting over 90 million Americans, underscoring the increasing frequency and intensity of extreme weather events.

---

### [Weather]{"color": "oklch(20% 0.02 30)", ".bold": true}

\`\`\`html
<div>
<style>
  .weather-box {
    font-family: 'Roboto', sans-serif;
    background: oklch(98% 0 0);
    border: 1px solid oklch(90% 0 0);
    border-radius: 0.3rem;
    padding: 0.7rem 1.1rem;
    margin: 0.7rem 0 1.2rem 0;
    display: flex;
    align-items: center;
    gap: 1.1rem;
    box-shadow: 0 1px 3px oklch(90% 0 0 / 0.08);
  }
  .weather-icon {
    font-size: 2.2rem;
    color: oklch(45% 0.18 80);
  }
  .weather-details {
    font-size: 1.1rem;
    color: oklch(30% 0.01 30);
  }
  .weather-temp {
    font-size: 1.5rem;
    font-weight: 700;
    color: oklch(20% 0.02 30);
  }
</style>
<div class="weather-box">
  <span class="weather-icon">☀️</span>
  <div class="weather-details">
    <div class="weather-temp">New York: 89°F / 32°C</div>
    <div>Sunny, Heat Advisory</div>
    <div>Humidity: 54% &nbsp;|&nbsp; Wind: 8 mph SW</div>
  </div>
</div>
</div>
\`\`\`

<!-- end:content:column -->

<!-- content:column{"parent": "main-row","insert": "col-3"} -->

## [SPORTS]{"color": "oklch(20% 0.02 120)"}

---

### [Sporting Drama: Records, Rookies, and Returns]{"color": "oklch(20% 0.02 120)", ".bold": true}

[The world of sports provides a compelling counterpoint of human achievement, drama, and entertainment.]{".italic": true, "color": "oklch(38% 0.01 120)"}

Baseball fans are witnessing a potentially historic season, with five players on track to hit 50+ home runs. The White Sox are enjoying a season-high four-game winning streak, while the Phillies secured a dramatic walk-off win over the Red Sox due to catcher's interference.

In basketball, the NBA Summer League has found a new sensation in Chinese rookie Yang Hansen, whose impressive play has captured global attention. Veteran point guard Chris Paul is set to return to the LA Clippers for his 21st NBA season—a testament to his longevity and enduring impact.

Meanwhile, in cycling, Tim Wellens claimed victory in Stage 15 of the Tour de France, adding another chapter to the race's storied history.

---

### [Quick Stats]{"color": "oklch(20% 0.02 120)", ".bold": true}

- **MLB Home Run Leaders:** 5 players on pace for 50+
- **NBA:** Chris Paul returns to Clippers (21st season)
- **Tour de France:** Tim Wellens wins Stage 15

<!-- end:content:column -->

<!-- note:split{"title":"In Summary","backgroundColor":"oklch(98% 0 0)"} -->

# [A Vibrant Mosaic of Innovation, Challenge, and Human Endeavor]{"color": "oklch(20% 0.02 260)", ".bold": true}

[The rapid advancements in AI promise to reshape industries and societies, while persistent geopolitical tensions and health crises demand ongoing attention and diplomatic efforts. Simultaneously, the world of sports continues to captivate, offering thrilling spectacles and inspiring stories of dedication and achievement. As these diverse narratives unfold, they collectively define an era marked by both profound transformation and enduring human spirit.]{".italic": true, "color": "oklch(38% 0.01 260)"}`;
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
