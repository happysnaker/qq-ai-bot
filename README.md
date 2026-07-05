# qq-ai-bot

[![CI](https://github.com/happysnaker/qq-ai-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/happysnaker/qq-ai-bot/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/happysnaker/qq-ai-bot)](https://github.com/happysnaker/qq-ai-bot/releases)
[![Stars](https://img.shields.io/github/stars/happysnaker/qq-ai-bot?style=social)](https://github.com/happysnaker/qq-ai-bot/stargazers)
[![OneBot 11](https://img.shields.io/badge/OneBot-11-black)](https://onebot.dev/ecosystem)

`qq-ai-bot` 是一个面向 **OneBot 11** 和 **ACP-compatible agents** 的 **QQ ↔ AI bridge**。  
它负责 QQ / OneBot 接线、ACP 会话管理、进度回传、群聊策略和运行时状态暴露，不把 bot 本体写死在某一个模型 SDK 上。

## 核心能力

- 兼容 **NapCat / LLOneBot / 其他 OneBot 11 实现**
- 支持 **reverse / forward WebSocket**
- ACP 会话复用与持久化
- 私聊、群聊、分群 prompt、命令体系
- 处理中进度回传
- 图片入站与本机图片回发
- `/help` `/status` `/prompt` `/reset` `/ping`
- `/verbose` `/progress` `/quiet`
- `/healthz` `/readyz` `/status` `/metrics`
- file / Redis 两种 session store

## 先选路径

### 推荐：标准快速开始（宿主机模式）

这是仓库当前最推荐的接入路径，适合：

- 你要接自己的 `traex` / 自定义 ACP agent
- 你要排查真实的 QQ → OneBot → bot → ACP 链路
- 你不想被 Docker 演示栈的 mock agent 混淆

入口：[`docs/getting-started.md`](docs/getting-started.md)

### 可选：Docker 演示栈

这是一个**演示路径**，不是标准快速开始：

- 它默认使用仓库内置 **mock ACP agent**
- 它**不会**替你接上宿主机里已经装好的 `traex` / 自定义 agent
- 它适合做 isolated demo，不适合拿来代表你的真实生产接法

入口：[`docs/docker-quickstart.md`](docs/docker-quickstart.md)

### 可选：macOS 本机 QQ / NapCat 运维辅助

这是一个**运维辅助路径**，不是标准快速开始：

- 只面向 **macOS + 本机 QQ + NapCat**
- 主要负责 patch QQ、写 NapCat 配置、辅助登录和本机拉起
- 不替代标准 quickstart，也不替代 NapCat 官方安装说明

入口：[`docs/macos-napcat.md`](docs/macos-napcat.md)

## 推荐快速开始（宿主机模式）

### 1. 准备环境

- Node.js 22+
- 一个 OneBot 11 实现
- 一个 ACP-compatible agent  
  （如果你只是先验证链路，`.env.example` 已默认给了仓库内置 mock agent 配置）

### 2. 拉代码并准备本地配置

```bash
git clone https://github.com/happysnaker/qq-ai-bot.git
cd qq-ai-bot
npm install
cp .env.example .env
cp examples/group-rules.example.json examples/group-rules.local.json
```

### 3. 先验证 ACP agent

```bash
npm run smoke:agent
```

如果你使用 `traex`，先确保本机已经能直接执行：

```bash
traex acp serve
```

然后再把 `.env` 中的 `ACP_AGENT_*` 切到 `traex` 配置。详细示例见 [`docs/agent-integration.md`](docs/agent-integration.md)。

### 4. 启动 bot

```bash
npm run dev
```

检查 bot 是否已经起来：

```bash
curl http://127.0.0.1:8080/status
```

如果你看到 `ok: true` 但 `onebot.connected: false`，说明 **bot 已启动，但 QQ / OneBot 还没接上**。

### 5. 配置 OneBot reverse WebSocket

把 OneBot 11 的 reverse WebSocket 指到：

```text
ws://127.0.0.1:16700/onebot/v11/ws
```

token 使用 `.env` 里的 `ONEBOT_ACCESS_TOKEN`。示例默认值是：

```text
change-me
```

### 6. 在 QQ 中验证

建议顺序：

1. 私聊机器人发普通文本
2. 发送 `/ping`
3. 发送 `/status`
4. 群聊 `@机器人` 再发普通文本

## macOS 本机 QQ / NapCat 运维辅助

如果你本机就是 **macOS + QQ + NapCat**，常用命令是：

```bash
npm run status:napcat:macos
npm run setup:napcat:macos -- --token change-me --ws-url ws://127.0.0.1:16700/onebot/v11/ws
npm run launch:napcat:macos -- --restart
npm run bot:macos -- login
```

注意：

- `status:napcat:macos` / `setup:napcat:macos` 会读取项目根目录的 `.env` / `.env.local`
- `bot:macos` 是**运维辅助脚本**，它拉的是 `dist/index.js`，先执行 `npm run build`
- 如果你走的是标准源码模式，仍然优先用 `npm run dev`

完整说明见 [`docs/macos-napcat.md`](docs/macos-napcat.md)。

## 常用命令

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run smoke:agent
npm run smoke:traex
npm run e2e:fake-onebot:traex
```

兼容旧文档的 `smoke:traecli` / `e2e:fake-onebot:traecli` 仍然保留。

## 文档

- [快速开始](docs/getting-started.md)
- [ACP Agent 接入](docs/agent-integration.md)
- [配置说明](docs/configuration.md)
- [FAQ / 常见问题](docs/faq.md)
- [Docker 演示栈（仅演示）](docs/docker-quickstart.md)
- [macOS NapCat 运维辅助](docs/macos-napcat.md)
- [Windows 接入说明（未验证）](docs/windows-untested.md)
- [Deployment matrix / 部署组合矩阵](docs/deployment-matrix.md)
- [Deployment patterns / 部署形态](docs/deployment-patterns.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)

## 当前边界

- Docker 文档定位为**演示栈**，不是标准生产接法
- macOS helper 定位为**运维辅助**，不是主 onboarding 路径
- Windows 文档仍然标记为**未验证**

## 开发与贡献

```bash
npm run lint
npm run typecheck
npm run test
```

- 贡献说明：[`CONTRIBUTING.md`](CONTRIBUTING.md)
- 安全反馈：[`SECURITY.md`](SECURITY.md)
- 路线图：[`ROADMAP.md`](ROADMAP.md)
- 支持项目：[`SUPPORT.md`](SUPPORT.md)
