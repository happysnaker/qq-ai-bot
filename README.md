# qq-ai-bot

把 QQ 接到本地 agent，上线前该有的那几样东西，这个仓库先帮你铺好了。

`qq-ai-bot` 通过 **OneBot 11** 收发 QQ 消息，再通过 **ACP** 把消息转给本地 agent（比如 `traecli`），最后把结果、会话状态和处理中进度回到 QQ。仓库里已经带上了群聊策略、分群 prompt、命令体系、会话复用和进度播报，定位就是能直接改、能继续往生产走的工程底座，不是一次性 demo。

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

## 5 分钟跑起来

### 1. 安装依赖

```bash
npm install
```

### 2. 准备配置文件

```bash
cp .env.example .env
cp examples/group-rules.example.json examples/group-rules.local.json
```

### 3. 填最小配置

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

### 4. 验证本地 agent 能不能通

```bash
npm run smoke:traecli
```

输出里看到 `TRAE_ACP_OK`，说明 bot 到本地 agent 的 ACP 链路已经通了。

### 5. 启动 bot

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm run start
```

### 6. 接上 QQ / OneBot 11

把你的 OneBot 11 实现指到：

```text
ws://127.0.0.1:16700/onebot/v11/ws
```

如果你在 macOS 上直接接 QQ，可以看这份文档：[macOS 接入 NapCat](docs/macos-napcat.md)。

Windows 方案也整理了一份，但我这边没做实机验证：[Windows 接入说明（未验证）](docs/windows-untested.md)。

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
