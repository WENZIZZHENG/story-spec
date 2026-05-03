---
change_type: minor
scope: docs,templates
---

# 同步共创访谈文档流程

## CLI 行为

- 记录 README 推荐流程：`story:new` 后先进入 `interview` / `clarify` 和 `creative:report`，再分别预览规格与创作计划。
- 说明 `storyspec preview plan` 用于生成 `creative-plan.md` 写入预览，默认不直接替作者定稿。
- 说明 `storyspec apply --draft` 仅用于探索性计划草案，且必须保留 `[需要澄清]`。

## 模板契约

- `/clarify` 优先围绕主角、核心伙伴、第一舞台、能力体系、势力冲突、长线威胁、阅读承诺、成功路线和作品声音做访谈。
- `/specify` 的低信息量保护新增成功路线、作品声音、能力失败代价和第一舞台压迫等核心要素。
- `/plan` 进入写入门禁：未确认 AI 候选不能进入正典计划，缺失核心要素必须保留 `[需要澄清]`。

## 生成产物

- README 明确 `creative-plan.md` 应由计划预览确认后生成。
- 澄清问题包贡献规范新增共创访谈覆盖要求和问题分叉要求。

## 验证

- 需要运行 `npm run build:commands` 和 `npm run check:command-manifest`，确认命令模板生成链路稳定。
- 需要运行 `npm run check:changes`，确认本 changeset 被识别。
