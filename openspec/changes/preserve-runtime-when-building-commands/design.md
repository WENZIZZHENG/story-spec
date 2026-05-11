# 设计：命令产物清理边界

## 决策

采用“默认 `dist` 下只清理已知 agent 子目录”的方案，而不是引入新的 `dist-command-artifacts/` 目录。

原因：

- `src/agent/registry.ts`、`initProject` 和 doctor 逻辑已经把 `dist/<agent>` 视为已构建命令产物位置；迁移目录会扩大兼容面。
- 当前问题不是 agent 产物位置本身，而是 `build:commands` 对整个 `dist/` 执行删除。
- manifest 生成使用自定义临时 `outDir`，仍可继续全量删除临时目录，保持可复现。

## 实现方案

- 在 `src/prompt/build-commands.ts` 中识别默认输出目录 `path.join(rootDir, 'dist')`。
- 当输出目录是默认 `dist` 时，删除所有 `BUILD_COMMAND_AGENTS` 对应的一级目录，保留其他 compiled runtime 文件。
- 当输出目录是调用方传入的自定义目录时，继续删除整个目录，保证测试 fixture 和 manifest 生成没有旧文件。
- `readRuntimeBundle` 仍在清理前读取 compiled runtime，用于复制到 `.specify/scripts/runtime/`。

## 风险与缓解

- 风险：旧的未知 agent 目录可能留在默认 `dist`。缓解：只支持 registry 中的 agent，未知目录不属于当前构建契约，不主动删除用户或工具放入 `dist` 的其他内容。
- 风险：默认 `dist` 中 agent 子目录名与 runtime 文件冲突。缓解：当前 agent id 均为一级目录名，compiled runtime 位于文件或 `application/`、`domain/` 目录，不冲突。
