# FAQ / 常见问题

这份 FAQ 只回答最常见、最容易卡住的新手问题。

如果你只想先验证链路是否通，最短路径是：

1. 先跑 [Docker 快速演示](docker-quickstart.md)
2. 再看 [快速开始](getting-started.md)
3. 如果仍然卡住，再用 [Q&A Discussions](https://github.com/happysnaker/qq-ai-bot/discussions/categories/q-a)

## 1. 一上来应该用 forward 还是 reverse WebSocket？

如果你只是想 **最快跑通**，优先从 **reverse WebSocket** 开始。

对应思路是：

- `qq-ai-bot` 作为 WebSocket 服务端
- NapCat / LLOneBot 作为客户端回连

这条路径最适合本机联调，也最容易先确认 QQ → OneBot → bot → ACP agent 整条链路是否通了。

如果你已经明确在用 **LLOneBot 的 OneBot11 正向 WS**，那再切到 `ONEBOT_MODE=forward`。

## 2. 为什么 bot 看起来启动了，但就是接不上 QQ？

最常见的是下面三类问题：

- **WS 方向配错**：`forward` / `reverse` 两边理解不一致
- **token 不一致**：`ONEBOT_ACCESS_TOKEN` 和 OneBot 侧配置的 token 不一致
- **URL / 端口 / 路径不一致**：尤其是 reverse 路径 `/onebot/v11/ws`

先检查：

- `ONEBOT_MODE`
- `ONEBOT_ACCESS_TOKEN`
- `ONEBOT_FORWARD_WS_URL`
- `ONEBOT_REVERSE_WS_HOST`
- `ONEBOT_REVERSE_WS_PORT`
- `ONEBOT_REVERSE_WS_PATH`

然后再看：

- QQ 侧 / OneBot 侧的连接日志
- `qq-ai-bot` 自己的启动日志
- HTTP `readyz` 返回值

## 3. 怎样最快判断不是 agent 的问题，而是 OneBot 接入的问题？

先单独跑：

```bash
npm run smoke:agent
```

如果这一步没过，就先别接 QQ。

只有当 `smoke:agent` 过了，才说明：

- `ACP_AGENT_COMMAND`
- `ACP_AGENT_ARGS_JSON`
- `ACP_AGENT_WORKDIR`

这三项至少能把 agent 正常拉起来。

## 4. 我还没有现成 agent，应该怎么先跑通？

直接用仓库自带 mock agent。

看这里：

- [ACP Agent 接入](agent-integration.md)

它的作用不是给你真实 AI 能力，而是让你先把：

**QQ / OneBot → qq-ai-bot → ACP bridge → 进度回传**

这条链路验证通过。

## 5. 怎么确认 bot 现在真的活着，而不是“进程还在但功能不通”？ 

最直接的检查方式：

```bash
curl http://127.0.0.1:18080/healthz
curl http://127.0.0.1:18080/readyz
curl http://127.0.0.1:18080/metrics
```

再配合 QQ 里发：

- `/ping`
- `/status`
- `/prompt`

如果 `readyz`、`/status` 和 QQ 侧行为能对上，基本就不是“假活着”。

## 6. 为什么群里发消息没反应？

先检查是不是命中了这些限制：

- `ONEBOT_ALLOW_GROUP=false`
- `ONEBOT_REQUIRE_MENTION_IN_GROUP=true` 但你没有 `@机器人`
- `ONEBOT_ALLOW_GROUP_COMMANDS_WITHOUT_MENTION=false`
- 当前群不在 `ONEBOT_ALLOWED_GROUPS`
- 当前群在 `ONEBOT_BLOCKED_GROUPS`
- `examples/group-rules.local.json` 里对该群设置了 `enabled: false`

最容易漏的是：

- 群消息需要 `@`
- 某个群被单独禁用了

## 7. 图片、进度回传、会话复用为什么和预期不一样？

这通常不是 QQ 侧本身的问题，而是 **agent 能力** 没对齐。

建议先确认 agent 是否支持：

- `loadSession`
- `closeSession`
- `promptCapabilities.image`
- 增量事件：`plan`、`tool_call`、`tool_call_update`、`agent_message_chunk`

如果 agent 不支持这些能力，bot 仍然能跑，但效果会更“基础”。

## 8. 单机先跑通后，什么时候该切 Redis？

默认先用：

```env
SESSION_STORE=file
```

只有当你进入这些场景，再切 Redis 更合适：

- 多实例部署
- 长时间运行容器
- 不希望 session 只落本地 JSON
- 想让会话更像生产形态

对应配置见：

- [配置说明](configuration.md)

## 9. 遇到问题时，应该提 issue 还是发 discussion？

建议：

- **使用 / 部署 / 接入问题** → [Q&A Discussions](https://github.com/happysnaker/qq-ai-bot/discussions/categories/q-a)
- **功能想法 / roadmap** → [Ideas Discussions](https://github.com/happysnaker/qq-ai-bot/discussions/categories/ideas)
- **明确可复现的 bug** → issue

这样仓库会更干净，别人以后也更容易搜到同类问题。

## 10. 我想先看“最像成品”的入口，不想一点点拼配置

先看这三个：

- [Docker 快速演示](docker-quickstart.md)
- [快速开始](getting-started.md)
- [架构说明](../ARCHITECTURE.md)

它们分别解决的是：

- **先跑起来**
- **先知道该改什么**
- **先知道这个仓库是不是你要的那种基础设施形态**

## 11. 这个仓库如果真的帮我省了时间，怎么支持最直接？

最直接的是：

- 支持页：[happysnaker.github.io/support/#from-qq-ai-bot](https://happysnaker.github.io/support/#from-qq-ai-bot)
- 付款备注最有用：`qq-ai-bot`

如果你想拿到反馈，而不是单纯打赏：

- `¥29.9` quick read
- `¥99` async review

入口在：

- [SUPPORT.md](../SUPPORT.md)
- [Review page](https://happysnaker.github.io/review/)
