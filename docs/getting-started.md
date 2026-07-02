# 快速开始

这份文档只讲一件事：把 bot 跑起来，并确认 QQ → bot → 本地 agent 这条链路是通的。

## 前置条件

开始之前，先确认你已经准备好下面几样东西：

- **Node.js 22+**
- 一个 **OneBot 11** 实现（推荐 [NapCatQQ](https://github.com/NapNeko/NapCatQQ) 或 [LLOneBot](https://github.com/LLOneBot/LuckyLilliaBot)）
- 一个支持 **ACP** 的本地 agent

本文默认你使用 `traecli` 作为本地 agent。

## 0. 先确认 `traecli` 已安装

先在终端里确认命令存在：

```bash
traecli --help
```

如果命令不存在，或者执行报错，先把 `traecli` 安装好，再继续下面步骤。

## 1. 拉代码并进入项目目录

```bash
git clone https://github.com/happysnaker/qq-ai-bot.git
cd qq-ai-bot
```

后面提到的“项目根目录”，指的就是你执行完 `cd qq-ai-bot` 之后所在的位置。

## 2. 安装项目依赖

```bash
npm install
```

这一步安装的是当前仓库自己的 Node.js 依赖，不会帮你安装 `traecli`、QQ 或 NapCat。

安装内容来自项目根目录下的 `package.json`，主要包括：

- 运行依赖：`@agentclientprotocol/sdk`、`ws`、`zod`、`pino`
- 开发依赖：`tsx`、`typescript`、`eslint`、`vitest`

## 3. 准备配置文件

项目根目录下已经有示例配置：

- `.env.example`
- `examples/group-rules.example.json`

复制成本地配置：

```bash
cp .env.example .env
cp examples/group-rules.example.json examples/group-rules.local.json
```

你后面真正要修改的是：

- 项目根目录下的 `.env`
- 项目根目录下的 `examples/group-rules.local.json`

如果你不需要分群配置，可以把 `.env` 里的 `ONEBOT_GROUP_CONFIG_FILE` 留空。

## 4. 先改 `.env`

最小示例：

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

几个关键项：

- `ACP_AGENT_COMMAND=traecli`：bot 会直接执行这个命令
- `ACP_AGENT_ARGS_JSON=["acp","serve"]`：等价于执行 `traecli acp serve`
- `ACP_AGENT_WORKDIR=/path/to/your/workdir`：改成你的真实工作目录
- `ONEBOT_ACCESS_TOKEN=test-token`：和你的 OneBot 11 配置保持一致

## 5. 单独验证本地 agent

先验证 bot 能不能正常拉起本地 agent：

```bash
npm run smoke:traecli
```

如果输出中出现 `TRAE_ACP_OK`，说明 bot → `traecli` 这段已经通了。

如果这里都没过，先不要继续接 QQ，先把 agent 这段问题解决掉。

## 6. 启动 bot

开发模式：

```bash
npm run dev
```

如果你要跑构建产物：

```bash
npm run start
```

## 7. 配置 OneBot 11

推荐先使用 reverse WebSocket。

把 OneBot 11 的 reverse WebSocket 指到：

```text
ws://127.0.0.1:16700/onebot/v11/ws
```

如果你设置了 access token，QQ 侧和 bot 侧要一致。

## 8. 实测

建议按下面顺序测：

1. 私聊机器人发一句普通文本
2. 群聊里 `@机器人` 再发一句文本
3. 发送 `/status`
4. 发送 `/prompt`
5. 发送 `/reset`

## 健康检查

```bash
curl http://127.0.0.1:18080/healthz
curl http://127.0.0.1:18080/readyz
```

`/readyz` 更适合排查问题，能看到当前是否接上 QQ、配置了多少群策略之类的信息。

## 常用命令

```bash
npm run dev
npm run start
npm run lint
npm run typecheck
npm run test
npm run smoke:traecli
npm run e2e:fake-onebot:traecli
```
