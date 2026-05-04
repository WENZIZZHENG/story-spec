---
change_type: patch
scope: cli,tests
---

# init 成功输出顺序

## CLI 行为

- `storyspec init` 成功后先显示创建成功，再显示“接下来”。
- 初始化过程中的 info/warning 会延后到成功输出之后展示，避免插在 spinner 和成功提示之间。
- 成功后的下一步列表收缩为主路径：进入目录、打开 agent、保存灵感、运行 `next`、预览规格。

## 模板契约

- 无模板契约变化。

## 生成产物

- 无故事文件结构变化。

## 验证

- 新增 `tests/unit/init-command-output.test.ts` 覆盖成功后主路径渲染。
- 已运行 `npm run build` 与 `npx vitest run tests/unit/init-command-output.test.ts tests/unit/init-project.test.ts`。
