<p align="center">
  <img src="assets/logo.jpg" width="200"/>
</p>

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

## ⚙️ Installation & Configuration

Open-Agent is simple to install and configure — everything runs locally or on your preferred cloud.

### Using `uv` (Recommended)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
git clone https://github.com/AFK-surf/open-agent.git
cd open-agent
uv venv --python 3.12
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate  # Windows
uv pip install -r requirements.txt
```

### Configure your API keys

```bash
cp config/config.example.toml config/config.toml
```

Edit `config/config.toml`:

```toml
[llm]
model = "gpt-4o"
base_url = "https://api.openai.com/v1"
api_key = "sk-..."
temperature = 0.0

# Add additional providers as needed:
[llm.claude]
model = "claude-3-5-sonnet"
base_url = "https://api.anthropic.com"
api_key = "sk-ant-..."

[llm.gemini]
model = "gemini-1.5-pro"
base_url = "https://generativelanguage.googleapis.com"
api_key = "AIza..."

# Optional local / self-hosted
[llm.local]
provider = "ollama"     # or vLLM with OpenAI-compatible endpoint
base_url = "http://localhost:11434/v1"
model = "llama3.1"
```

---

## 🚀 Quick Start

Run Open-Agent:

```bash
python main.py
```

That’s it — start chatting with your multi-agent system!

To launch experimental flows or MCP integrations:

```bash
python run_flow.py
# or
python run_mcp.py
```

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
[AFFiNE]([https://github.com/browserbase/stagehand](https://github.com/toeverything/AFFiNE)),  
and the broader open-source agentic AI community.  

Special thanks to everyone advancing human–AI collaboration.

---

© 2025 Open-Agent Contributors.  
Licensed under [Apache 2.0](https://opensource.org/licenses/Apache-2.0).
