---
change_type: minor
scope: cli,templates,workbench,docs,tests
---

# 抽象节奏配置

## CLI 行为

- 新增 `storyspec rhythm:init`，初始化 `spec/tracking/rhythm-config.json`。
- `rhythm-config.json` 固定为 `manual-abstract`，只记录章节长度、钩子频率、回报间隔、内容比例、张力模式和信息密度。
- `tension:chart` 会读取 rhythm config，并对钩子间隔、回报间隔和信息揭示密度输出 rhythm gap。

## 模板契约

- 新增 `templates/tracking/rhythm-config.json`。
- `/plan` 和 `/analyze` 改为读取 `spec/tracking/rhythm-config.json`，并强调借鉴结构，不借鉴表达、人物、桥段或专有设定。

## 生成产物

- 新项目会带有抽象 rhythm config 模板。
- 命令构建产物会同步包含 rhythm 配置相关提示。

## 验证

- `npm test -- tests/unit/manage-promises.test.ts`
