---
change_type: patch
scope: docs,tests
---

# README 高频命令去重与事实边界巡检

## CLI 行为

- 无 CLI 行为变化。

## 模板契约

- 无 command template 语义变化。

## 生成产物

- README 高频命令表去掉重复的 `storyspec server` 和 `storyspec reference:reverse` 行。
- README 保持 `storyspec app` 为实验性本机工作台、`storyspec server` 为实验性多用户控制平面基础，不把账号、云端、完整 SaaS、真实 worker、数据库全量接入或富文本编辑器写成已完成能力。
- 新增 README 文档回归测试，检查高频命令唯一性和 App/Server 边界措辞。

## 验证

- `npx openspec validate dedupe-readme-command-fact-boundaries --strict --json --no-interactive`
- `npx vitest run tests/unit/readme-fact-boundaries.test.ts`
