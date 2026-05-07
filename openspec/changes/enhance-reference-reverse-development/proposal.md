## Why

`storyspec reference:reverse` 第一版已经能把作者提供的参考作品笔记拆成 preview-only 的原创化候选，但输出层级还偏粗。作者真正需要的是：先看清自己喜欢什么、哪些东西不能照搬、这些吸引力可以怎样原创化，以及原作让人不适或断更后，自己的新故事要兑现哪些读者承诺、修复哪些方向。

本变更增强反向拆解的结构化预览，让它更适合后续原创开发，同时继续保持离线、preview-only 和不写入正典的边界。

## What Changes

- 增强 `reference:reverse` 应用层结果，补充结构吸引力、读者承诺、修复方向和原创化指南。
- 文本渲染和 JSON 输出同步展示这些字段，帮助作者区分“喜欢什么”“不能照搬什么”“可以怎么原创化”。
- 保持现有命令、输入方式和 `written: false` 语义，不新增网络抓取、原文下载、正典写入或续写正文生成。
- 同步 README、changeset、待办路线和归档记录。

## Capabilities

### Changed Capabilities

- `reference-reverse-development`: 增强参考作品反向拆解到原创开发之间的预览层。

## Non-goals

- 不抓取、下载、解析或复述参考作品全文。
- 不生成未授权原作续写正文。
- 不把原作角色、地名、势力名、术语、剧情线或关键反转写入 world/canon/spec/content。
- 不新增 apply 写入流程；本次只增强 preview 输出。

## Impact

影响范围包括 `src/application/reverse-reference.ts`、相关 unit / smoke 测试、README、changeset 和技术待办文档。不修改 `dist/`，不引入运行时依赖。
