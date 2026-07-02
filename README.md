# qq-ai-bot

一个面向实际部署的 QQ AI 机器人项目。

`qq-ai-bot` 基于 **OneBot 11** 接入 QQ，基于 **ACP** 对接本地 agent（例如 `traecli`），并将结果、会话状态和处理中进度返回到 QQ。项目内包含群聊策略、分群 prompt、命令体系、会话复用、进度播报和会话持久化等能力，可作为 QQ + 本地 agent 场景的基础实现。

## 功能

- OneBot 11 forward / reverse WebSocket
- 兼容 NapCat / LLOneBot
- 私聊、群聊独立会话
- 群聊支持仅 `@机器人` 触发
- 白名单 / 黑名单控制
- 每个群独立 `systemPrompt`
- `/help` `/status` `/prompt` `/reset` `/ping`
- ACP 会话复用与持久化
- 处理中进度回传到 QQ
- 入站图片下载后转给 agent
- macOS 下提供 NapCat 接入辅助脚本

## 适合什么场景

- 想把 QQ 接到自己本机的 CLI agent
- 不想把消息链路绑死在某一家模型 SDK 上
- 想按群设置不同 prompt
- 需要能看到 agent 的处理中间状态
- 希望仓库拉下来后能直接开始改，而不是先补一堆基础设施

## 文档

- [快速开始](docs/getting-started.md)
- [配置说明](docs/configuration.md)
- [macOS 接入 NapCat](docs/macos-napcat.md)
- [Windows 接入说明（未验证）](docs/windows-untested.md)
- [架构说明](ARCHITECTURE.md)

## 快速开始

### 0. 先准备好这些东西

在仓库根目录执行下面步骤：

- 安装 **Node.js 22+**
- 安装一个 **OneBot 11** 实现（推荐 [NapCatQQ](https://github.com/NapNeko/NapCatQQ) 或 [LLOneBot](https://github.com/LLOneBot/LuckyLilliaBot)）
- 安装一个支持 **ACP** 的本地 agent。下面示例默认使用 `traecli`

如果你准备用 `traecli`，先确认命令可用：

```bash
traecli --help
```

如果这一步都过不了，不要继续配 bot，先把本地 agent 装好。

### 1. 拉代码并进入仓库目录

```bash
git clone https://github.com/happysnaker/qq-ai-bot.git
cd qq-ai-bot
```

### 2. 安装项目依赖

```bash
npm install
```

这一步会安装当前项目自己的 Node.js 依赖，也就是 `package.json` 里声明的运行库和开发工具，例如：

- `@agentclientprotocol/sdk`
- `ws`
- `zod`
- `tsx`
- `typescript`
- `vitest`

### 3. 生成本地配置文件

项目根目录下已经带了示例配置文件：

- `.env.example`
- `examples/group-rules.example.json`

复制一份给你自己用：

```bash
cp .env.example .env
cp examples/group-rules.example.json examples/group-rules.local.json
```

也就是说，你真正要改的是：

- 根目录下的 `.env`
- 根目录下的 `examples/group-rules.local.json`

### 4. 先改 `.env`

最小可用示例：

```env
BOT_PORT=18080

ONEBOT_MODE=reverse
ONEBOT_ACCESS_TOKEN=test-token
ONEBOT_REVERSE_WS_HOST=0.0.0.0
ONEBOT_REVERSE_WS_PORT=16700
ONEBOT_REVERSE_WS_PATH=/onebot/v11/ws
ONEBOT_ALLOW_GROUP=true
ONEBOT_REQUIRE_MENTION_IN_GROUP=true
ONEBOT_ALLOW_PRIVATE=true
ONEBOT_ALLOW_GROUP_COMMANDS_WITHOUT_MENTION=false
ONEBOT_GROUP_CONFIG_FILE=./examples/group-rules.local.json
ONEBOT_PROGRESS_MODE=message

ACP_AGENT_COMMAND=traecli
ACP_AGENT_ARGS_JSON=["acp","serve"]
ACP_AGENT_WORKDIR=/path/to/your/workdir
ACP_REUSE_SESSION=true
ACP_VERBOSE_MODE=verbose
ACP_PERMISSION_STRATEGY=allow_once
```

至少要注意这几项：

- `ACP_AGENT_COMMAND=traecli`：表示 bot 会直接启动本机 `traecli`
- `ACP_AGENT_ARGS_JSON=["acp","serve"]`：表示 bot 会以 `traecli acp serve` 的方式起 agent
- `ACP_AGENT_WORKDIR=/path/to/your/workdir`：这里要改成你希望 agent 实际工作的目录
- `ONEBOT_ACCESS_TOKEN`：要和你的 OneBot 11 实现保持一致

### 5. 单独验证本地 agent

先别急着连 QQ，先确认 bot 能拉起本地 agent：

```bash
npm run smoke:traecli
```

看到输出里有 `TRAE_ACP_OK`，再继续下一步。

### 6. 启动 bot

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm run start
```

### 7. 配置 QQ / OneBot 11

把你的 OneBot 11 reverse WebSocket 指到：

```text
ws://127.0.0.1:16700/onebot/v11/ws
```

如果你配置了 access token，QQ 侧和 bot 侧要一致。

- macOS 直接接 QQ：看 [macOS 接入 NapCat](docs/macos-napcat.md)
- Windows：看 [Windows 接入说明（未验证）](docs/windows-untested.md)

### 8. 实测

建议按下面顺序测：

1. 私聊机器人发一句普通文本
2. 群聊里 `@机器人` 再发一句文本
3. 发送 `/status`
4. 发送 `/prompt`
5. 发送 `/reset`

## 命令

默认命令前缀是 `/`。

- `/help`：帮助
- `/status`：当前会话状态、触发策略、当前 prompt 来源
- `/prompt`：当前会话生效的 system prompt
- `/reset`：清空当前会话
- `/ping`：存活检查

## 外部项目 / 协议

- [NapCatQQ](https://github.com/NapNeko/NapCatQQ)
- [LLOneBot](https://github.com/LLOneBot/LuckyLilliaBot)
- [OneBot 11](https://11.onebot.dev)

## 平台说明

- **macOS**：仓库内置了 NapCat 辅助脚本，开箱更省事。
- **Windows**：给了可落地的接入步骤，但当前标记为 **未验证**。
- **Linux**：bot 侧本身没有特殊限制，QQ / OneBot 11 侧按你自己的部署方式处理即可。

## 支持项目

如果这个仓库帮你省了时间，欢迎：

- 点个 Star
- 提 Issue / PR
- [支持项目](https://happysnaker.github.io/support/)
