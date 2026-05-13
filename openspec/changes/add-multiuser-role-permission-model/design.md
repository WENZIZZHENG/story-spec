## Role Model

第一版多人平台把 `Project` 作为权限根对象，暂不新增复杂 workspace/team 表。产品语言保留“工作区/团队入口”，但运行时权限先落在项目成员关系上。

角色：

- `owner`：项目拥有者和最终确认人，可管理成员、导出、删除、运行 job，并可在二次确认后 apply 正典或发布章节。
- `editor`：协助整理草稿、候选和任务，可评论、创建候选、运行 agent job、复核正典，但不能确认高影响写入。
- `reviewer`：审稿和正典一致性复核者，可查看、评论、创建候选和复核正典，不能运行 job 或写入正式故事。
- `viewer`：只读成员，只能查看项目、故事和章节。
- `agent`：机器执行身份，只能提交候选、预览和日志，不能管理成员、导出、删除或 apply 正典。

`member` 不再作为新权限模型的产品角色；旧归档文档中出现的 `owner/member` 只代表历史第一版控制面。

## Permission Decisions

权限动作按产品对象分组：项目、故事、章节、候选、评论、正典、agent job、导出删除和成员管理。权限决策使用与 API contract 一致的状态语言：

- `allowed`：可直接执行。
- `requires-confirmation`：当前角色有资格发起，但必须进入 Preview / Confirm / Apply 或二次确认。
- `denied`：当前角色无权执行。
- `disabled`：动作暂不开放或受流程阻塞。

高影响动作包括 `apply-canon-change`、`publish-chapter`、`export-project`、`delete-project` 和 `manage-members`；即使 `owner` 可执行，也必须暴露 `requiresConfirmation=true`，让 UI 和 server 不会把高影响写入当作普通按钮。

## Server Integration

`requireProjectAccess()` 继续先校验 session 和 membership，再可选校验 `requiredAction`。读取类 endpoint 可以只要求 membership；写入、job、成员、导出和删除类 endpoint 后续必须传入具体 action。

为了不把当前 P1-1 扩成完整 ACL 系统，本变更不新增 story/chapter permission 表。未来如果需要故事或章节级例外权限，应在独立 OpenSpec 中扩展 `ProjectMembership` 或新增 scope membership。
