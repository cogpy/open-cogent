# AFFiNE 项目记忆文件

## Docker 服务配置

- 项目中有 Docker 开发环境配置，位于 `.docker/dev/` 目录
- 配置文件：
  - `compose.yml.example` - Docker Compose 配置模板
  - `.env.example` - 环境变量配置模板

## 已启动的服务

已成功启动以下 Docker 服务：

1. **PostgreSQL 数据库** (pgvector/pgvector:pg16)
   - 端口：5432
   - 数据库名：open-agent
   - 用户名：open-agent
   - 密码：open-agent

2. **Redis 缓存服务** (redis:latest)
   - 端口：6379

3. **MailHog 邮件服务** (mailhog/mailhog:latest)
   - SMTP 端口：1025
   - Web UI 端口：8025
   - 访问地址：http://localhost:8025

## Rust 工具链问题

- 项目需要 Rust 1.87.0 版本支持 `workspace-inheritance` 特性
- 已安装并设置 Rust 1.87.0 工具链
- 但系统中可能还有旧版本的 cargo 在 `/opt/homebrew/bin/cargo`
- 需要确保使用正确的 cargo 路径：`/Users/zuozijian/.rustup/toolchains/1.87.0-aarch64-apple-darwin/bin/cargo`

## 启动命令

```bash
# 启动 Docker 服务
cd .docker/dev
docker-compose up -d

# 查看服务状态
docker-compose ps

# 停止服务
docker-compose down
```

## 环境变量配置

- 需要在 `packages/backend/server/.env` 文件中配置数据库连接
- 主要配置项：
  - `DATABASE_URL="postgres://open-agent:open-agent@localhost:5432/open-agent"`
  - `REDIS_SERVER_HOST=localhost`
  - 邮件服务配置（使用 MailHog）
  - API 密钥配置（可选）

## 启动应用

```bash
# 启动后端服务
yarn dev
# 选择 @afk/server
```

## 注意事项

- MailHog 镜像在 ARM64 平台上会有平台警告，但不影响使用
- 所有服务都在后台运行（-d 参数）
- 数据会持久化存储在 Docker volume 中
- 必须先启动 Docker 服务，再启动应用服务
- 如果遇到 `DATABASE_URL` 环境变量错误，检查 `.env` 文件是否存在
- **重要：不要运行任何代码，除非用户明确要求**

## Markdown 解析器开发 ✅ 已完成

- 已完成支持多列嵌套的 Markdown 解析器开发
- 实现的功能：
  - 使用注释+JSON 的语法设计
  - `<!-- layout:multi-column -->` 声明布局
  - `<!-- content:column -->` 声明列内容
  - 支持任意深度的嵌套结构
  - 完整的布局验证机制
  - 双向转换（Markdown ↔ BlockSnapshot）
- 核心文件：
  - `remark-plugins/remark-layout.ts` - 布局解析插件
  - `layout-builder.ts` - 布局树构建器
  - `enhanced-markdown-adapter.ts` - 增强适配器
- 示例文件：
  - `markdown-layout-example.md` - 使用示例
  - `MARKDOWN_LAYOUT_PARSER_README.md` - 完整文档
- 测试工具：
  - `test-parser-simple.mjs` - 完整功能测试脚本
  - `quick-test.mjs` - 快速测试工具
  - `SIMPLE_USAGE_GUIDE.md` - 简单使用指南
- 位置：`blocksuite/affine/shared/src/adapters/markdown/` 模块

### 测试方法

```bash
# 快速测试默认示例
node quick-test.mjs

# 测试指定文件
node quick-test.mjs markdown-layout-example.md

# 完整功能测试
node test-parser-simple.mjs
```

### 语法示例

```markdown
<!-- layout:multi-column
{
  "id": "my-layout",
  "gap": 20,
  "columns": [
    {"id": "left", "width": 60},
    {"id": "right", "width": 40}
  ]
}
-->

<!-- content:column
{
  "parent": "my-layout",
  "insert": "left"
}
-->

左列内容...

<!-- end:content:column -->

<!-- content:column
{
  "parent": "my-layout",
  "insert": "right"
}
-->

右列内容...

<!-- end:content:column -->
```
