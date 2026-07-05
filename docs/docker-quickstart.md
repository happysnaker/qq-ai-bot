# Docker 快速演示

这份文档只负责一件事：

**用仓库自带的演示栈，快速跑通一条独立 demo 链路。**

```text
NapCat -> qq-ai-bot -> mock ACP agent
```

> 这不是标准快速开始。  
> 这套 Docker 演示默认使用**仓库内置 mock agent**，不会自动接上你宿主机里的 `traex` / 自定义 ACP agent。

如果你的目标是接真实本机 agent，请回到 [`getting-started.md`](getting-started.md)。

## 这套演示包含什么

仓库里已经准备好了：

- `docker-compose.demo.yml`
- `.env.docker.example`
- `deploy/napcat.onebot11.reverse-ws.json`

其中：

- `napcat` 容器负责 QQ / OneBot 11
- `qq-ai-bot` 容器负责 bot 本体
- `qq-ai-bot` 容器内默认直接拉起仓库自带 mock ACP agent

## 1. 准备演示环境变量

```bash
cp .env.docker.example .env.docker
```

如果你只是先跑 demo，通常不需要改这份文件。

默认配置里：

- `ONEBOT_MODE=reverse`
- `ONEBOT_ACCESS_TOKEN=`（默认留空，方便先跑通）
- `ACP_AGENT_COMMAND=node`
- `ACP_AGENT_ARGS_JSON=["dist/examples/mock-acp-agent.js"]`

## 2. 启动演示栈

```bash
docker compose -f docker-compose.demo.yml up -d --build
```

## 3. 登录 NapCat

打开：

```text
http://127.0.0.1:6099/webui
```

默认 WebUI token：

```text
napcat
```

登录 QQ 后，NapCat 会按 `deploy/napcat.onebot11.reverse-ws.json` 的配置，主动回连到容器内的 `qq-ai-bot`。

## 4. 验证 bot 是否通了

建议顺序：

1. 私聊机器人发普通文本
2. 发送 `/ping`
3. 发送 `/status`
4. 群聊中 `@机器人` 再发一条文本

健康检查：

```bash
curl http://127.0.0.1:18080/healthz
curl http://127.0.0.1:18080/readyz
curl http://127.0.0.1:18080/status
```

## 5. 这套 demo 默认用了什么 agent

演示里不是外部 LLM agent，而是仓库内置 mock agent：

```text
node dist/examples/mock-acp-agent.js
```

所以它的定位是：

- 先验证 QQ / OneBot / bot runtime 没问题
- 不依赖你宿主机额外安装 agent
- 不代表你的生产接法已经验证完成

## 6. 想换成你自己的 ACP agent？

只有在**你的 agent 也在容器里**时，这条思路才合适。

要改的是 `.env.docker`：

```env
ACP_AGENT_COMMAND=your-acp-agent-command
ACP_AGENT_ARGS_JSON=["arg1","arg2"]
ACP_AGENT_WORKDIR=/path/to/your/workdir
```

如果你的 agent 在宿主机而不在容器里，不要继续沿用这套 demo 栈。更合适的做法是：

- 按 [`getting-started.md`](getting-started.md) 在宿主机直接运行 `qq-ai-bot`
- 或者自己构建扩展镜像，把 agent 一起装进容器

## 7. Docker 路径的边界

当前这套 Docker 文档刻意定位为**演示栈**，原因很简单：

- 仓库没有把“宿主机各种 ACP 环境”一起封进这个镜像
- 它默认跑的是 mock agent
- 所以它不应该被理解成“推荐生产部署模板”

如果你是第一次接这个仓库，想接真实 agent，请优先走：

- [`getting-started.md`](getting-started.md)

## 8. 停止演示栈

```bash
docker compose -f docker-compose.demo.yml down
```

如果你连数据一起删：

```bash
docker compose -f docker-compose.demo.yml down -v
```
