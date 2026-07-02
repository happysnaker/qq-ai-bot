# Docker 快速演示

这份文档的目标不是“生产部署所有细节”，而是 **尽快跑通一条能工作的链路**：

```text
NapCat -> qq-ai-bot -> mock ACP agent
```

这样你能先确认 **QQ / OneBot / session / progress** 整条链路没问题，再决定把后端 agent 替换成自己的 `traecli`、Codex、Claude Code 或其他 ACP 兼容实现。

## 这套演示包含什么

仓库根目录下已经准备好了：

- `docker-compose.demo.yml`
- `.env.docker.example`
- `deploy/napcat.onebot11.reverse-ws.json`

其中：

- `napcat` 容器负责 QQ / OneBot 11
- `qq-ai-bot` 容器负责 bot 本体
- `qq-ai-bot` 容器内默认直接拉起仓库自带的 `mock ACP agent`

## 1. 准备演示环境变量

```bash
cp .env.docker.example .env.docker
```

如果你只是先跑演示，通常不需要改这份文件。

默认配置里：

- `ONEBOT_MODE=reverse`
- `ONEBOT_ACCESS_TOKEN=`（默认留空，方便先跑通）
- `ACP_AGENT_COMMAND=node`
- `ACP_AGENT_ARGS_JSON=["dist/examples/mock-acp-agent.js"]`

也就是说，这个演示默认不会依赖你本机已经安装好的 agent。

## 2. 启动演示栈

```bash
docker compose -f docker-compose.demo.yml up -d --build
```

`qq-ai-bot` 会用当前仓库的 Dockerfile 构建；NapCat 会直接拉常用镜像。

## 3. 登录 NapCat

打开：

```text
http://127.0.0.1:6099/webui
```

默认 token：

```text
napcat
```

登录你的 QQ 后，NapCat 会按 `deploy/napcat.onebot11.reverse-ws.json` 的配置，主动连到 `qq-ai-bot` 容器的 reverse WebSocket。

## 4. 验证 bot 是否通了

建议按这个顺序：

1. 私聊机器人发普通文本
2. 发送 `/ping`
3. 发送 `/status`
4. 群聊中 `@机器人` 再发一条文本

bot 的 HTTP 健康检查：

```bash
curl http://127.0.0.1:18080/healthz
curl http://127.0.0.1:18080/readyz
```

## 5. 这套演示默认用了什么 agent

演示里不是外部 LLM agent，而是仓库内置 mock agent：

```text
node dist/examples/mock-acp-agent.js
```

这样做的好处是：

- 不依赖你本机额外安装 agent
- 不需要先准备 API key
- 先把基础链路验证掉

## 6. 想换成你自己的 ACP agent

只需要改 `.env.docker` 里的这几项：

```env
ACP_AGENT_COMMAND=your-acp-agent-command
ACP_AGENT_ARGS_JSON=[]
ACP_AGENT_WORKDIR=/path/to/your/workdir
```

如果你的 agent 不在容器里，而是在宿主机上，那就不要继续沿用这个演示镜像思路了。更适合的做法是：

- 直接按 [快速开始](getting-started.md) 在宿主机运行 `qq-ai-bot`
- 或者构建你自己的扩展镜像，把 agent 一起装进容器

## 7. 如果你要给 NapCat 配 token

默认演示把 token 留空，图的是最少阻力。

如果你想启用 token 校验，需要 **同时** 修改两边：

1. `.env.docker` 里的 `ONEBOT_ACCESS_TOKEN`
2. `deploy/napcat.onebot11.reverse-ws.json` 里的 `token`

两边必须保持一致。

## 8. 演示完成后怎么停

```bash
docker compose -f docker-compose.demo.yml down
```

如果你连数据也一起删：

```bash
docker compose -f docker-compose.demo.yml down -v
```
