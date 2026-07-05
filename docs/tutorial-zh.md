# 中文教程：先跑通，再接自己的 agent

这份中文教程是面向第一次接触仓库的人写的。  
目标不是“讲所有部署形态”，而是帮你少踩坑地跑通第一条链路。

## 先分清三条路径

### 1. 标准快速开始

适合：

- 你要接自己的 `traex` / 自定义 ACP agent
- 你要排查真实的宿主机链路

看这里：

- [快速开始](./getting-started.md)
- [ACP Agent 接入](./agent-integration.md)

### 2. Docker 演示栈

适合：

- 你只想先验证一个隔离 demo
- 你不打算立刻接宿主机里的真实 agent

注意：

- 默认接的是仓库内置 mock agent
- 不是标准生产接法

看这里：

- [Docker 快速演示](./docker-quickstart.md)

### 3. macOS 本机 QQ / NapCat 运维辅助

适合：

- 你本机就是 macOS + QQ + NapCat
- 你需要 patch QQ、辅助登录、查看本机状态

看这里：

- [macOS 接入 NapCat](./macos-napcat.md)

## 最推荐的第一条路径

```bash
git clone https://github.com/happysnaker/qq-ai-bot.git
cd qq-ai-bot
npm install
cp .env.example .env
cp examples/group-rules.example.json examples/group-rules.local.json
npm run smoke:agent
npm run dev
curl http://127.0.0.1:8080/status
```

如果 `curl` 返回：

```json
{
  "ok": true,
  "onebot": {
    "connected": false
  }
}
```

说明：

- bot 本体已经起来了
- 但 QQ / OneBot 还没接上

下一步就是去配置 OneBot reverse WebSocket：

```text
ws://127.0.0.1:16700/onebot/v11/ws
```

## `traex` 最常见的坑

如果你接的是 `traex`，推荐配置：

```env
ACP_AGENT_COMMAND=traex
ACP_AGENT_ARGS_JSON=["acp","serve"]
ACP_AGENT_WORKDIR=/path/to/your/workdir
```

不要把它写成：

```env
ACP_AGENT_ARGS_JSON=[]
```

否则很多情况下实际启动的是交互式界面，不是 ACP 服务端，最终表现成：

```text
ACP connection closed
```

## QQ / NapCat 最常见的坑

1. reverse WS 地址不一致
2. token 不一致
3. bot 已经起来了，但 OneBot 还没回连
4. macOS helper 当成标准 quickstart 在用

## 建议阅读顺序

1. [快速开始](./getting-started.md)
2. [ACP Agent 接入](./agent-integration.md)
3. [配置说明](./configuration.md)
4. [FAQ / 常见问题](./faq.md)
5. [Deployment matrix / 部署组合矩阵](./deployment-matrix.md)

## 补充说明

这个仓库更像：

- QQ / OneBot 接线层
- ACP 会话管理层
- 进度回传和群聊策略层

而不是把某一个模型 SDK 直接绑死在 bot 里。

如果你后面要接 DeepSeek、本地模型、或者自己的 agent runtime，真正会变的是后面的 ACP agent，不是这层 QQ bridge。
