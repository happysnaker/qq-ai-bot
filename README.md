# qq-ai-bot

一个面向实际部署的 QQ AI 机器人项目。

`qq-ai-bot` 基于 **OneBot 11** 接入 QQ，基于 **ACP** 对接本地 agent，并将结果、会话状态和处理中进度返回到 QQ。只要你的 agent 能以 ACP 方式接入，就可以挂到这个机器人后面；文档里的 `traecli` 只是默认示例，不是唯一选择。

## 核心能力

- OneBot 11 forward / reverse WebSocket
- 兼容 NapCat / LLOneBot
- 私聊、群聊独立会话
- 群聊支持仅 `@机器人` 触发
- 每个群独立 `systemPrompt`
- `/help` `/status` `/prompt` `/reset` `/ping`
- ACP 会话复用与持久化
- 处理中进度回传到 QQ
- 入站图片下载后转给 agent
- macOS 下提供 NapCat 接入辅助脚本

## 快速开始

### 1. 准备环境

- Node.js 22+
- 一个 OneBot 11 实现（推荐 [NapCatQQ](https://github.com/NapNeko/NapCatQQ) 或 [LLOneBot](https://github.com/LLOneBot/LuckyLilliaBot)）
- 一个支持 ACP 的本地 agent

如果你使用 `traecli`，先确认命令存在：

```bash
traecli --help
```

### 2. 拉代码并准备配置

```bash
git clone https://github.com/happysnaker/qq-ai-bot.git
cd qq-ai-bot
npm install
cp .env.example .env
cp examples/group-rules.example.json examples/group-rules.local.json
```

你真正要修改的是：

- 项目根目录下的 `.env`
- 项目根目录下的 `examples/group-rules.local.json`

最小配置示例：

```env
ONEBOT_MODE=reverse
ONEBOT_ACCESS_TOKEN=test-token
ONEBOT_REVERSE_WS_PORT=16700
ONEBOT_GROUP_CONFIG_FILE=./examples/group-rules.local.json

ACP_AGENT_COMMAND=traecli
ACP_AGENT_ARGS_JSON=["acp","serve"]
ACP_AGENT_WORKDIR=/path/to/your/workdir
```

### 3. 先测 agent，再接 QQ

先确认 bot 能拉起本地 agent：

```bash
npm run smoke:traecli
```

看到 `TRAE_ACP_OK` 后，再启动 bot：

```bash
npm run dev
```

然后把你的 OneBot 11 reverse WebSocket 指到：

```text
ws://127.0.0.1:16700/onebot/v11/ws
```

## 文档

- [快速开始](docs/getting-started.md)
- [配置说明](docs/configuration.md)
- [macOS 接入 NapCat](docs/macos-napcat.md)
- [Windows 接入说明（未验证）](docs/windows-untested.md)
- [架构说明](ARCHITECTURE.md)

## 命令

- `/help`
- `/status`
- `/prompt`
- `/reset`
- `/ping`

## 外部项目 / 协议

- [NapCatQQ](https://github.com/NapNeko/NapCatQQ)
- [LLOneBot](https://github.com/LLOneBot/LuckyLilliaBot)
- [OneBot 11](https://11.onebot.dev)

## 平台说明

- **macOS**：仓库内置了 NapCat 辅助脚本。
- **Windows**：提供接入说明，但当前标记为 **未验证**。
- **Linux**：bot 侧本身没有特殊限制。

## 支持项目

- Star / Issue / PR
- [支持项目](https://happysnaker.github.io/support/)
