## 设计

`docs:finish` 保持“文档-only 收尾”定位：默认模式只生成检查计划和可选提交建议；显式 `--commit` 时执行检查并尝试本地 commit。命令不新增 `--apply`，因为它不修改文档内容，只有提交动作需要显式确认。

## 检查顺序

1. 运行 `git diff --check`。
2. 扫描 `docs/**/*.md` 和 `changes/*.md` 中的 placeholder：`TBD`、`TODO`、`待定`。
3. 读取 `git status --short`，判断是否只有文档-only 变更。

前两项失败会设置 `blocked: true`，不进入 commit。Git 状态不安全不会标记为检查失败，但 commit 会被跳过并给出 `skippedReason`。

## 安全边界

- 默认 preview 不执行外部命令，不提交。
- `--commit` 必须有非空 message；未提供时使用 `完成文档收尾`。
- 只允许提交 `docs/**`、`changes/*.md`、`README.md`、`AGENTS.md`、`SDD.md`、`openspec/changes/**` 这类文档/规范记录。
- 出现 `src/**`、`tests/**`、`templates/**`、`dist/**` 等非文档-only change 时跳过 commit。
- 不主动 push，不自动 stash，不清理 unrelated change。

## 结果结构

- `mode`: `preview` 或 `commit`。
- `writesFiles`: 始终为 `false`。
- `blocked`: 检查是否阻断。
- `checks`: 每个检查的状态、命令和失败摘要。
- `blockedReasons`: 阻断原因。
- `nextActions`: 修复建议。
- `changedFiles`: Git status 中识别出的文件。
- `commit`: `requested`、`created`、`message`、`skippedReason`。

## 非目标

- 不替代码变更选择测试集。
- 不改写文档内容或自动清除 placeholder。
- 不把 `docs:finish` 扩展成通用发布命令。
