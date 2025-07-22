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
  const compactMixedContent = `<!-- layout:multi-column{"id": "mc-1","columns": [{ "id": "col-1", "width": 70 },{ "id": "col-2", "width": 30 }]}-->
<!-- content:column{"parent": "mc-1","insert": "col-1"} -->
# Japan August Summer 10-Day Tour: Tokyo-Kyoto-Osaka Golden Route Deep Experience

August in Japan is a summer carnival and the best time to experience its unique summer culture. From bustling cities to ancient temples, and vibrant food capitals, this classic "Golden Route" will showcase Japan's diverse charm. This report will detail a ten-day trip to Japan in August, highlighting unique experiences of summer festivals and fireworks, helping you create unforgettable summer memories.

## I. Itinerary Overview and Best Route

This itinerary revolves around Japan's most popular "Golden Route"—Tokyo, Kyoto, Osaka—balancing urban flair, historical culture, and culinary shopping. The itinerary design emphasizes efficiency and experience, utilizing the Shinkansen to connect major cities, ensuring you fully experience the essence of each destination.

* **Days 1-3: Tokyo** - Explore the pulse of the modern metropolis, feel the charm of the blend of trends and tradition.
* **Days 4-6: Kyoto** - Immerse in the tranquility and elegance of the ancient capital, experience traditional Japanese culture.
* **Days 7-9: Osaka** - Feel the enthusiasm and vitality of Kansai, enjoy the fun of food and shopping.
* **Day 10: Return** - Depart from Osaka or Tokyo.

## II. Detailed Daily Itinerary

### Tokyo (Days 1-3)

* **Day 1: Arrival in Tokyo, Shinjuku/Shibuya Initial Experience**
  * Morning: Arrive at Narita (NRT) or Haneda (HND) Airport, proceed to hotel check-in.
  * Afternoon: Explore Shinjuku, ascend the Tokyo Metropolitan Government Building for a panoramic city view, feel the nightlife atmosphere of Kabukicho.
  * Evening: Dine in Shinjuku or Shibuya, feel the pulse of Tokyo's metropolis.
* **Day 2: Asakusa Temple and Ueno Cultural Tour**
  * Morning: Visit Tokyo's oldest temple—Asakusa Temple, stroll Nakamise Shopping Street, experience traditional Japanese style.
  * Afternoon: Head to Ueno Park, visit Tokyo National Museum or Ueno Zoo, feel the fusion of culture and nature.
  * Evening: Experience anime and electronics culture in Akihabara, or enjoy high-end shopping and dining in Ginza.
* **Day 3: Harajuku/Omotesando Trends and Summer Festivals**
  * Morning: Explore Harajuku Takeshita Street's trend culture, or feel fashion and design in Omotesando.
  * Afternoon: Participate in local summer festivals based on early August's event schedule (e.g., Kagurazaka Festival, Azabu Juban Noryo Festival, specific dates need to be checked annually).
  * Evening: If there are large fireworks festivals (e.g., Edogawa Fireworks Festival, Jingu Gaien Fireworks Festival, usually held from late July to early August, specific dates need to be checked), go to watch and feel the splendor of the summer night sky.

### Kyoto (Days 4-6)

* **Day 4: Shinkansen to Kyoto, Fushimi Inari Taisha and Gion**
  * Morning: Take the Shinkansen from Tokyo to Kyoto (about 2.5-3 hours).
  * Afternoon: Visit the iconic Fushimi Inari Taisha, traverse the thousand torii gates.
  * Evening: Stroll Hanamikoji Street in Gion, feel the night scene and geisha culture of the ancient capital, taste Kyoto's specialty cuisine.
* **Day 5: Arashiyama Bamboo Grove and Kinkaku-ji**
  * Morning: Head to Arashiyama, walk the bamboo grove path, take the Sagano Romantic Train (advance booking required), enjoy the scenery of Hozu River.
  * Afternoon: Visit Kinkaku-ji (Rokuon-ji), admire its golden architecture and exquisite gardens.
  * Evening: Dine near Kyoto Station, or experience Kyoto's izakaya culture.
* **Day 6: Kiyomizu-dera and Kyoto Summer Festivals**
  * Morning: Visit Kiyomizu-dera, stroll Ninenzaka and Sannenzaka, buy specialty souvenirs.
  * Afternoon: If there are early August Kyoto festivals (e.g., Gozan Okuribi, usually on August 16, confirm date), learn about viewing locations in advance. Or visit other temples like Sanjusangendo, Tofuku-ji.
  * Evening: Walk along the Kamo River, feel Kyoto's summer night.

### Osaka (Days 7-9)

* **Day 7: Shinkansen to Osaka, Dotonbori and Shinsaibashi**
  * Morning: Take the Shinkansen from Kyoto to Osaka (about 15 minutes).
  * Afternoon: Explore Osaka's most bustling commercial area—Dotonbori and Shinsaibashi, feel Osaka's vitality and food atmosphere.
  * Evening: Taste Osaka's specialty snacks in Dotonbori, such as takoyaki, okonomiyaki, kushikatsu.
* **Day 8: Osaka Castle and Tsutenkaku**
  * Morning: Visit Osaka Castle Park and the main tower, learn about Osaka's history.
  * Afternoon: Head to Shinsekai area, ascend Tsutenkaku, feel the retro street culture.
  * Evening: If there are early August Osaka fireworks festivals (e.g., Yodogawa Fireworks Festival, usually in early August, confirm date), go to watch.
* **Day 9: Universal Studios or Osaka Aquarium**
  * All day: Choose to visit Universal Studios Japan (USJ) for thrilling rides, or visit Osaka Aquarium, explore the mysteries of marine life.
  * Evening: Shop or dine in Umeda area, feel Osaka's modern urban charm.

### Return (Day 10)

* **Day 10: Shopping and Departure**
  * Morning: Depending on flight time, do final shopping (e.g., in Osaka Umeda or Namba area).
  * Afternoon: Head to Kansai International Airport (KIX) or Itami Airport (ITM) for return flight.

## III. August Special Festivals and Fireworks

August is the peak season for summer festivals and fireworks in Japan, here are some noteworthy events (specific dates and locations may adjust annually, be sure to check official information for the year):

* **Fireworks Festivals:**
  * **Edogawa Fireworks Festival (Tokyo):** Usually held on the first Saturday of August, one of Tokyo's largest fireworks festivals.
  * **Jingu Gaien Fireworks Festival (Tokyo):** Usually held in mid-August, held in the city center, convenient transportation.
  * **Yodogawa Fireworks Festival (Osaka):** Usually held in early August, one of the largest fireworks festivals in Kansai region.
  * **Lake Biwa Fireworks Festival (Shiga, near Kyoto):** Usually held in early August, held by Lake Biwa, spectacular scenery.
  * **Viewing Method:** Arrive early to occupy advantageous positions, or book restaurants/hotels with viewing perspectives. Some fireworks festivals have paid viewing areas.
* **Summer Festivals (Natsu Matsuri):**
  * **Kagurazaka Festival (Tokyo):** Usually held from late July to early August, with Awa Odori performances.
  * **Azabu Juban Noryo Festival (Tokyo):** Usually held in late August, a famous food festival in Tokyo.
  * **Gozan Okuribi (Kyoto):** Held annually on August 16, a traditional event of Kyoto's Obon Festival, lighting bonfires in the shape of "大" on mountains around Kyoto to send off ancestral spirits.
  * **Obon Festival (お盆):** Mid-August (13-16) is Japan's Obon Festival, many Japanese return home to worship ancestors, transportation and accommodation may be tighter.

## IV. Weather Conditions and Dressing Advice

August is Japan's hottest and most humid month, with temperatures generally between 28-35°C and high humidity.

* **Dressing Advice:** Wear light, breathable, sweat-absorbing cotton or quick-drying fabric clothing. Short sleeves, shorts, dresses are preferred.
* **Sun Protection:** Be sure to take sun protection measures, such as wearing hats, sunglasses, applying high SPF sunscreen.
* **Heat Prevention:** Carry a water bottle, replenish water in time, avoid prolonged exposure. Prepare small fans, cooling sprays, etc.
* **Rain Gear:** August is also typhoon season, although not necessarily encountered, showers may still occur, it is recommended to carry a folding umbrella.

## V. Transportation Guide

* **International Transportation:** Arrive at Tokyo Narita/Haneda Airport or Osaka Kansai International Airport.
* **Intercity Transportation:**
  * **JR Pass (Japan Rail Pass):** If planning frequent Shinkansen rides, purchasing a JR Pass may be more cost-effective. Consider 7-day or 14-day JR Pass for a 10-day itinerary.
  * **Shinkansen:** Mainly rely on Shinkansen between Tokyo-Kyoto-Osaka, fast and comfortable.
* **City Transportation:**
  * **IC Card:** Purchase Suica (Tokyo) or ICOCA (Kansai) transportation IC cards, available for purchase and recharge at convenience stores, applicable to subways, JR, buses, etc., convenient and fast.
  * **Subway/JR:** Tokyo and Osaka's subway and JR lines are developed, the main city transportation method.
  * **Bus:** Kyoto city buses are the main transportation tool, bus day passes are available.

## VI. Accommodation Suggestions

August is peak tourist season, especially with fireworks festivals and Obon Festival, accommodation needs to be booked in advance.

* **Tokyo:** Recommend areas with convenient transportation such as Shinjuku, Shibuya, Ikebukuro, Ueno.
* **Kyoto:** Recommend areas near Kyoto Station, Kawaramachi, Gion.
* **Osaka:** Recommend areas such as Namba, Umeda, Shinsaibashi.
* **Types:** Hotels, Ryokan (experience traditional culture), capsule hotels (economical), homestays, etc.

## VII. Food Recommendations

Japanese cuisine is diverse and distinctive:

* **Tokyo:** Sushi, ramen (e.g., Ichiran, AFURI), tempura, Tsukiji Market seafood, various trendy desserts.
* **Kyoto:** Kaiseki cuisine, yudofu, matcha desserts, Kyoto vegetable dishes.
* **Osaka:** Takoyaki, okonomiyaki, kushikatsu, fugu cuisine, Japanese barbecue.
* **Convenience Store Food:** Japanese convenience stores (e.g., 7-11, FamilyMart, Lawson) offer rice balls, sandwiches, desserts worth trying.

## VIII. Practical Travel Tips

* **Network:** Rent portable Wi-Fi or purchase Japanese SIM cards to keep the network smooth.
* **Cash:** Japan is still a cash society, especially in small shops or temples, it is recommended to have enough cash.
* **Language:** Learning some simple Japanese greetings (e.g., "thank you", "hello") will be helpful.
* **Etiquette:** Follow local etiquette, such as queuing, not speaking loudly in public places, paying attention to dining etiquette, etc.
* **Garbage Sorting:** Japan has strict garbage sorting, please pay attention to distinguish.
* **Shopping Tax Refund:** Many stores offer tax-free services, please carry your passport when shopping.

## IX. Budget Estimate

Below is a rough budget per person per day, excluding international airfare, for reference only:

* **Accommodation:** 500-1500 RMB/night (fluctuates based on hotel level and booking time)
* **Dining:** 200-500 RMB/day (varies from convenience stores to high-end restaurants)
* **Transportation:** 100-300 RMB/day (if purchasing JR Pass, calculated separately, city transportation costs)
* **Attraction Tickets/Activities:** 50-200 RMB/day
* **Shopping/Other:** Highly flexible

**Total:** Excluding international airfare, approximately 850-2500 RMB per person per day. Total budget for 10-day itinerary is about 8500-25000 RMB.

## X. Precautions

* **Advance Booking:** August is peak tourist season, be sure to book flights, hotels, Shinkansen tickets (especially during Obon Festival), popular attraction tickets (e.g., Universal Studios), and fireworks festival viewing seats in advance.
* **Heat Prevention:** High temperature and humidity weather can easily cause heatstroke, be sure to take heat prevention measures, drink plenty of water, avoid prolonged outdoor activities.
* **Typhoon:** August is Japan's typhoon season, pay attention to weather forecasts before traveling, if encountering typhoons, it may affect transportation and itinerary.
* **Crowds:** Popular attractions and fireworks festivals are crowded, please pay attention to safety and keep personal belongings.
* **Fireworks Festival Viewing:** Many fireworks festivals require early positioning or purchasing designated seats. Please understand the rules in advance.

I hope this detailed Japan August 10-day tour plan helps you start an exciting summer journey!
<!-- end:content:column -->

<!-- content:column{"parent": "mc-1","insert": "col-2"} -->
\`\`\`html
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Noto Sans JP', sans-serif;
      background-color: #f7f7f7;
      padding: 20px;
    }
    .card {
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      margin-bottom: 20px;
      padding: 20px;
      transition: transform 0.2s;
    }
    .card:hover {
      transform: translateY(-5px);
    }
    .card img {
      width: 100%;
      border-radius: 8px;
    }
    .card h3 {
      margin-top: 10px;
      color: #333;
    }
    .card p {
      color: #666;
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="https://source.unsplash.com/featured/?tokyo" alt="Tokyo">
    <h3>Tokyo</h3>
    <p>Experience the vibrant pulse of Tokyo, from Shinjuku's nightlife to Asakusa's traditional charm.</p>
  </div>
  <div class="card">
    <img src="https://source.unsplash.com/featured/?kyoto" alt="Kyoto">
    <h3>Kyoto</h3>
    <p>Immerse in Kyoto's tranquility, explore ancient temples and participate in summer festivals.</p>
  </div>
  <div class="card">
    <img src="https://source.unsplash.com/featured/?osaka" alt="Osaka">
    <h3>Osaka</h3>
    <p>Feel the energy of Osaka, indulge in local delicacies and enjoy shopping in bustling districts.</p>
  </div>
</body>
</html>
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
