# 配置说明

项目启动时会自动读取项目根目录下的 `.env`。

如果同时存在 `.env.local`，同名项会覆盖 `.env`。

## `.env` 主要配置

### 服务本身

| 配置项 | 说明 |
| --- | --- |
| `BOT_HOST` | HTTP 服务监听地址 |
| `BOT_PORT` | HTTP 服务端口 |
| `LOG_LEVEL` | 日志级别 |
| `DATA_DIR` | 数据目录 |
| `SESSION_STORE` | `file` 或 `redis` |
| `SESSION_FILE_PATH` | 会话持久化文件路径 |
| `SESSION_TTL_MINUTES` | 会话过期时间 |
| `REDIS_URL` | `SESSION_STORE=redis` 时的 Redis 连接串 |
| `REDIS_KEY_PREFIX` | Redis key 前缀 |
| `APP_GIT_COMMIT` | 可选，当前运行版本对应的 git commit |
| `APP_BUILD_REF` | 可选，构建标识、镜像 tag 或部署版本号 |

### QQ / OneBot 11

| 配置项 | 说明 |
| --- | --- |
| `ONEBOT_MODE` | `forward` 或 `reverse` |
| `ONEBOT_ACCESS_TOKEN` | OneBot access token |
| `ONEBOT_FORWARD_WS_URL` | forward 模式地址 |
| `ONEBOT_REVERSE_WS_HOST` | reverse WS 监听地址 |
| `ONEBOT_REVERSE_WS_PORT` | reverse WS 监听端口 |
| `ONEBOT_REVERSE_WS_PATH` | reverse WS 路径 |
| `ONEBOT_ALLOW_GROUP` | 是否响应群聊 |
| `ONEBOT_REQUIRE_MENTION_IN_GROUP` | 群聊是否必须 `@` |
| `ONEBOT_ALLOW_PRIVATE` | 是否响应私聊 |
| `ONEBOT_ALLOW_GROUP_COMMANDS_WITHOUT_MENTION` | 群聊命令是否允许不 `@` 直接执行 |
| `ONEBOT_ALLOWED_GROUPS` | 群白名单，逗号分隔 |
| `ONEBOT_BLOCKED_GROUPS` | 群黑名单，逗号分隔 |
| `ONEBOT_ALLOWED_USERS` | 用户白名单，逗号分隔 |
| `ONEBOT_BLOCKED_USERS` | 用户黑名单，逗号分隔 |
| `ONEBOT_COMMAND_PREFIX` | 命令前缀，默认 `/` |
| `ONEBOT_GROUP_CONFIG_FILE` | 分群配置文件 |
| `ONEBOT_PROGRESS_MODE` | `off` 或 `message` |
| `ONEBOT_OUTBOUND_MAX_TEXT_LENGTH` | 单条消息最大文本长度 |
| `ONEBOT_INBOUND_DEDUPE_WINDOW_MS` | 轻量入站去重窗口，默认 120000 ms |
| `ONEBOT_INBOUND_DEDUPE_MAX_ENTRIES` | 入站去重缓存上限，默认 2048 |
| `NAPCAT_WEBUI_TOKEN` | macOS NapCat helper 使用的 WebUI token |
| `QQ_APP_PATH` | macOS helper 使用的 QQ.app 路径 |

### ACP / Agent

| 配置项 | 说明 |
| --- | --- |
| `ACP_AGENT_COMMAND` | agent 可执行文件，例如 `node`、`traex` 或你的自定义命令 |
| `ACP_AGENT_ARGS_JSON` | 启动参数，推荐写合法 JSON 数组 |
| `ACP_AGENT_WORKDIR` | agent 工作目录 |
| `ACP_CLIENT_NAME` | ACP client name |
| `ACP_REUSE_SESSION` | 是否复用远端 session |
| `ACP_DEFAULT_SYSTEM_PROMPT` | 默认 system prompt |
| `ACP_VERBOSE_MODE` | `normal` / `verbose` / `debug` |
| `ACP_PERMISSION_STRATEGY` | `allow_once` / `allow_always` / `cancel` |
| `ACP_PROGRESS_THROTTLE_MS` | 进度消息最小间隔 |
| `ACP_MAX_PROGRESS_UPDATES` | 单轮最多进度更新次数 |
| `ACP_MAX_INBOUND_IMAGES` | 单轮最多处理图片数 |
| `ACP_MAX_INBOUND_IMAGE_BYTES` | 单张图片大小上限 |

如果你需要可直接复制的 agent 配置示例，看 [ACP Agent 接入](agent-integration.md)。

### 关于 `ACP_AGENT_ARGS_JSON`

当前最常见的坑是：

- `ACP_AGENT_COMMAND=traex`
- 但 `ACP_AGENT_ARGS_JSON=[]`

这会让很多 `traex` / `traecli` 安装启动交互式界面，而不是 `acp serve`，随后表现成 `ACP connection closed`。

对 `traex` / `traecli`，推荐明确写成：

```env
ACP_AGENT_COMMAND=traex
ACP_AGENT_ARGS_JSON=["acp","serve"]
```

当前代码在参数留空时也会对 `traex` / `traecli` 自动补成这个默认值，但文档层面仍然建议显式写出来。

## Session Store

现在支持两种 session store：

- `SESSION_STORE=file`：默认值，适合单机 / 单容器路径
- `SESSION_STORE=redis`：适合多实例、长运行容器和外部存储

### File store

默认行为，不需要额外依赖：

```env
SESSION_STORE=file
SESSION_FILE_PATH=./data/sessions.json
SESSION_TTL_MINUTES=120
```

### Redis store

最小配置：

```env
SESSION_STORE=redis
REDIS_URL=redis://127.0.0.1:6379/0
REDIS_KEY_PREFIX=qq-ai-bot
SESSION_TTL_MINUTES=120
```

说明：

- bot 会为每个 QQ 会话写一个 Redis key
- 同时维护一个 session key 集合，方便列出当前持久化会话
- TTL 与 `SESSION_TTL_MINUTES` 对齐
- `REDIS_KEY_PREFIX` 用来隔离不同环境，例如 `qq-ai-bot-prod` / `qq-ai-bot-dev`

如果你已经准备做多实例部署，Redis store 会比本地 JSON 文件更像生产形态。

## 分群配置文件

`ONEBOT_GROUP_CONFIG_FILE` 指向一个 JSON 文件。建议把仓库里的示例文件复制一份本地再改：

```bash
cp examples/group-rules.example.json examples/group-rules.local.json
```

示例：

```json
{
  "defaultSystemPrompt": "你是一个稳定、可靠、实事求是的 QQ AI 助手。",
  "groups": {
    "123456789": {
      "name": "技术讨论群",
      "enabled": true,
      "requireMention": true,
      "systemPrompt": "你正在服务技术讨论群。优先给出结论、原因、风险和下一步建议。"
    },
    "223344556": {
      "name": "运营值班群",
      "enabled": true,
      "requireMention": false,
      "systemPrompt": "你正在服务运营值班群。回答尽量短，优先给可执行处理建议。"
    },
    "987654321": {
      "name": "静默通知群",
      "enabled": false
    }
  }
}
```

支持的字段：

- `defaultSystemPrompt`：全局默认 prompt
- `groups.<groupId>.name`：展示名称，方便排查
- `groups.<groupId>.enabled`：是否启用该群
- `groups.<groupId>.requireMention`：该群是否必须 `@` 才答复
- `groups.<groupId>.systemPrompt`：该群专属 prompt

## Prompt 优先级

```text
group.systemPrompt > ACP_DEFAULT_SYSTEM_PROMPT > 无
```

如果分群配置文件里设置了 `defaultSystemPrompt`，而 `.env` 里也设置了 `ACP_DEFAULT_SYSTEM_PROMPT`，以 `.env` 为准。

## 命令

默认命令前缀是 `/`。

| 命令 | 说明 |
| --- | --- |
| `/help` | 查看帮助 |
| `/status` | 查看当前会话、触发策略、prompt 来源 |
| `/prompt` | 查看当前生效的 system prompt |
| `/reset` | 清空当前会话并重建 |
| `/ping` | 存活检查 |
另外：

- HTTP `/readyz` 和 `/status` 会返回 `build` 字段
- HTTP `/readyz` 和 `/status` 也会返回当前 `sessionStore`
- HTTP `/readyz` 和 `/status` 也会返回当前入站去重配置和缓存大小
- QQ 内的 `/status` 也会显示当前版本与启动时间
- HTTP `/metrics` 会返回 Prometheus 风格文本指标，当前包含 OneBot 连接状态、重连次数、入站 / 重复入站 / 出站消息计数、ACP prompt 调用 / 失败计数、活跃 / 持久化会话数，以及 `qq_ai_bot_turn_duration_seconds`、`qq_ai_bot_agent_roundtrip_seconds`、`qq_ai_bot_reply_send_seconds` 三类低基数 latency histogram

如果你在 Docker / CI / 发布流程里注入了 `APP_GIT_COMMIT` 或 `APP_BUILD_REF`，它们也会一起显示出来，便于排查线上实例到底跑的是哪个版本。

## 进度播报是怎么工作的

这部分不是靠前端“假装在思考”，而是把 agent 的增量状态真的接了出来。

流程大致是：

1. `ACPAgentBridge` 向本地 agent 发送 prompt
2. agent 在处理中持续回传 `plan`、`tool_call`、`tool_call_update`、`agent_message_chunk` 等增量事件
3. bot 在本地聚合这些事件
4. `ProgressReporter` 按节流配置整理成可读文本，再发回 QQ
5. 最终结果出来后，再单独发送正式答复

跟进度播报直接相关的配置：

- `ONEBOT_PROGRESS_MODE`
- `ACP_PROGRESS_THROTTLE_MS`
- `ACP_MAX_PROGRESS_UPDATES`

## correlation ID / 单轮链路追踪

现在每一条被接受处理的入站消息都会派生一个 `correlationId`，并尽量贯穿到：

- receive / 接收日志
- dedupe / 去重判定日志
- ACP prompt dispatch 日志
- progress / 进度播报日志
- final reply / 最终回复日志

适合的使用方式：

- 当某一轮消息“看起来重复了 / 卡住了 / 回复慢了”时，先按 `correlationId` 聚合同一轮日志
- 如果你在看 JSON 日志，直接筛 `correlationId`
- 如果你在看终端 pretty logs，也可以搜索同一个 `correlationId` 字符串

说明：

- 有可靠 `message_id` 时，`correlationId` 会尽量稳定地带上会话和消息标识
- 没有可靠 `message_id` 时，会退回到去重指纹的短哈希
- 这不是分布式 trace 标准实现，但足够把单轮 QQ → OneBot → ACP → reply 的日志串起来

## 轻量入站去重

为了降低 OneBot 重连、重复上报或边界情况下的重复 prompt 触发，bot 现在会在进入命令处理 / ACP dispatch 之前做一层**轻量入站去重**。

默认配置：

```env
ONEBOT_INBOUND_DEDUPE_WINDOW_MS=120000
ONEBOT_INBOUND_DEDUPE_MAX_ENTRIES=2048
```

行为说明：

- 优先使用 `message_id` + 会话维度做去重
- 如果事件没有可靠的 `message_id`，会退回到会话、发送者、时间桶、文本摘要等组合键
- 这是 **best-effort replay guard**，不是严格的 exactly-once 保证
- 当前只做单实例内存级缓存，不做跨实例协调

适合场景：

- 避免短时间内重复触发同一条 `/status`、`/reset` 等命令
- 避免 OneBot 重放导致同一条用户消息再次打到 ACP agent
- 降低进度播报和最终回复的重复噪声
