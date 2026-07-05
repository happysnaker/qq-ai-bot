# ACP Agent 接入

这个项目不会直接调用某个模型平台 SDK。  
它做的事情是：

1. 启动你配置的本地 agent
2. 通过 ACP 与它通信
3. 把结果、进度和会话状态接回 QQ

## bot 是怎么启动 agent 的

核心配置只有三项：

```env
ACP_AGENT_COMMAND=your-acp-agent-command
ACP_AGENT_ARGS_JSON=["arg1","arg2"]
ACP_AGENT_WORKDIR=/path/to/your/workdir
```

含义分别是：

- `ACP_AGENT_COMMAND`：可执行文件或启动命令
- `ACP_AGENT_ARGS_JSON`：参数数组
- `ACP_AGENT_WORKDIR`：启动目录，同时也会作为 ACP session 的 `cwd`

bot 会通过 agent 进程的 stdin / stdout 与它建立 ACP 连接。

## 最低要求

必需能力：

- `initialize`
- `newSession`
- `prompt`

建议支持：

- `loadSession`
- `closeSession`
- `promptCapabilities.image`

如果 agent 会持续发送这些增量事件，bot 就能把处理进度回发到 QQ：

- `plan`
- `tool_call`
- `tool_call_update`
- `agent_message_chunk`

## 方案 A：仓库内置 mock agent

如果你只是先验证链路，直接用它最省事：

```env
ACP_AGENT_COMMAND=node
ACP_AGENT_ARGS_JSON=["--import","tsx","src/examples/mock-acp-agent.ts"]
ACP_AGENT_WORKDIR=.
```

验证：

```bash
npm run smoke:agent
```

这套配置也是 `.env.example` 的默认值。

## 方案 B：`traex`

如果你使用 `traex`，推荐明确写成：

```env
ACP_AGENT_COMMAND=traex
ACP_AGENT_ARGS_JSON=["acp","serve"]
ACP_AGENT_WORKDIR=/path/to/your/workdir
```

验证方式：

```bash
npm run smoke:agent
```

也可以使用仓库里的便捷别名：

```bash
npm run smoke:traex
```

兼容旧命名的：

```bash
npm run smoke:traecli
```

### 关于 `ACP_AGENT_ARGS_JSON`

这是当前最容易踩坑的地方。

如果你把它写成：

```env
ACP_AGENT_ARGS_JSON=[]
```

对很多 `traex` / `traecli` 安装来说，实际拉起的会是交互式界面，而不是 ACP 服务端，最终就会表现成：

```text
ACP connection closed
```

所以文档里始终建议写成：

```env
ACP_AGENT_ARGS_JSON=["acp","serve"]
```

当前代码对 `traex` / `traecli` 也会把空参数自动补成这个默认值，但**不要把这件事当成文档层面的推荐配置**。

## 方案 C：你自己的 ACP agent

例如：

```env
ACP_AGENT_COMMAND=my-agent
ACP_AGENT_ARGS_JSON=["serve","--stdio"]
ACP_AGENT_WORKDIR=/path/to/your/workdir
```

验证方式还是一样：

```bash
npm run smoke:agent
```

## 切换 agent 时真正要改的只有三项

一般只需要改：

- `ACP_AGENT_COMMAND`
- `ACP_AGENT_ARGS_JSON`
- `ACP_AGENT_WORKDIR`

群聊策略、命令体系、OneBot 接入和会话持久化不需要跟着重写。

## richer media 边界

当前稳定主链路是：

- 文本
- 图片

如果用户发来语音、文件、视频等 richer media，bot 会显式把“未直传媒体”写进 prompt，要求 agent 不要假装已经读取了附件内容。

这能避免“附件其实没传过去，但 agent 还像看过了一样回答”的错误观感。
