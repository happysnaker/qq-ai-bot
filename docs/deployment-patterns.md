# Deployment patterns / 部署形态

这份文档回答一个更实际的问题：

**`qq-ai-bot` 在真实部署里，通常扮演什么角色？**

一句话版本：

> 它更像一层 **QQ / OneBot 11 接线 + session orchestration + progress streaming** 基础设施，而不是把某个特定模型 SDK 直接写死在 bot 里。

这也是为什么它既能接 mock agent，也能接 `traecli`，也能放在 **DeepSeek-backed local agent runtime** 前面。

---

## 1. 最短验证链路：NapCat + qq-ai-bot + mock ACP agent

这是最适合第一次接触仓库的形态：

```text
QQ / NapCat
    ↓ OneBot 11
qq-ai-bot
    ↓ ACP
mock agent
```

特点：

- 最快验证 **QQ → OneBot → qq-ai-bot → ACP** 是否打通
- 不要求你先准备真实模型
- 最适合联调 transport、session、progress 回传

对应入口：

- [Docker 快速演示](docker-quickstart.md)
- [快速开始](getting-started.md)

---

## 2. 常见真实形态：qq-ai-bot 作为 DeepSeek / 本地 agent 的 QQ 接入层

这是更接近真实用途的形态：

```text
QQ / NapCat / LLOneBot
        ↓ OneBot 11
    qq-ai-bot
        ↓ ACP
ACP-compatible local agent runtime
        ↓
DeepSeek / other local or self-hosted model stack
```

这里的关键点不是 `qq-ai-bot` 直接调用某个模型平台，而是：

- 它负责 **QQ / OneBot 11** 接入
- 它负责 **会话复用 / 持久化**
- 它负责 **进度回传**
- 它负责把消息、图片、命令和群聊策略整理成一层稳定的 bot 基础设施

而真正的模型调用、tool orchestration、prompt 组装，可以放在后面的 ACP runtime 里。

### 为什么这种形态对 DeepSeek 很自然

因为很多人实际想要的不是“一个新的网页聊天框”，而是：

- 继续用 **QQ** 这个现成消息入口
- 在本机 / 局域网 / 自托管环境里跑 agent
- 把 **DeepSeek** 或其他模型能力藏在 agent runtime 后面
- 保持部署路径可控、日志可看、session 可复用

`qq-ai-bot` 正好适合做这层 **messaging-facing integration layer**。

### 这层拆分的好处

这种拆法有几个明显好处：

- **不把 bot 和某个模型厂商绑死**
- **transport 和 agent runtime 解耦**
- **以后换 agent / 换模型时，不必重写 QQ 接线层**
- **更容易做 session store、observability、channel 扩展**

如果你后面从 DeepSeek 换成别的本地模型，通常改的是后面的 ACP runtime，不是 `qq-ai-bot` 自己。

---

## 3. 多实例 / 更像生产的形态：外部 session store

当你从“能跑”走向“长期运行”时，常见演进是：

```text
QQ / OneBot 11
      ↓
  qq-ai-bot
      ↓
 Redis session store
      ↓
 ACP-compatible agents
```

这时候 `qq-ai-bot` 的角色更像：

- channel adapter
- conversation router
- stateful bot edge

而不是“模型应用本体”。

如果你准备做：

- 多实例
- 长运行容器
- 不想把 session 只写本地 JSON

那就可以把 session store 从 `file` 切到 `redis`。

对应说明：

- [配置说明](configuration.md)
- [Multi-instance notes / 多实例运维说明](multi-instance-notes.md)

---

## 4. 选 NapCat 还是 LLOneBot？

如果你只是想 **最快跑通**，通常优先：

- NapCat + reverse WebSocket

如果你已经明确在使用：

- LLOneBot + forward WebSocket

那就按它的模式接。

`qq-ai-bot` 这里的目标不是强行要求某一种 QQ 侧实现，而是：

- 只要它能稳定提供 **OneBot 11**
- 只要后面的 agent 能稳定提供 **ACP**

这层 glue 就成立。

---

## 5. 什么时候它更像“基础设施”，而不是“Demo”？

通常有下面几个信号：

- 你开始关心 **session persistence**
- 你开始关心 **progress streaming**
- 你开始关心 **health / readyz / metrics**
- 你开始关心 **transport 和 agent 的解耦**
- 你开始把它当作自己 bot 系统的一层，而不是一份临时脚本

如果你已经在看这些问题，`qq-ai-bot` 的价值就不只是“QQ 能回话”，而是：

**它把 QQ / OneBot / ACP / session / observability 这一层先整理成了一个更稳定的 scaffold。**

---

## 6. 适合谁，不适合谁

### 更适合

- 想做 **自托管 QQ ↔ AI** 系统的人
- 已经有或准备有 **ACP-compatible local agent runtime** 的人
- 想把 **DeepSeek / 本地模型能力** 接到 QQ 上的人
- 不想把 transport、session、progress、group rules 全都从头搭一遍的人

### 没那么适合

- 只想要一个网页聊天框
- 不需要 QQ / OneBot 11
- 不关心 session reuse、bot commands、群聊策略、进度回传

---

## 7. 相关入口

- [Deployment matrix / 部署组合矩阵](deployment-matrix.md)
- [Multi-instance notes / 多实例运维说明](multi-instance-notes.md)
- [快速开始](getting-started.md)
- [FAQ / 常见问题](faq.md)
- [ACP Agent 接入](agent-integration.md)
- [配置说明](configuration.md)
- [架构说明](../ARCHITECTURE.md)

如果你就是想把这套结构抄到自己的 bot / agent / infra 仓库里：

- [SUPPORT.md](../SUPPORT.md)
- [Review page](https://happysnaker.github.io/review/)
