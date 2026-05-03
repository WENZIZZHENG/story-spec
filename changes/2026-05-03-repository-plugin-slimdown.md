---
change_type: major
scope: repository,docs,templates,plugins,spec
---

# 旧方法论、重复文档与插件入口精简

## CLI 行为

- 删除作者风格类内置插件 `luyao-style`、`wangyu-style`、`shizhangyu-style`，避免项目继续维护带有强模仿导向的示例插件。
- 删除旧品牌和旧方法论文档 `METHODOLOGY.md`、`novel-sdd.md`、`docs/migration-guide.md`，当前维护规则统一由 `SDD.md`、`AGENTS.md` 和 `docs/tech/todo-*` 承担。
- `CHANGELOG.md` 精简为发布级摘要入口；逐项变更以 `changes/*.md` 为事实源。

## 模板契约

- `/write` 不再读取检测规避导向的写作预设。
- 删除检测规避导向的写作预设与高级指南。
- 保留并调整自然表达材料，把相关提示收敛到“可读性、个人声音、去模板腔”，不以规避检测为目标。

## 生成产物

- 删除过期 legacy 文档归档目录和旧架构图。
- README、docs、spec README、技术文档入口已移除被删除文件和插件的引用。
- command artifact manifest 已重新生成。

## 验证

- `npm run build`
- `npm test`
- `npm run build:commands`
- `npm run update:command-manifest`
- `npm run check:changes`
- `npm run check:command-manifest`
- `git diff --check`
- `npm run test:smoke`
