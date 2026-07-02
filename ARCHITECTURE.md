# Architecture

## 目标

构建一个生产级的 QQ AI Bot：

```text
QQ / NapCat / LLOneBot
        │
        ▼
 OneBot 11 Transport
        │
        ▼
 Conversation Orchestrator
        │
        ├── Session Store
        ├── Progress Reporter
        └── Image Downloader
        │
        ▼
   ACP Agent Bridge
        │
        ▼
  Local ACP-compatible Agent
```

## 核心设计

### 1. 通道与智能体解耦

QQ 侧只负责：

- 收消息
- 发消息
- 管理群聊触发逻辑
- 管理 reply / image segment

AI 侧只负责：

- 启动 ACP 子进程
- 建立 ACP connection
- 创建 / 恢复 session
- 收集 plan / tool_call / thought / text chunk
- 输出最终答复

### 2. 会话模型

按 QQ 会话维度维护 session：

- 私聊：`direct:<userId>`
- 群聊：`group:<groupId>`

每个 QQ 会话对应一个 ACP session。

### 3. 进度播报

参考 larklink：

- `plan` -> 进度摘要
- `tool_call` / `tool_call_update` -> 最近工具状态
- `agent_thought_chunk` -> debug 模式可展示
- `agent_message_chunk` -> 累积最终文本

当前 QQ 侧用“补发进度消息”的方式呈现，而不是飞书那种 patch 卡片。

### 4. 容错策略

- loadSession 失败时回退 newSession
- 图片下载失败不阻塞主链路
- 进度播报失败不影响最终答复
- ACP session close 失败只记日志，不阻塞 shutdown

### 5. 可扩展点

- Channel 扩展：Telegram / 微信 / 飞书
- Session Store 扩展：Redis / Postgres
- Progress Sink 扩展：卡片、编辑消息、Web 控制台
- AI Provider 扩展：任意 ACP agent
