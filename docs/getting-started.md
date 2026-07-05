# 快速开始

这份文档只讲一条主线：

**先把宿主机模式跑通，再去接 QQ。**

如果你是第一次用这个仓库，按这个顺序走最稳：

1. 准备 `.env`
2. 先验证 ACP agent
3. 启动 bot
4. 再接 OneBot / QQ

> `docs/docker-quickstart.md` 只是补充演示，默认接的是仓库内置 mock agent，不是标准快速开始，也不作为已验证生产路径。

## 前置条件

- Node.js 22+
- 一个 OneBot 11 实现（推荐 [NapCatQQ](https://github.com/NapNeko/NapCatQQ) 或 [LLOneBot](https://github.com/LLOneBot/LuckyLilliaBot)）
- 一个 ACP-compatible agent  
  如果你还没有现成 agent，直接先用仓库内置 mock agent

如果你要接 `traex`，先确保本机命令可用：

```bash
traex acp serve
```

如果这条命令本身跑不起来，先不要继续折腾 bot。

## 1. 拉代码并安装依赖

```bash
git clone https://github.com/happysnaker/qq-ai-bot.git
cd qq-ai-bot
npm install
```

## 2. 准备本地配置文件

```bash
cp .env.example .env
cp examples/group-rules.example.json examples/group-rules.local.json
```

项目启动时会自动读取：

- `.env`
- `.env.local`（如果存在，会覆盖 `.env` 同名项）

你真正要改的通常只有：

- `.env`
- `examples/group-rules.local.json`

## 3. 先决定你要接哪个 agent

### 方案 A：先用仓库内置 mock agent 跑通

`.env.example` 默认就是这套配置，复制后通常不用改：

```env
ACP_AGENT_COMMAND=node
ACP_AGENT_ARGS_JSON=["--import","tsx","src/examples/mock-acp-agent.ts"]
ACP_AGENT_WORKDIR=.
```

适合：

- 第一次验证链路
- 先确认 bot 没问题
- 先把 OneBot / QQ 接起来

### 方案 B：接 `traex`

把 `.env` 改成：

```env
ACP_AGENT_COMMAND=traex
ACP_AGENT_ARGS_JSON=["acp","serve"]
ACP_AGENT_WORKDIR=/path/to/your/workdir
```

说明：

- `ACP_AGENT_COMMAND`：启动命令
- `ACP_AGENT_ARGS_JSON`：参数数组
- `ACP_AGENT_WORKDIR`：agent 实际工作的目录

如果你把 `ACP_AGENT_ARGS_JSON` 留空，当前代码会对 `traex` / `traecli` 自动补成 `["acp","serve"]`，但**文档里仍然建议明确写出来**。

## 4. 准备 OneBot 侧配置

建议先走 reverse WebSocket。

仓库默认 quickstart 值是：

```env
BOT_PORT=8080
ONEBOT_ACCESS_TOKEN=change-me
ONEBOT_REVERSE_WS_PORT=16700
ONEBOT_REVERSE_WS_PATH=/onebot/v11/ws
ONEBOT_GROUP_CONFIG_FILE=./examples/group-rules.local.json
```

对应 OneBot reverse WebSocket 地址：

```text
ws://127.0.0.1:16700/onebot/v11/ws
```

如果你改了 token，OneBot 侧也必须同步改成一样的值。

## 5. 先单独验证 ACP agent

```bash
npm run smoke:agent
```

预期：输出里包含 `ACP_SMOKE_OK`

如果这里失败：

- 不要先怀疑 QQ
- 先检查 `ACP_AGENT_COMMAND`
- 再检查 `ACP_AGENT_ARGS_JSON`
- 再检查 `ACP_AGENT_WORKDIR`

### 典型失败：`ACP connection closed`

如果你接的是 `traex` / `traecli`，最常见原因是：

- 你把 `ACP_AGENT_ARGS_JSON` 设成了 `[]`
- 结果启动的是交互式 TUI，不是 `acp serve`

正确写法应该是：

```env
ACP_AGENT_ARGS_JSON=["acp","serve"]
```

## 6. 启动 bot

源码模式：

```bash
npm run dev
```

然后检查：

```bash
curl http://127.0.0.1:8080/status
```

正常情况下，你会先看到类似：

```json
{
  "ok": true,
  "onebot": {
    "connected": false
  }
}
```
 
这表示：

- bot 已经启动成功
- ACP 配置已经被读取
- 但 QQ / OneBot 还没接上

## 7. 再去接 QQ / OneBot

这一段是很多人第一次会卡住的地方。

你需要让 OneBot 11 主动回连到：

```text
ws://127.0.0.1:16700/onebot/v11/ws
```

并把 token 设成：

```text
change-me
```

或者改成你 `.env` 里自己的值。

### 如果你在 macOS 上使用本机 QQ + NapCat

更完整的可选辅助流程见 [`docs/macos-napcat.md`](macos-napcat.md)。  
这条路不是标准 quickstart 主流程，也暂时不把它当作已验证主运维方式写。

## 8. 确认 OneBot 已接上

再次执行：

```bash
curl http://127.0.0.1:8080/status
```

当 `onebot.connected` 变成 `true`，再去 QQ 里做实际测试。

## 9. 在 QQ 里验证

建议顺序：

1. 私聊机器人发一句普通文本
2. 发送 `/ping`
3. 发送 `/status`
4. 发送 `/prompt`
5. 群聊 `@机器人` 发一句普通文本
6. 如有需要，测试 `/quiet`、`/verbose normal`、`/progress off`

## 10. 健康检查

```bash
curl http://127.0.0.1:8080/healthz
curl http://127.0.0.1:8080/readyz
curl http://127.0.0.1:8080/metrics
```

`/status` 最适合看当前配置与 OneBot 连接状态。  
`/readyz` 更适合排查运行面。  
`/metrics` 暴露的是 Prometheus 风格文本指标。

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

旧别名 `smoke:traecli` / `e2e:fake-onebot:traecli` 仍然保留。

## 下一步

- 详细 agent 配置：[`docs/agent-integration.md`](agent-integration.md)
- 配置项说明：[`docs/configuration.md`](configuration.md)
- macOS 本机 QQ / NapCat：[`docs/macos-napcat.md`](macos-napcat.md)
- 常见问题：[`docs/faq.md`](faq.md)
