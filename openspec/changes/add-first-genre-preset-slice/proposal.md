## Why

StorySpec 已有 genre preset 安装、doctor 和 manifest 校验底座，但当前内置类型包只有 `xuanhuan-cultivation`。生态路线的 P1-1 需要先完成一个新增类型 preset 的垂直切片，验证“新增类型包资产 -> preset:list 可发现 -> preset:add 可安装 -> preset:doctor/validate 可通过”的完整闭环。

## What Changes

- 新增内置 `mystery` 类型 preset，提供推理/悬疑故事需要的 manifest、命令增强提示、世界观模板和 reviewer config。
- `mystery` preset 声明线索规则、公平性边界、嫌疑关系等 requiredWorldFacts，并保持安装不覆盖作者已有内容。
- 更新 preset 单测和 CLI smoke，确保 `mystery` 可被发现、安装、doctor 校验和项目 validate。
- 同步命令文档、changeset 和生态路线状态。

## Impact

影响内置 `presets/` 资产、preset manifest 测试、preset CLI smoke、命令文档、changeset、生态路线和待办入口。第一版不修改 preset 安装架构，不接入远程 marketplace，不把类型包变成自动剧情生成器。

## Capabilities

- `genre-preset-mystery`
