---
change_type: minor
scope: server,security,deploy,docs
---

# 多用户数据生命周期、自托管配置与安全回归

## CLI 行为

- 无新增用户命令；新增数据生命周期计划服务、自托管部署文件和安全回归测试。

## 模板契约

- 无用户可见模板契约变化。

## 生成产物

- 新增项目快照、导出和删除计划服务，删除只产出计划和审计，不直接删除磁盘文件。
- 新增 `docker-compose.yml`、`.env.example` 和自托管部署说明。
- 新增 multiuser security regression 测试。

## 验证

- `npx vitest run tests/unit/multiuser-project-lifecycle.test.ts tests/security/multiuser-security.test.ts`
- `npm run build`
