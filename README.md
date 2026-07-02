# qq-ai-bot

生产级、开源化的 **QQ ↔ AI Bot** 项目骨架：

- **QQ 侧**：基于 **OneBot 11** 协议，兼容 **NapCat / LLOneBot** 一类实现
- **AI 侧**：通过 **ACP（Agent Client Protocol）** 与本地 AI agent 交互
- **部署形态**：Node.js 22+ / TypeScript / Docker / GitHub Actions
- **会话能力**：按 QQ 会话维持独立 ACP session，可持久化恢复
- **进度回传**：把 ACP 的 `plan` / `tool_call` / `tool_call_update` 增量事件转成 QQ 进度消息

## 为什么这样设计

这个项目有两个边界：

1. **QQ Transport 层**：只负责跟 OneBot 11 通信
2. **AI Agent Bridge 层**：只负责跟 ACP agent 通信

这样做的好处：

- 不把项目绑死到某个特定 QQ 实现
- 不把项目绑死到某个特定大模型供应商
- 后续可以平滑接入更多 channel（微信、Telegram、飞书等）

## 当前能力

### 已实现

- [x] OneBot 11 **forward / reverse WebSocket**
- [x] 私聊 / 群聊消息接收
- [x] 群聊 `@bot` 触发
- [x] 入站图片下载并传给 ACP agent
- [x] ACP 子进程启动、初始化、`session/new`、`session/load`、`session/prompt`
- [x] ACP 增量事件驱动的 QQ 进度播报
- [x] 会话持久化与 TTL 清理
- [x] `/help` `/status` `/reset` 管理命令
- [x] `/healthz` `/readyz` 管理接口
- [x] Mock ACP agent，便于本地联调
- [x] ESLint / TypeScript / Vitest / GitHub Actions

### 当前约束

- 默认用 **进度消息** 模式回传进度，不做 QQ 卡片 patch
- 先聚焦文本 / 图片消息主链路
- 尚未实现 richer media（文件、语音、视频）和审核/风控工作流

## 快速开始

### 1) 安装依赖

```bash
npm install
```

### 2) 复制环境变量

```bash
cp .env.example .env
```

### 3) 先用 mock agent 联调

把 `.env` 里的 AI 配置改成：

```env
ACP_AGENT_COMMAND=npx
ACP_AGENT_ARGS_JSON=["tsx","src/examples/mock-acp-agent.ts"]
ACP_AGENT_WORKDIR=/Users/bytedance/GolandProjects/DevPlan/qq-ai-bot
ACP_REUSE_SESSION=true
ACP_VERBOSE_MODE=verbose
```

### 4) 配置 QQ 侧 OneBot

#### 反向 WebSocket（推荐本项目默认）

```env
ONEBOT_MODE=reverse
ONEBOT_ACCESS_TOKEN=change-me
ONEBOT_REVERSE_WS_HOST=0.0.0.0
ONEBOT_REVERSE_WS_PORT=6700
ONEBOT_REVERSE_WS_PATH=/onebot/v11/ws
```

然后在 NapCat / LLOneBot 中配置反向 WS：

- URL: `ws://<your-host>:6700/onebot/v11/ws`
- Header: `Authorization: Bearer <ONEBOT_ACCESS_TOKEN>`

#### 正向 WebSocket

```env
ONEBOT_MODE=forward
ONEBOT_FORWARD_WS_URL=ws://127.0.0.1:3001/onebot/v11/ws
ONEBOT_ACCESS_TOKEN=change-me
```

### 5) 启动机器人

```bash
npm run dev
```

### 6) 验证

- 私聊机器人发送普通文本
- 群聊中 `@bot` 后发送文本
- 发送一张图片给机器人
- 发送 `/status`
- 发送 `/reset`
- 打开本地健康检查：

```bash
curl http://127.0.0.1:8080/healthz
curl http://127.0.0.1:8080/readyz
```

## 使用真实 ACP agent

如果你想用真实 ACP agent，例如 Codex / Claude Code ACP wrapper，改这几个变量：

```env
ACP_AGENT_COMMAND=codex
ACP_AGENT_ARGS_JSON=[]
ACP_AGENT_WORKDIR=/Users/bytedance/GolandProjects/DevPlan
```

只要这个命令启动后遵循 ACP over stdio（NDJSON）即可。

## 常用命令

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run mock-agent
```

## 管理命令

- `/help`：查看帮助
- `/status`：查看当前会话状态
- `/reset`：重置当前会话

## 项目结构

```text
src/
  agents/acp/          ACP bridge
  channels/onebot/     QQ / OneBot transport
  config/              配置加载
  core/                应用主流程、会话管理、进度播报
  examples/            mock ACP agent
  infra/               logger
  types/               类型定义
  utils/               环境变量辅助
```

## 后续建议

如果你要把它继续做成更完整的生产项目，建议下一步补：

1. Redis / Postgres 会话存储
2. 群权限、白名单、黑名单与审计日志
3. 限流与重试策略
4. 更细的消息去重
5. 更强的图片 / 文件 / 语音处理
6. Prometheus metrics 与 tracing
7. Docker Compose 示例（NapCat + bot）

