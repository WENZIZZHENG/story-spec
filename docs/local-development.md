# 本地开发

本文只保留当前 StorySpec 仓库的开发入口。

## 环境

- Node.js 18+
- npm
- Git

安装依赖：

```bash
npm install
```

## 常用命令

```bash
npm run build
npm test
npm run test:smoke
npm run check:changes
npm run check:command-manifest
npm run build:commands
```

完整验证：

```bash
npm run verify
```

## 开发 CLI

```bash
npm run dev -- --help
npm run dev -- init my-story --agent generic --no-git
```

构建后运行：

```bash
npm run build
node dist/cli.js --help
```

## 命令产物

修改 `templates/commands/`、`src/prompt/`、agent renderer 或相关模板后，运行：

```bash
npm run build:commands
npm run update:command-manifest
npm run check:command-manifest
```

注意：`build:commands` 会重建 `dist` 中的命令产物。跑 smoke 前请再执行一次：

```bash
npm run build
npm run test:smoke
```

## 变更记录

用户可见行为、CLI、模板契约、生成产物或文档入口变化，需要新增 `changes/*.md`，并通过：

```bash
npm run check:changes
```

## 相关文档

- [技术架构](tech/architecture.md)
- [Agent integrations](agent-integrations.md)
- [Agent contract](agent-contract.md)
- [命令语义速查](commands.md)
