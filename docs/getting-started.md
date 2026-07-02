# 快速开始

这份文档只讲一件事：把 bot 跑起来，并确认 QQ → bot → 本地 agent 这条链路是通的。

## 运行要求

- Node.js 22+
- 一个 OneBot 11 实现（推荐 NapCat 或 LLOneBot）
- 一个支持 ACP 的本地 agent（比如 `traecli`）

## 1. 安装依赖

```bash
npm install
```

## 2. 准备本地配置

```bash
cp .env.example .env
cp examples/group-rules.example.json examples/group-rules.local.json
```

如果你不需要分群配置，可以把 `.env` 里的 `ONEBOT_GROUP_CONFIG_FILE` 留空。

## 3. 配置 `.env`

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

## 4. 验证本地 agent

```bash
npm run smoke:traecli
```

看到 `TRAE_ACP_OK` 再继续。这个步骤过不了，后面接 QQ 也没意义。

## 5. 启动 bot

```bash
npm run dev
```

如果你跑的是构建产物：

```bash
npm run start
```

## 6. 配置 OneBot 11

把 OneBot 11 的 reverse WebSocket 指到：

```text
ws://127.0.0.1:16700/onebot/v11/ws
```

如果设置了 access token，QQ 侧和 bot 侧要一致。

## 7. 实测

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
