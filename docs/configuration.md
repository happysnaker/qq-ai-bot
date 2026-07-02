# 配置说明

项目启动时会自动读取项目根目录下的 `.env`。

## `.env` 主要配置

### 服务本身

| 配置项 | 说明 |
| --- | --- |
| `BOT_HOST` | HTTP 服务监听地址 |
| `BOT_PORT` | HTTP 服务端口 |
| `LOG_LEVEL` | 日志级别 |
| `DATA_DIR` | 数据目录 |
| `SESSION_FILE_PATH` | 会话持久化文件路径 |
| `SESSION_TTL_MINUTES` | 会话过期时间 |
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

### ACP / Agent

| 配置项 | 说明 |
| --- | --- |
| `ACP_AGENT_COMMAND` | agent 可执行文件，例如 `node`、`traecli` 或你的自定义命令 |
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
- QQ 内的 `/status` 也会显示当前版本与启动时间

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
