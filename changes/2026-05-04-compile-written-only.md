---
change_type: patch
scope: cli,application,tests
---

# Compile 已写章节模式

## CLI 行为

- `storyspec compile` 新增 `--written-only`，只编译已存在正文。
- `--written-only` 不会把未来 Scene Card 指向但尚未写出的章节当作 `MISSING_CHAPTER_FILE` warning。
- 默认全量 `compile` 行为不变，仍会报告 Scene Card 指向的缺失章节。

## 模板契约

- 不修改 Scene Card 或正文模板。

## 生成产物

- `--written-only` 仍写入既有 `build/manuscript.md` 与 `build/reports/manuscript-report.json`。
- 本批不新增新的生成目录。

## 验证

- 新增 `tests/unit/compile-manuscript.test.ts` 覆盖 written-only 无未来章节 warning。
- 更新 `tests/smoke/cli-commands.test.ts` 覆盖 CLI `compile --written-only --json`。
