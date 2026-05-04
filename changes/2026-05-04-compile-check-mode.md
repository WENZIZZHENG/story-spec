---
change_type: minor
scope: cli,application,init,tests
---

# 新增 compile check 模式

## CLI 行为

- `storyspec compile --check` 只检查可编译性、章节顺序、warning 和字数统计，不写入 `build/`。
- `compile` 文本输出新增“写入”状态；JSON 输出新增 `written`。
- 常规 `compile` 行为保持不变，仍会写入 `build/manuscript.md`、report 和可选 frontmatter。

## 模板契约

- 新初始化且启用 Git 的项目 `.gitignore` 默认加入 `build/`。
- 不改变 `stories/*/content/**`、Scene Card 或正文模板结构。

## 生成产物

- `--check` 不生成 `build/manuscript.md`、`build/reports/manuscript-report.json` 或 `build/manuscript.frontmatter.json`。
- 常规 compile 生成物路径保持为 `build/`，但新项目默认不会把它作为源文件提交。

## 验证

- 新增单测覆盖 `compileManuscript({ check: true })` 不落盘。
- 新增初始化单测覆盖 `.gitignore` 包含 `build/`。
- 更新 smoke 覆盖 `storyspec compile --check --json`。
