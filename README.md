# qq-ai-bot

一个面向生产实践的开源 **QQ ↔ AI Agent** 机器人框架。

- **QQ 通道**：基于 **OneBot 11**，兼容 **NapCat / LLOneBot**
- **AI 通道**：通过 **ACP（Agent Client Protocol）** 对接本地 agent，如 `traecli`
- **运行形态**：Node.js 22+ / TypeScript / Docker 友好
- **会话能力**：按私聊/群聊维持独立会话，可持久化恢复
- **生产特性**：群聊仅 @ 触发、命令体系、分群 system prompt、进度回传、配置化控制

如果这个项目对你有帮助，欢迎：

- 点一个 **Star**
- 提一个 **Issue / PR**
- 通过 GitHub Sponsors、爱发电或你的常用方式支持后续维护（仓库公开时把赞助链接填到这里）

## 适合谁

如果你想要的是下面这种方案，这个仓库就是给你准备的：

- 想把 **QQ** 接到你本机的 **AI CLI / Agent**
- 不想被某一家模型平台 SDK 绑死
- 希望群聊、私聊、会话、system prompt、命令体系都能配置
- 希望仓库拿来就能改，而不是只有 demo

## 当前能力

### 已实现

- [x] OneBot 11 forward / reverse WebSocket
- [x] 私聊消息处理
- [x] 群聊消息处理
- [x] 群聊仅在 `@机器人` 时答复
- [x] 支持配置是否开启群聊、是否开启私聊
- [x] 支持白名单 / 黑名单用户、群聊
- [x] 支持每个群聊独立配置 `system prompt`
- [x] 支持全局默认 `system prompt`
- [x] 支持 `/help` `/status` `/prompt` `/reset` `/ping`
- [x] ACP 子进程启动、初始化、session 复用
- [x] ACP 进度回传到 QQ
- [x] 入站图片下载并转给 agent
- [x] 会话持久化与 TTL 清理
- [x] macOS 下 NapCat 接入辅助脚本

### 已实机跑通

截至 **2026-07-02**，以下链路已实际验证：

1. **真实 `traecli acp serve`**
2. **真实 QQ + NapCat + OneBot reverse WS + 本仓库 bot + 本机 `traecli`**

也就是说，这个仓库不是只会跑 mock 的骨架，而是已经能真实连上本机 QQ 与本机 AI CLI。

---

## Quick Start

### 1. 安装依赖

```bash
npm install
```

### 2. 复制配置

```bash
cp .env.example .env
cp examples/group-rules.example.json examples/group-rules.local.json
```

### 3. 配置 `.env`

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
ONEBOT_COMMAND_PREFIX=/
ONEBOT_GROUP_CONFIG_FILE=./examples/group-rules.local.json

ACP_AGENT_COMMAND=traecli
ACP_AGENT_ARGS_JSON=["acp","serve"]
ACP_AGENT_WORKDIR=/Users/bytedance/GolandProjects/DevPlan
ACP_REUSE_SESSION=true
ACP_VERBOSE_MODE=verbose
ACP_PERMISSION_STRATEGY=allow_once
```

### 4. 验证本机 agent

```bash
npm run smoke:traecli
```

如果输出里出现 `TRAE_ACP_OK`，说明 bot 到本机 `traecli` 的 ACP 链路已经通了。

### 5. 配置 QQ / NapCat

如果你在 macOS 上直接接入 QQ，可以用仓库自带脚本：

```bash
npm run status:napcat:macos
npm run setup:napcat:macos
npm run launch:napcat:macos
```

默认会把 NapCat 的 reverse WS 指到：

```text
ws://127.0.0.1:16700/onebot/v11/ws
```

### 6. 启动 bot

开发模式：

```bash
npm run dev
```

生产运行：

```bash
npm run start
```

### 7. 快速验证

- 私聊机器人发一句普通文本
- 群聊里 `@机器人` 再发一句文本
- 发送 `/status`
- 发送 `/prompt`
- 发送 `/reset`

健康检查：

```bash
curl http://127.0.0.1:18080/healthz
curl http://127.0.0.1:18080/readyz
```

---

## 配置说明

### QQ / OneBot 侧

| 配置项 | 说明 |
|---|---|
| `ONEBOT_ALLOW_GROUP` | 是否允许响应群聊 |
| `ONEBOT_REQUIRE_MENTION_IN_GROUP` | 群聊是否必须 @ 机器人才答复 |
| `ONEBOT_ALLOW_PRIVATE` | 是否允许响应私聊 |
| `ONEBOT_ALLOW_GROUP_COMMANDS_WITHOUT_MENTION` | 群聊命令是否允许不 @ 直接执行 |
| `ONEBOT_ALLOWED_GROUPS` | 允许的群 ID，逗号分隔 |
| `ONEBOT_BLOCKED_GROUPS` | 禁止的群 ID，逗号分隔 |
| `ONEBOT_ALLOWED_USERS` | 允许的用户 ID，逗号分隔 |
| `ONEBOT_BLOCKED_USERS` | 禁止的用户 ID，逗号分隔 |
| `ONEBOT_COMMAND_PREFIX` | 命令前缀，默认 `/` |
| `ONEBOT_GROUP_CONFIG_FILE` | 分群配置文件路径 |

### AI / ACP 侧

| 配置项 | 说明 |
|---|---|
| `ACP_AGENT_COMMAND` | agent 可执行文件，例如 `traecli` |
| `ACP_AGENT_ARGS_JSON` | 参数数组，例如 `["acp","serve"]` |
| `ACP_AGENT_WORKDIR` | agent 工作目录 |
| `ACP_REUSE_SESSION` | 是否复用远端 session |
| `ACP_DEFAULT_SYSTEM_PROMPT` | 全局默认 system prompt |
| `ACP_VERBOSE_MODE` | `normal` / `verbose` / `debug` |
| `ACP_PERMISSION_STRATEGY` | `allow_once` / `allow_always` / `cancel` |

---

## 分群 system prompt

把 `ONEBOT_GROUP_CONFIG_FILE` 指向一个 JSON 文件，例如：

```json
{
  "defaultSystemPrompt": "你是一个稳定、可靠、实事求是的 QQ AI 助手。",
  "groups": {
    "123456789": {
      "name": "产品讨论群",
      "enabled": true,
      "requireMention": true,
      "systemPrompt": "你正在服务产品讨论群。回答时优先给出需求澄清、方案取舍、风险提醒和下一步建议。"
    },
    "987654321": {
      "name": "静默通知群",
      "enabled": false
    }
  }
}
```

支持的字段：

- `defaultSystemPrompt`：全局默认 system prompt
- `groups.<groupId>.enabled`：是否启用该群
- `groups.<groupId>.requireMention`：该群是否必须 @ 才答复
- `groups.<groupId>.systemPrompt`：该群独立 system prompt
- `groups.<groupId>.name`：便于状态展示和文档维护

优先级：

```text
群专属 system prompt > 全局默认 system prompt > 无 system prompt
```

---

## 命令

默认命令前缀是 `/`。

| 命令 | 说明 |
|---|---|
| `/help` | 查看帮助 |
| `/status` | 查看当前会话状态、触发策略、当前 prompt 来源 |
| `/prompt` | 查看当前会话生效的 system prompt |
| `/reset` | 清空当前会话并重建 |
| `/ping` | 存活检查 |

---

## 真实接入 `traecli`

推荐配置：

```env
ACP_AGENT_COMMAND=traecli
ACP_AGENT_ARGS_JSON=["acp","serve"]
ACP_AGENT_WORKDIR=/Users/bytedance/GolandProjects/DevPlan
```

注意：

- `ACP_AGENT_ARGS_JSON` 最好写成合法 JSON 数组
- 本仓库现在也兼容这类宽松写法：`[acp,serve]`、`acp,serve`
- 但正式生产配置仍建议写标准 JSON

---

## macOS + NapCat 辅助脚本

```bash
npm run status:napcat:macos
npm run setup:napcat:macos
npm run launch:napcat:macos
npm run restore:qq:macos
```

这些脚本会帮助你：

- 下载 NapCat Shell
- patch QQ 注入 NapCat
- 写入 OneBot 11 配置
- 启动或恢复 QQ

---

## 常用命令

```bash
npm run dev
npm run start
npm run lint
npm run typecheck
npm run smoke:traecli
npm run e2e:fake-onebot:traecli
npm run status:napcat:macos
npm run setup:napcat:macos
npm run launch:napcat:macos
npm run restore:qq:macos
```

---

## 对外介绍建议

如果你要把仓库放到 GitHub 首页，可以直接用这段：

> A production-oriented open-source QQ AI bot that connects OneBot 11 (NapCat/LLOneBot) to local ACP-compatible agents such as traecli. It supports per-group prompts, command handling, progress updates, persistent sessions, and real local QQ integration.

---

## 后续可继续打磨

- Redis / Postgres session store
- 更细粒度的审计日志
- 速率限制与消息去重
- Prometheus metrics / tracing
- Docker Compose 一键启动示例
- 管理后台
- 多机器人实例与租户隔离
