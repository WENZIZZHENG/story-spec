# improve-first-run-onboarding 提案

## Why

StorySpec 已有 `init`、`story:new`、`ingest`、`co:create`、`next`、`preview/apply` 等能力，但真实首程 dogfood 暴露出一个更基础的问题：新作者进入系统时，不一定知道自己先要给工作区路径、贴长文资料、写一句灵感、回答访谈，还是学习命令。

当前体验容易先展示命令或进入创作步骤，导致三类摩擦：

- 未在 StorySpec 工作区时，agent 可能先解释命令，而不是先拿到小说工作区路径并直接初始化。
- 作者贴入原始灵感、长文资料或 Markdown 表格后，缺少示例、推荐字数、核心要点清单和“待澄清不是失败”的解释。
- 新手一开始看到命令清单会懵，需要先用自然语言入口表达“我现在有什么素材”，再由 agent/CLI 映射到具体命令。

本 change 的目标是把第一次使用从“先学命令”改成“先确认工作区，再根据手里的素材带路”，同时继续遵守 StorySpec 的创作控制权原则：preview / confirm / apply 不可跳过，AI 候选不得自动写入正典。

## What

- 增加工作区 preflight 行为契约：非 StorySpec 工作区时，先询问工作区路径；拿到路径后由 agent 或 CLI 协议直接初始化；初始化完成后进入素材分流，而不是展示完整命令清单。
- 增加素材输入 onboarding 契约：区分长文资料、一句灵感、随便聊聊、表格资料；提供可复制示例、推荐字数范围、核心要点清单和保守导入说明。
- 增加少命令化导航契约：首屏优先展示自然语言入口，命令放在次级 copyable command 区域；`--json` 保留机器可读 action，便于 agent/UI 自动执行。
- 强化确认流边界：吸收、预览、导航和表格导入可以生成候选与待确认项，但不得自动确认候选或绕过 preview / confirm / apply。

## Capabilities

### workspace-preflight

在任何创作入口前确认当前目录是否为 StorySpec 工作区。若不是，系统必须优先让用户指定小说工作区路径，并在用户给出路径后直接初始化。

### source-material-onboarding

根据用户现有素材提供低负担入口、输入示例、推荐范围和导入结果解释。长文、短灵感、随便聊聊和 Markdown 表格都有明确路径。

### low-command-navigation

新手导航先以自然语言表达可选下一步，再提供可复制命令。高级用户仍可直接使用 CLI，agent 和 UI 可通过 JSON action 执行。

## Impact

- 受影响范围：CLI 首程提示、agent prompt/contract、onboarding 文案、ingest/co-create 输出、`next` 导航输出、相关 snapshot/smoke。
- 不直接修改：源码、README、agent guide、命令模板或 tests。本 change 仅定义 OpenSpec artifacts，后续 implementation change 按 tasks 执行。
- 非目标：不开发 GUI，不删除高级命令，不自动猜测用户未指定的工作区，不降低正典确认门槛，不因为资料看起来可信就自动 apply 候选。
