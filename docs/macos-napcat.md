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

安装 / patch：

```bash
npm run setup:napcat:macos
```

启动 QQ（NapCat 模式）：

```bash
npm run launch:napcat:macos
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
- patch 前先退出 QQ
- 真机环境里把 access token 改掉，不要一直用示例值
