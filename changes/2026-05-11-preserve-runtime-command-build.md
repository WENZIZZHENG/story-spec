---
change_type: patch
scope: build,docs
---

# 命令产物构建保留 compiled runtime

## CLI 行为

- `npm run build:commands` 默认输出到 `dist` 时，只清理并重建已知 agent command artifact 子目录，不再删除 `dist/cli.js` 和 compiled runtime。
- 推荐顺序 `npm run build && npm run build:commands` 后，`node dist/cli.js --help` 仍可直接运行。

## 模板契约

- 无 command template 语义变化；agent command 输出路径仍保持 `dist/<agent>`。

## 生成产物

- 自定义 `outDir` 的命令产物构建仍会完整清理目标目录，保证 manifest 检查和测试 fixture 不受旧文件影响。
- 默认 `dist` 构建只移除当前 registry 中的 agent 子目录，保留 TypeScript 编译产物。

## 验证

- `npx openspec validate preserve-runtime-when-building-commands --strict --json --no-interactive`
- `npx vitest run tests/unit/build-commands.test.ts`
