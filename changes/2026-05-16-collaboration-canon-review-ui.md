---
change_type: minor
scope: app,collaboration,multiuser
---

# 协作正典审阅 UI 首批切片

## 背景

协作正典协议、只读审阅面板、评论线程、项目活动流、apply executor 和 rollback executor 已完成首批后端底座，但本机 App shell 还缺少一个可复用的审阅台 UI contract 来说明 proposal、审批、patch、apply request、评论和活动流如何进入完整 App。

## 变化

- 新增完整 App 前端架构中的 `collaborationCanonReview` contract，定义协作正典审阅台的 proposal、审批、patch、apply request、评论线程和活动流状态列。
- 把 canon review、proposal、评论、审批、patch、apply request、apply execution、rollback execution 和项目活动流端点接入本机 shell 的 API 地图，并标注 read-only、preview 和 apply-confirmed 边界。
- 在 `storyspec app` 本机工作室的“候选与正典”区域展示协作正典审阅台、项目 / 故事 ID 占位、状态语言和作者二次确认说明。
- 该变更不实现独立前端项目、实时协作、通知或富文本评论 UI；真实评论、审批、apply 和 rollback 仍由 `storyspec server` 权限与审计保护。

## CLI 行为

`storyspec app` 渲染的本机 Web shell 新增协作正典审阅台 contract 展示；没有新增 CLI 参数或命令。

## 模板契约

无模板契约变化。

## 生成产物

无生成产物变化，未修改 `dist/**`。

## 验证

- `npx openspec validate add-collaboration-canon-review-ui-slice --strict --json --no-interactive`
- `npx vitest run tests/unit/app-frontend-architecture.test.ts tests/unit/local-app-html.test.ts`
- `npm run build`
- `npm run check:changes`
- `git diff --check`
