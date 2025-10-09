![logo](https://github.com/user-attachments/assets/e47070b1-a453-49cc-980f-eca16d3d1e7b)

[![GitHub stars](https://img.shields.io/github/stars/AFK-surf/open-agent?style=social)](https://github.com/AFK-surf/open-agent/stargazers) &ensp;
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) &ensp;
[![Discord](https://img.shields.io/badge/Discord-Join-blue)](https://discord.gg/your-discord-invite)
[![Demo](https://img.shields.io/badge/Demo-OpenAgent.io-yellow)](http://open-agent.io)

# 👋 Open-Agent

> **Open-source alternative to Claude Agent SDK, ChatGPT Agents, and Manus.**

Agentic AI systems, such as Claude Agent SDK (Claude Code) or ChatGPT Agents, can perform meaningful real-world tasks by operating computers, browsers, and phones just like humans. Open source would enhance their capabilities.

[**Open-Agent.io**](http://open-agent.io/) is an open Agentic AI you can use or modify. Chat with cutting-edge models while our multi-agent system completes your tasks.

Play with it, deploy it, enhance it, or use it as the foundation for your next dedicated agent. We welcome all contributions.

<div align="center">
  <video src="packages/frontend/app/public/videos/openagent_intro.mp4" controls muted playsinline style="max-height:640px; min-height:200px; width:100%; border-radius:12px;">
    Your browser does not support the video tag. You can download the video <a href="assets/demo.mp4">here</a>.
  </video>
</div>
---

## ✨ Key Features

- **💡 Idea**  
  Have your own highly customizable Agentic AI that integrates OpenAI, Claude, Gemini, and open-source models to work together seamlessly!

- **💬 Stop prompt-chasing. Start decision-making**  
  Spec & context engineering give agents structure to plan, score, and surface options. You stay in control of the final call. Achieve more, struggle less.

- **🔔 Multi-agent collaboration**  
  Instead of chatting with a single AI, all the frontier models collaborate together to finish your task with our multi-agent framework.

- **🏠 Self-hostable**  
  Open source and free to modify.

---

## ⚙️ Quick Start

This project is a monorepo using Node.js, Yarn (Berry), NestJS, Rspack, and Rust. To run locally, you can install Docker and run the dependencies via Docker Compose.

#### Prerequisites

- Node.js 18–22 (engine: node < 23)
- Yarn 4 (Berry) — the repo sets `packageManager: yarn@4.9.1`
- Rust toolchain (for native packages)
- Docker + Docker Compose (Orbstack recommended)

#### 1) Install dependencies

```bash
yarn
```

#### 2) Start backend dependencies (Docker Compose)

Copy `.docker/dev/compose.yml.example` to `docker-compose.yml` (if you don’t have one).

Then:

```bash
docker compose -f ./.docker/dev/compose.yml up
```

#### 3) Configure environment

Defaults are sensible for local dev. You can export or add to a `.env` file at the repo root or `packages/backend/server/`.

```bash
# Example .env values for local development.
# Replace placeholder values with your own secrets as needed.

# Database connection string
DATABASE_URL="postgresql://open-agent:open-agent@localhost:5432/open-agent"

# Auth and web URLs
NEXTAUTH_URL="http://localhost:8080"

# Mailer configuration
MAILER_SENDER="noreply@example.com"
MAILER_USER="your_mail_user"
MAILER_PASSWORD="your_mail_password"
MAILER_HOST="localhost"
MAILER_PORT="1025"

# Stripe API keys (use your own test keys)
STRIPE_API_KEY=sk_test_your_stripe_api_key
STRIPE_WEBHOOK_KEY=whsec_your_stripe_webhook_key

# OAuth credentials (replace with your own)
OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret

# Copilot/AI API keys (replace with your own)
COPILOT_OPENAI_API_KEY=your_openai_api_key
COPILOT_PERPLEXITY_API_KEY=your_perplexity_api_key
COPILOT_FAL_API_KEY=your_fal_api_key
COPILOT_GOOGLE_API_KEY=your_google_api_key
```

#### 4) Build Rust native bindings (once)

```bash
yarn oa @afk/server-native build
```

#### 5) Run database migrations and seed (optional)

From `packages/backend/server/` you can run Prisma flows as needed:

```bash
(cd packages/backend/server && yarn prisma migrate dev)
```

#### 6) Start local development

Run web and server together from the monorepo root:

```bash
yarn dev
```

- Web app: http://localhost:8080
- Server: http://localhost:3010 (GraphQL at `/graphql`)

You can also run individually:

```bash
yarn dev:web      # runs @afk/app (Rspack dev server on 8080)
yarn dev:server   # runs backend server (NestJS, listens on 3010 by default)
```

#### Notes

- If Node is outside the supported range, switch via `nvm`, `fnm`, or similar.
- If ports are taken, change `OPEN_AGENT_SERVER_PORT` or Rspack devServer port in `packages/frontend/app/rspack.config.js`.
- The web dev server proxies `/api` and `/graphql` to `http://localhost:3010` by default.
- When login, you may be prompted to verify your email. The code will be sent to the local mailhog server at `http://localhost:8025`.

---

## 🤝 Contributing

We welcome all contributions, ideas, and improvements!  
Open issues or pull requests — no bureaucracy, just collaboration.

Before submitting a PR, run code checks:

```bash
pre-commit run --all-files
```

---

## 🌐 Community

Join our community to connect with other developers, share feedback, and showcase your projects.

> [Discord →](https://discord.gg/your-discord-invite)

<div align="center">
  <img src="assets/community_group.jpg" width="300" alt="Open-Agent Community Group"/>
</div>

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=AFK-surf/open-agent&type=Date)](https://star-history.com/#AFK-surf/open-agent&Date)

---

## 💙 Acknowledgements

Open-Agent builds upon the ideas of projects like  
[AFFiNE](<[https://github.com/browserbase/stagehand](https://github.com/toeverything/AFFiNE)>),  
and the broader open-source agentic AI community.

Special thanks to everyone advancing human–AI collaboration.

---

© 2025 Open-Agent Contributors.  
Licensed under [Apache 2.0](https://opensource.org/licenses/Apache-2.0).
