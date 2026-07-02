# Architecture

## 总体结构

```text
QQ / NapCat / LLOneBot
        │
        ▼
 OneBot 11 Transport
        │
        ▼
 BotApplication
        │
        ├── ConversationManager
        ├── SessionStore
        ├── ProgressReporter
        └── ImageDownloader
        │
        ▼
   ACPAgentBridge
        │
        ▼
 Local ACP-compatible Agent
 (e.g. repo mock agent, traecli, or any ACP-compatible agent)
```

## 设计目标

这个项目追求的是：

1. **QQ 通道与 AI agent 解耦**
2. **群聊 / 私聊 / 会话 / system prompt 都配置化**
3. **本地优先，真实可用，而不是只跑 mock**
4. **能向生产演进**

## 核心模块

### 1. OneBot Transport

职责：

- 接收私聊 / 群聊消息
- 发送文本 / 图片 / reply 消息
- 支持 forward / reverse WebSocket

### 2. BotApplication

职责：

- 统一处理消息入口
- 做白名单 / 黑名单 / 群聊私聊策略判断
- 解析 `/` 命令
- 决定当前会话使用哪个 system prompt
- 调用 ACP bridge 获取最终答复

### 3. ConversationManager

职责：

- 以 QQ 会话为粒度维护运行时 bridge
- 管理会话重置
- 持久化远端 ACP sessionId
- 定期清理过期会话

当前通过统一的 `SessionStore` 抽象对接持久化层，默认实现是 `FileSessionStore`，也支持 `RedisSessionStore`。

会话键规则：

- 私聊：`direct:<userId>`
- 群聊：`group:<groupId>`

### 4. ACPAgentBridge

职责：

- 启动本地 ACP 子进程
- 建立 ACP connection
- 创建 / 恢复 session
- 发送 prompt
- 接收增量更新：`plan` / `tool_call` / `tool_call_update` / `agent_message_chunk`

已做的稳态增强：

- 同一会话 prompt 串行化，避免并发竞态
- `ACP connection closed` 时自动清理连接状态

### 5. Prompt Builder

发送给 agent 的 prompt 不只是裸用户文本，还会拼装：

- system prompt
- 会话上下文（群聊/私聊、会话 ID、发送者 ID、群名等）
- 用户消息
- 图片说明或图片数据

## 触发策略

### 私聊

- 由 `ONEBOT_ALLOW_PRIVATE` 控制是否启用
- 可结合 `ONEBOT_ALLOWED_USERS` / `ONEBOT_BLOCKED_USERS` 控制范围

### 群聊

- 由 `ONEBOT_ALLOW_GROUP` 控制是否启用
- 默认仅在 `@机器人` 时答复
- 可通过 `ONEBOT_ALLOW_GROUP_COMMANDS_WITHOUT_MENTION` 允许群里直接执行命令
- 可结合 `ONEBOT_ALLOWED_GROUPS` / `ONEBOT_BLOCKED_GROUPS` 控制范围
- 可在群级配置中覆盖 `requireMention`

## 分群配置

通过 `ONEBOT_GROUP_CONFIG_FILE` 加载 JSON：

- 全局默认 system prompt
- 每个群的启用状态
- 每个群是否必须 @
- 每个群独立 system prompt

优先级：

```text
group.systemPrompt > defaultSystemPrompt > 无
```

## 命令体系

命令前缀默认是 `/`，可通过 `ONEBOT_COMMAND_PREFIX` 修改。

当前实现：

- `/help`
- `/status`
- `/prompt`
- `/reset`
- `/ping`

## 容错策略

- ACP `loadSession` 失败回退为 `newSession`
- 图片下载失败不阻塞主流程
- 进度播报失败不影响最终答复
- ACP 会话关闭失败不阻塞 shutdown
- ACP 连接意外中断时自动清理 bridge，提示用户重试

## 可继续扩展

- Postgres 会话存储
- 更强的消息去重与幂等
- 审计日志
- 限流 / 配额
- 管理后台
- 多实例部署
