# 多用户数据库基础实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为多用户路线建立 PostgreSQL 元数据 schema、迁移骨架和 repository 适配层，作为后续 auth、project、job、audit、quota 的持久化底座。

**Architecture:** 先把数据库事实源拆成三层：`schema.ts` 描述表结构和字段，`migrations.ts` 负责可重复执行的初始化 SQL，`repositories/*` 负责把现有 foundation 的 repository 接口映射到数据库执行器。这样业务层继续依赖纯接口，不直接拼 SQL。

**Tech Stack:** TypeScript、Node.js、现有 Vitest、纯 SQL 迁移字符串、仓库现有多用户 foundation 接口。

---

### Task 1: 写数据库 schema 与迁移的失败测试

**Files:**
- Create: `tests/unit/multiuser-database.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';

describe('multiuser database foundation', () => {
  it('defines all core metadata tables and repeatable migration SQL', () => {
    // 断言 schema 表名、字段和 migration 语句
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/unit/multiuser-database.test.ts`
Expected: FAIL，因为 `src/server/db/*` 还不存在。

### Task 2: 实现 schema 与迁移骨架

**Files:**
- Create: `src/server/db/schema.ts`
- Create: `src/server/db/migrations.ts`

- [ ] **Step 1: 写最小实现**

```ts
export const MULTIUSER_TABLES = { /* users, sessions, projects, memberships, agent_jobs, audit_logs, quota_buckets */ };
export const MULTIUSER_MIGRATION_VERSION = 1;
export const createMultiuserMigrationPlan = () => ({ /* repeatable SQL */ });
```

- [ ] **Step 2: 运行测试验证通过**

Run: `npx vitest run tests/unit/multiuser-database.test.ts`
Expected: PASS。

### Task 3: 增加 repository 适配层

**Files:**
- Create: `src/server/db/repositories.ts`
- Modify: `src/server/auth/session.ts`, `src/server/projects/project-security.ts`, `src/server/jobs/agent-job.ts`, `src/server/audit/audit-log.ts`, `src/server/quota/quota.ts`（只做类型接线或导出，不改语义）

- [ ] **Step 1: 写接口级测试**

```ts
// 用假的 executor 验证 repository SQL 映射和字段名
```

- [ ] **Step 2: 实现最小 repository factory**

```ts
export interface MultiuserDatabaseExecutor { /* execute/query */ }
```

- [ ] **Step 3: 运行测试和 build**

Run: `npm run build && npx vitest run tests/unit/multiuser-database.test.ts`
Expected: PASS。

### Task 4: 收口 changeset、todo 与验证

**Files:**
- Add: `changes/2026-05-08-multiuser-database-foundation.md`
- Modify: `docs/tech/app-multiuser-roadmap.md`
- Modify: `docs/tech/app-multiuser-development-tasks.md`
- Modify: `docs/tech/todo-index.md`

- [ ] **Step 1: 更新文档与 changeset**
- [ ] **Step 2: 运行 `npm run check:changes && git diff --check`**

### Task 5: 最终校验

- [ ] `npx openspec validate add-multiuser-database-foundation --strict --json --no-interactive`
- [ ] `npm run build`
- [ ] `npm run check:changes`
- [ ] `git diff --check`
