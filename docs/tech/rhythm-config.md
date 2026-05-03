# Rhythm Config

## 目标

`spec/tracking/rhythm-config.json` 用来记录作者手工输入的抽象节奏参数，帮助 `/plan` 和 `tension:chart` 对齐章节长度、钩子频率、回报间隔、信息密度和张力模式。

## 边界

- 只记录结构参数，不保存参考作品正文。
- 不抓取、解析或导入受版权保护文本。
- 不生成参考作品的人物、桥段、专有设定或表达。
- 参考作品只能被作者人工抽象为节奏、结构和信息密度。

## 字段

- `sourceMode`：固定为 `manual-abstract`。
- `averageChapterLength`：章节长度范围和目标值。
- `hookFrequency.everyChapters`：目标钩子或高张力点间隔。
- `payoffInterval.everyChapters`：目标阶段回报间隔。
- `dialogueActionDescriptionRatio`：对话、动作、描写的抽象比例。
- `tensionPattern`：作者偏好的张力节奏标签。
- `infoRevealDensity.targetPerChapter`：每章目标信息揭示密度。

## 使用方式

- 运行 `storyspec rhythm:init` 创建本地配置。
- 运行 `storyspec tension:chart` 查看张力曲线和 rhythm gap。
- 在 `/plan` 中引用 rhythm config 作为节奏约束，而不是剧情或表达来源。
