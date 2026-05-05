## 设计

新增 `src/application/ci-quality-checks.ts` 作为只读服务，CLI 命令只负责 project root、JSON/text 渲染和错误处理。

## JSON 契约

```ts
interface CiQualityCheckResult {
  projectRoot: string;
  valid: boolean;
  checks: Array<{
    checkId: string;
    status: 'pass' | 'fail';
    command: string;
    files: string[];
    message: string;
    suggestedAction: string;
  }>;
}
```

第一版 check：

- `changes.records`：提示运行 `npm run check:changes`，要求 `changes/` 和 `scripts/build/check-change-records.ts` 存在。
- `command.manifest`：提示运行 `npm run check:command-manifest`，要求 manifest fixture、脚本和 `templates/commands/` 存在。
- `agent.acceptance`：提示运行 agent registry / renderer 单测，要求准入文档和 `src/agent/acceptance.ts` 存在。
- `todo.boundary`：提示维护 `todo-index` / `todo-archive` 边界，要求两个文件存在且 `todo-index` 不再链接已归档生态路线的旧路径。

## 命令行为

- `storyspec ci:check`：文本输出，每项显示状态、命令、文件和建议。
- `storyspec ci:check --json`：输出 JSON，不显示 banner。
- 有 fail 时设置 `process.exitCode = 1`。

## 非目标

- 不执行子进程。
- 不新增 GitHub Actions。
- 不自动修改 changeset、manifest 或 todo。
- 不引入 Vale、textlint 或其他外部工具。
