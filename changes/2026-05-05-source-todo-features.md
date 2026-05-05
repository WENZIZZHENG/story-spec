---
change_type: minor
scope: cli,plugins,scripts,tests,openspec,docs,todo
---

# 补齐源码 TODO 功能

## CLI 行为

- 插件安装计划现在会校验 `dependencies.core`，支持 `>=`、`>`、`<=`、`<`、`=`、`^`、`~` 和裸版本表达式；不满足当前 StorySpec 版本时阻止安装。
- `plugins:add` 现在可解析内置插件名、本地插件目录和 `file://` 本地 URL；HTTP(S) 网络插件源会明确提示尚未支持。

## 模板契约

- 不修改 agent command 模板内容，不手工编辑 `dist/**`。
- 世界观检查继续只读取用户项目素材；显式地点引用需使用 `@地点:`、`地点:` 或 `位置:` 等可追踪标记。

## 生成产物

- `check-world.sh` 会从 `spec/knowledge/locations.md` 的二级标题提取已定义地点，并检查正文中的 `@地点:`、`地点:`、`位置:` 等显式地点引用是否已定义。
- 同步 `build:commands` 生成产物 manifest，确保各 agent 初始化脚本哈希更新。

## 文档与待办

- `todo-index.md` 已收口为当前无活跃路线，完成的作者首程与自用 dogfood 路线移入归档。
- `todo-archive.md` 增加作者首程引导、自用创作流程问题收口和本次源码 TODO 功能的完成证据。

## 验证

- `npx vitest run tests/unit/plugin-install-plan.test.ts`
- `npx vitest run tests/unit/check-world-script.test.ts`
- `npm run build`
- `npm run check:changes`
- `npm run check:command-manifest`
- `openspec validate finish-source-todo-features --strict`
- `npm run verify`
