# macOS 接入 NapCat

如果你在 macOS 上直接用 QQ，这个仓库已经带了 NapCat 辅助脚本，省掉一部分重复操作。

## 相关项目

- [NapCatQQ](https://github.com/NapNeko/NapCatQQ)
- [OneBot 11](https://11.onebot.dev)

## 这些脚本会做什么

仓库里的脚本会帮你处理下面几件事：

- 下载最新 NapCat Shell
- patch QQ，注入 NapCat loader
- 写 OneBot 11 reverse WebSocket 配置
- 启动或恢复 QQ

## 默认约定

默认 reverse WebSocket 地址：

```text
ws://127.0.0.1:16700/onebot/v11/ws
```

默认 QQ 路径：

```text
/Applications/QQ.app
```

## 常用命令

查看当前状态：

```bash
npm run status:napcat:macos
```

一键检查 bot / NapCat / QQ 状态：

```bash
npm run bot:macos -- status
```

安装 / patch：

```bash
npm run setup:napcat:macos
```

启动 QQ（NapCat 模式）：

```bash
npm run launch:napcat:macos
```

一键修复 bot + NapCat 基础配置并重启 bot：

```bash
npm run bot:macos -- repair
```

刷新登录二维码：

```bash
npm run bot:macos -- login
```

如果当前已经登录，这个命令会直接告诉你当前登录的是哪个 QQ 号。

一键拉起 bot + QQ / NapCat：

```bash
npm run bot:macos -- up
```

如果这时还没登录，命令输出里会直接带登录二维码链接。

如果你已经知道自己要让 NapCat 优先接管哪个 QQ 号，也可以直接指定：

```bash
npm run bot:macos -- up --quick-account 3765026549
```

恢复原始 QQ：

```bash
npm run restore:qq:macos
```

## 自定义参数

如果你需要改 WS 地址、token 或 QQ 路径，可以把参数透传给脚本：

```bash
npm run setup:napcat:macos -- \
  --ws-url ws://127.0.0.1:16700/onebot/v11/ws \
  --token your-token \
  --qq-app /Applications/QQ.app
```

如果 QQ 已经开着，想强制重启：

```bash
npm run launch:napcat:macos -- --restart
```

## 建议

- 先跑 `npm run status:napcat:macos` 看当前状态
- 日常自己恢复时，优先用 `npm run bot:macos -- up`
- patch 前先退出 QQ
- 真机环境里把 access token 改掉，不要一直用示例值
