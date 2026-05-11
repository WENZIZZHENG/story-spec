# 保留 runtime 的命令产物构建

## 背景

`npm run build:commands` 当前会通过 `buildCommandArtifacts` 删除默认输出目录 `dist/`，再生成各 agent command artifacts。这样单独运行 `build:commands` 后，`dist/cli.js` 和 TypeScript 编译出的 runtime 文件会消失；后续直接执行 `node dist/cli.js --help` 或依赖 compiled runtime 的检查命令容易失败。

`npm run verify` 目前靠二次 `npm run build` 绕过这个问题，但本地开发和 CI 单步命令仍然脆弱。

## 目标

- 默认 `build:commands` 只重建命令产物，不删除 `dist/cli.js`、`dist/script-runtime.js`、`dist/application/**`、`dist/domain/**` 等 compiled runtime。
- 自定义 `outDir` 的测试和 manifest 生成仍保持完整清理，避免临时目录残留影响 hash。
- 文档说明新的命令顺序：推荐路径下 `build` 后运行 `build:commands` 不需要再补一次 `build` 才能运行 CLI。

## 非目标

- 不迁移 `src/agent/registry.ts` 中的 `dist/<agent>` 产物路径。
- 不提交完整 `dist/`。
- 不修改 command template 内容和 agent renderer 输出。
