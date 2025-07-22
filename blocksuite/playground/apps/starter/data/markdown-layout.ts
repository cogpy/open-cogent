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
  const compactMixedContent = `<!-- layout:multi-column{"id": "mc-news-main","columns": [{ "id": "col-headline", "width": 60 },{ "id": "col-visual", "width": 40 }]}-->
<!-- content:column{"parent": "mc-news-main","insert": "col-headline"} -->
# [Breakthrough: 'Quantum Photonic Resonance Cells' Promise 24/7 Solar Power Revolution]{"color": "oklch(32.1% 0.18 250)","bg": "oklch(98% 0.01 250)"}

[By Alex Chen, Science Correspondent]{"color": "oklch(45% 0.12 250)", ".italic": true}

[NEO-GENESIS CITY, Terra Nova –]{"color": "oklch(40% 0.14 250)", ".bold": true} In a monumental stride towards global energy independence, researchers at the pioneering Solara Dynamics Institute have unveiled a revolutionary new technology dubbed ==Quantum Photonic Resonance Cells (QPRC)==. This groundbreaking innovation promises to fundamentally transform how humanity harnesses solar energy, offering the unprecedented ability to generate electricity not just from direct sunlight, but from virtually any ambient light source, day or night, indoors or out. The discovery, led by the visionary Dr. Aris Thorne, is being hailed as the definitive answer to renewable energy's long-standing intermittency challenge.

---

The QPRC technology represents a paradigm shift from conventional photovoltaic cells. Unlike traditional solar panels that rely on direct, high-intensity sunlight to excite electrons and generate current, QPRCs are engineered to capture and convert an incredibly broad spectrum of electromagnetic radiation, including low-intensity visible light, infrared, and even ultraviolet wavelengths that are abundant in ambient environments. This is achieved through a novel material composite that leverages quantum resonance principles, allowing the cells to efficiently "tune into" and absorb energy from diffuse photons, regardless of their intensity or origin. Early prototypes have demonstrated remarkable efficiency, producing consistent power output even under cloudy skies, artificial lighting, or during nighttime hours from residual atmospheric light.

<!-- end:content:column -->

<!-- content:column{"parent": "mc-news-main","insert": "col-visual"} -->
\`\`\`html
<div class="flex flex-col items-center justify-center h-full p-4 bg-[oklch(97%_0.01_250)] rounded-lg shadow-lg" style="font-family: 'Merriweather', serif;">
  <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80" alt="Futuristic solar cell" class="rounded-lg mb-4 shadow-md transition-transform duration-500 hover:scale-105" style="aspect-ratio: 4/3; object-fit: cover;">
  <div class="text-center text-[oklch(32.1%_0.18_250)] text-lg font-bold tracking-wide mb-1">Quantum Photonic Resonance Cells</div>
  <div class="text-center text-[oklch(45%_0.12_250)] text-sm">A new era of continuous, ambient-powered solar energy</div>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700&display=swap');
  </style>
</div>
\`\`\`
<!-- end:content:column -->

<!-- note:split{"title":"The Science Behind QPRC","backgroundColor":"oklch(97% 0.01 250)"} -->

<!-- layout:multi-column{"id": "mc-news-details","columns": [{ "id": "col-details-1", "width": 50 },{ "id": "col-details-2", "width": 50 }]}-->
<!-- content:column{"parent": "mc-news-details","insert": "col-details-1"} -->
## [How QPRC Works]{"color": "oklch(32.1% 0.18 250)"}

At the heart of the QPRC's efficiency lies its unique molecular structure, which features a lattice of specially engineered quantum dots. These dots are designed to resonate at multiple frequencies, allowing them to absorb photons across a much wider energy range than silicon-based cells.

When a photon strikes a quantum dot, it excites an electron to a higher energy state. Instead of immediately decaying, the electron's energy is efficiently transferred through a resonant tunneling effect to a conductive layer, creating a continuous electrical current. This process is highly efficient even with low-energy photons, explaining the technology's ability to generate power from diffuse light.

<!-- end:content:column -->

<!-- content:column{"parent": "mc-news-details","insert": "col-details-2"} -->
## [Implications & Applications]{"color": "oklch(32.1% 0.18 250)"}

The implications of this breakthrough are profound and far-reaching:

- [Continuous solar power generation, day and night]{"color": "oklch(45% 0.12 250)"}
- [Reduced need for battery storage]{"color": "oklch(45% 0.12 250)"}
- [Integration into buildings, clothing, and devices]{"color": "oklch(45% 0.12 250)"}
- [Potential for self-sustaining smart cities]{"color": "oklch(45% 0.12 250)"}
- [Accelerated transition to sustainable energy]{"color": "oklch(45% 0.12 250)"}

QPRCs are also remarkably durable and require minimal maintenance, promising a long operational lifespan.

<!-- end:content:column -->

<!-- note:split{"title":"A New Dawn for Clean Energy","backgroundColor":"oklch(97% 0.01 250)"} -->

<!-- layout:multi-column{"id": "mc-news-future","columns": [{ "id": "col-future-1", "width": 50 },{ "id": "col-future-2", "width": 50 }]}-->
<!-- content:column{"parent": "mc-news-future","insert": "col-future-1"} -->
## [What’s Next?]{"color": "oklch(32.1% 0.18 250)"}

With pilot projects slated for deployment in urban infrastructure and remote energy hubs within the next two years, Solara Dynamics Institute anticipates that QPRC technology will rapidly become a cornerstone of the global energy landscape.

This innovation not only promises to deliver clean, abundant, and continuous power but also inspires a future where energy scarcity is a relic of the past, paving the way for a more equitable and environmentally harmonious world.

<!-- end:content:column -->

<!-- content:column{"parent": "mc-news-future","insert": "col-future-2"} -->
\`\`\`html
<div class="relative bg-[oklch(98%_0.01_250)] rounded-lg shadow-md p-4 flex flex-col items-center" style="font-family: 'Merriweather', serif;">
  <svg width="120" height="120" viewBox="0 0 120 120" class="mb-2 animate-spin-slow">
    <defs>
      <radialGradient id="qprc-gradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="oklch(98% 0.01 250)" />
        <stop offset="100%" stop-color="oklch(45% 0.12 250)" />
      </radialGradient>
    </defs>
    <circle cx="60" cy="60" r="50" fill="url(#qprc-gradient)" />
    <circle cx="60" cy="60" r="30" fill="none" stroke="oklch(32.1% 0.18 250)" stroke-width="4" stroke-dasharray="10,10" />
    <circle cx="60" cy="60" r="10" fill="oklch(32.1% 0.18 250)" />
  </svg>
  <div class="text-center text-[oklch(32.1%_0.18_250)] font-bold text-base">Continuous Power Flow</div>
  <div class="text-center text-[oklch(45%_0.12_250)] text-xs mt-1">QPRC enables round-the-clock clean energy</div>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700&display=swap');
    .animate-spin-slow {
      animation: spin 8s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg);}
      100% { transform: rotate(360deg);}
    }
  </style>
</div>
\`\`\`
<!-- end:content:column -->`;
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
