# add-collaboration-comment-thread-api

## 背景

协作正典已有 proposal、review、patch、apply request 和只读审阅面板，但“评论审批 UI”仍缺少可持久化的评论线程 API。没有评论线程，审稿者只能提交最终审批，无法围绕候选内容讨论、留证据或要求修改。

## 目标

- 为 proposal 增加评论线程创建和读取能力。
- 将评论线程持久化到 PostgreSQL repository。
- 提供 proposal scoped HTTP API，保证评论不会直接写入正典。

## 非目标

- 不实现行内富文本批注 UI。
- 不实现通知、提及或实时 presence。
- 不实现真实 apply executor。

## 影响范围

- `src/server/collaboration/canon-merge.ts`
- `src/server/db/schema.ts`
- `src/server/db/repositories.ts`
- `src/server/http/multiuser-server.ts`
- `tests/unit/*`
- `docs/tech/*`
