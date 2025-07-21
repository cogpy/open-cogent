export const codeAndListsDemoContent = `## 🎨 深度嵌套布局展示

<!-- layout:multi-column
{
  "id": "root-layout",
  "gap": 20,
  "columns": [
    {"id": "left-section", "width": 25},
    {"id": "center-section", "width": 50},
    {"id": "right-section", "width": 25}
  ]
}
-->

<!-- content:column
{
  "parent": "root-layout",
  "insert": "left-section"
}
-->

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

<!-- content:column
{
  "parent": "root-layout",
  "insert": "center-section"
}
-->

### 🌟 主要展示

<!-- layout:multi-column
{
  "id": "center-header",
  "gap": 12,
  "columns": [
    {"id": "title", "width": 70},
    {"id": "badges", "width": 30}
  ],
  "parent": "root-layout",
  "insert": "center-section"
}
-->

<!-- content:column
{
  "parent": "center-header",
  "insert": "title"
}
-->

\`\`\`html
<div style="background: white; border-radius: 12px; padding: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); margin-bottom: 12px;">
  <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #1e293b;">🎨 设计系统</h3>
</div>
\`\`\`

<!-- end:content:column -->

<!-- content:column
{
  "parent": "center-header",
  "insert": "badges"
}
-->

\`\`\`html
<div style="display: flex; gap: 6px; justify-content: flex-end; padding: 16px;">
  <span style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 4px 10px; border-radius: 10px; font-size: 10px; font-weight: 600;">BETA</span>
  <span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 4px 10px; border-radius: 10px; font-size: 10px; font-weight: 600;">NEW</span>
</div>
\`\`\`

<!-- end:content:column -->

<!-- layout:multi-column
{
  "id": "feature-cards",
  "gap": 12,
  "columns": [
    {"id": "card-1", "width": 50},
    {"id": "card-2", "width": 50}
  ],
  "parent": "center-header",
  "insert": "title"
}
-->

<!-- content:column
{
  "parent": "feature-cards",
  "insert": "card-1"
}
-->

\`\`\`html
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 16px; color: white; text-align: center; margin-bottom: 12px;">
  <div style="font-size: 24px; margin-bottom: 8px;">⚡</div>
  <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">快速</div>
  <div style="font-size: 11px; opacity: 0.9;">毫秒级响应</div>
</div>
\`\`\`

<!-- end:content:column -->

<!-- content:column
{
  "parent": "feature-cards",
  "insert": "card-2"
}
-->

\`\`\`html
<div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); border-radius: 12px; padding: 16px; color: #8b4513; text-align: center; margin-bottom: 12px;">
  <div style="font-size: 24px; margin-bottom: 8px;">🎯</div>
  <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">精准</div>
  <div style="font-size: 11px; opacity: 0.8;">像素级控制</div>
</div>
\`\`\`

<!-- end:content:column -->

<!-- layout:multi-column
{
  "id": "status-monitor",
  "gap": 8,
  "columns": [
    {"id": "status-header", "width": 100}
  ],
  "parent": "feature-cards",
  "insert": "card-1"
}
-->

<!-- content:column
{
  "parent": "status-monitor",
  "insert": "status-header"
}
-->

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

<!-- end:content:column -->

<!-- layout:multi-column
{
  "id": "code-editor",
  "gap": 8,
  "columns": [
    {"id": "editor", "width": 100}
  ],
  "parent": "status-monitor",
  "insert": "status-header"
}
-->

<!-- content:column
{
  "parent": "code-editor",
  "insert": "editor"
}
-->

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

<!-- content:column
{
  "parent": "root-layout",
  "insert": "right-section"
}
-->

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

<!-- end:content:column -->`;
