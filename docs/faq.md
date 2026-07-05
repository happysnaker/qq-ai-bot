# FAQ / 常见问题

这份 FAQ 只回答最常见、最容易卡住的新手问题。

如果你想接真实本机 agent，最短路径是：

1. 先看 [快速开始](getting-started.md)
2. 再看 [ACP Agent 接入](agent-integration.md)
3. 如果仍然卡住，再用 [Q&A Discussions](https://github.com/happysnaker/qq-ai-bot/discussions/categories/q-a)

如果你只是想跑一个隔离 demo，再看 [Docker 快速演示](docker-quickstart.md)。

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
curl http://127.0.0.1:8080/healthz
curl http://127.0.0.1:8080/readyz
curl http://127.0.0.1:8080/metrics
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

## 8. 语音、文件、视频为什么看起来“收到了”，但 agent 没真的读到？

这是当前仓库**有意公开承认的能力边界**。

现阶段主链路优先稳定支持的是：

- 文本
- 图片

对于下面这些 richer media：

- 语音 / 音频
- 文件附件
- 视频 / 大媒体

现在第一阶段的行为是：

- bot **不会再像没看到一样静默丢掉**
- 会把“这轮消息里还有哪些未直传媒体”明确写进发给 agent 的附加说明
- agent 应该据此明确告诉用户：当前还不能直接读取这些附件，并引导用户补充文字摘要、转图片，或换成下一阶段支持的路径

所以如果你看到：

- bot 知道你发了附件
- 但最终回复仍然让你补文字

这通常是**当前版本的预期行为**，不是单纯 bug。

## 9. 单机先跑通后，什么时候该切 Redis？

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

## 10. 遇到问题时，应该提 issue 还是发 discussion？

建议：

- **使用 / 部署 / 接入问题** → [Q&A Discussions](https://github.com/happysnaker/qq-ai-bot/discussions/categories/q-a)
- **功能想法 / roadmap** → [Ideas Discussions](https://github.com/happysnaker/qq-ai-bot/discussions/categories/ideas)
- **明确可复现的 bug** → issue

这样仓库会更干净，别人以后也更容易搜到同类问题。

## 11. 我想先看“最像成品”的入口，不想一点点拼配置

先看这三个：

- [Docker 快速演示](docker-quickstart.md)
- [快速开始](getting-started.md)
- [架构说明](../ARCHITECTURE.md)

它们分别解决的是：

- **先跑起来**
- **先知道该改什么**
- **先知道这个仓库是不是你要的那种基础设施形态**

## 12. 这个仓库如果真的帮我省了时间，怎么支持最直接？

最直接的是：

- 支持页：[happysnaker.github.io/support/#from-qq-ai-bot](https://happysnaker.github.io/support/#from-qq-ai-bot)
- 付款备注最有用：`qq-ai-bot`

如果你想拿到反馈，而不是单纯打赏：

- `¥29.9` quick read
- `¥99` async review

入口在：

- [SUPPORT.md](../SUPPORT.md)
- [Review page](https://happysnaker.github.io/review/)

## 13. 我怎么排查“同一条消息到底触发了几次、卡在哪一步”？

先看日志里的 `correlationId`。

现在 bot 会尽量把同一轮交互的：

- 接收
- 去重
- ACP dispatch
- 进度播报
- 最终回复

串到同一个 `correlationId` 下。

最实用的方式：

- 找到那条异常消息附近的一条日志
- 记下 `correlationId`
- 再按这个字段 grep / 搜索整轮链路

这样比只看“有没有报错”更容易知道问题是在：

- OneBot 重放 / 去重
- agent 处理慢
- progress 发出去了但 final reply 没发出去
- 还是 reply 发出去了但 QQ 侧没表现正常

## 14. 为什么 `smoke:agent` 会报 `ACP connection closed`？

如果你接的是 `traex` / `traecli`，最常见原因是：

- `ACP_AGENT_ARGS_JSON=[]`
- 实际启动的是交互式界面，不是 `acp serve`

优先检查 `.env`：

```env
ACP_AGENT_COMMAND=traex
ACP_AGENT_ARGS_JSON=["acp","serve"]
```

## 15. 为什么 `npm run dev` 起得来，但 `/status` 里还是 `onebot.connected=false`？

这通常表示：

- bot 本体已经启动成功
- 但 QQ / OneBot 还没有回连上来

优先检查：

- reverse WS 地址是不是 `ws://127.0.0.1:16700/onebot/v11/ws`
- `ONEBOT_ACCESS_TOKEN` 是否和 OneBot 侧一致
- NapCat / LLOneBot 是否真的已经登录并启用了 OneBot 连接
