## Context

StorySpec dogfood 暴露的核心问题，不是单点功能缺失，而是 finish 收尾链路断裂：命令可在源码中存在，但发布产物的 help 不一定可用；相关草稿的路径匹配过窄；验证噪音没有按严重性分层；tracking 记录又需要兼容旧脚本对 `completedNodes` 字符串数组的期待。

这次变更面向作者收尾体验与内部数据契约两端，必须同时解决可见命令、章节关联、验证语义、tracking 迁移和最终报告的一致性。

## Goals / Non-Goals

**Goals:**
- 让发布后的 CLI help 能稳定暴露 `task:finish` 和 `tasks:set-status`。
- 让 finish 能识别嵌套 volume 路径和短路径章节草稿。
- 让验证结果按 scope / severity 区分阻断、提示和信息噪音。
- 让 tracking 增加 `evidence` 而不破坏 `completedNodes` 旧格式。
- 让 finish 产出一个单屏收尾报告，覆盖任务、task board、正文和 tracking。

**Non-Goals:**
- 不重做整个 CLI 命令体系。
- 不改变 `completedNodes` 的类型。
- 不引入新的正文生成模型或新的写作工作流。
- 不把这次变更扩成通用审计系统。

## Decisions

1. **把发布产物和 help 作为一等验收对象。**  
   选择对 `dist/cli.js --help` 做持续验收，而不是只验证源码命令存在。这样可以直接覆盖这次暴露出来的“源码可用、产物不可用”漂移。  
   备选方案是仅做单元测试，但它无法阻止打包后帮助信息失真。

2. **使用宽松但确定性的 chapter 路径归一化。**  
   finish 阶段接受嵌套 volume 目录和短路径章节文件，再在内部归一化为同一类相关草稿。这样可以覆盖 `content/chapter-*.md`、`content/volume*/chapter-*.md` 和短路径输入。  
   备选方案是继续维持单一路径模式，但会持续漏抓真实草稿。

3. **把验证噪音拆成 scope 与 severity 两个维度。**  
   scope 负责说明“属于哪一类问题”，severity 负责说明“会不会阻断 finish”。未开始任务输出缺失、planned foreshadowing、长文导入澄清必须能被区分，而不是只看一条笼统的错误字符串。  
   备选方案是增加一个简单的布尔噪音标记，但它无法支持后续报告和过滤。

4. **保持 `completedNodes` 兼容，新增 `evidence` 旁路字段。**  
   旧脚本继续读取字符串数组，新能力把证据放在独立字段里。这样能避免对现有消费者做破坏性升级。  
   备选方案是把节点升级成对象数组，但会直接破坏旧消费方。

5. **finish 只输出一屏收尾报告。**  
   任务验收、task board、正文和 tracking 的结果合并到一个连续回执中，避免用户在多个输出块之间来回跳转。  
   备选方案是拆成多个阶段输出，但会让 dogfood 的结束动作更碎。

## Risks / Trade-offs

- [路径归一化误判] → 通过严格限定章节命名模式和 active task 上下文降低误匹配概率。
- [验证分类过细导致维护负担] → 只保留能直接影响 finish 体验的 scope / severity 类别。
- [tracking 迁移遗漏旧数据] → 维持 `completedNodes` 原样读取，并让 `evidence` 默认可选。
- [收尾报告过长] → 只保留四个固定区域，不引入额外叙述段。

## Migration Plan

先落地新的验证分类和 tracking 兼容读取，再补写回路径和收尾报告，最后用构建、help 和 OpenSpec 校验把产物漂移压住。若需要回滚，保留旧 `completedNodes` 读取路径即可，`evidence` 可以在不影响旧数据的前提下停用。

## Open Questions

- `evidence` 的最小字段集合是否需要在后续 change 中进一步标准化。
- 收尾报告里是否需要额外保留失败原因的机器可读摘要。
