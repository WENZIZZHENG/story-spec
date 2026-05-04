## 1. 共享契约

- [ ] 1.1 冻结 `task:finish`、`tasks:set-status`、related draft 路径、验证 scope / severity、tracking evidence 的对外行为，确保后续实现只在这组契约内展开。
- [x] 1.2 明确 `completedNodes` 必须继续保持字符串数组，并把 `evidence` 视为旁路字段而不是类型替换。

## 2. CLI 与 finish 流程

- [x] 2.1 补齐发布产物中的 CLI help 可见性，确保 `task:finish` 和 `tasks:set-status` 在构建结果里可被发现。
  - May edit: `package.json`, `src/cli/**`, 构建与命令生成相关脚本
  - Must not edit: tracking schema, 写作验证规则
  - Depends on: 1.1
  - Validation: `npm run build` 后执行 `node dist/cli.js --help`

- [x] 2.2 扩展 finish 阶段的 related draft 匹配，覆盖 `content/chapter-*.md`、`content/volume*/chapter-*.md` 和短路径章节文件。
  - May edit: finish 任务解析、草稿发现和路径归一化相关模块
  - Must not edit: CLI help 产物检查、tracking schema
  - Depends on: 1.1
  - Validation: 针对 nested volume 和短路径样本各跑一次 finish 解析检查

- [x] 2.3 把任务验收、task board、正文与 tracking 的结果合并成单屏收尾报告。
  - May edit: finish 输出渲染、结果汇总和报告模型
  - Must not edit: tracking 的底层数据类型、命令别名
  - Depends on: 2.1, 2.2
  - Validation: 完成一次成功 finish，确认只输出一份收尾回执

## 3. 写作验证与 tracking

- [x] 3.1 为写作验证结果引入 scope / severity 分类，并把未开始任务输出缺失、planned foreshadowing、长文导入澄清映射到明确类别。
  - May edit: 验证规则、错误聚合、报告摘要
  - Must not edit: related draft 匹配逻辑、tracking schema 类型
  - Depends on: 1.1
  - Validation: 三类样本分别命中对应 scope / severity

- [x] 3.2 为 tracking 增加可选 `evidence` 字段，同时保留 `completedNodes` 字符串数组兼容性和迁移校验。
  - May edit: tracking schema、迁移脚本、校验器
  - Must not edit: `completedNodes` 的数组类型、finish 命令别名
  - Depends on: 1.2
  - Validation: 旧格式读写不报错，新格式能携带 evidence

## 4. 集成验证

- [x] 4.1 跑 `npm run build`、`node dist/cli.js --help`、相关 smoke 测试和 manifest 检查，确认 CLI 产物没有漂移。
- [x] 4.2 跑 OpenSpec 校验，确认本 change 的 proposal、design、tasks 和 specs 彼此一致。
- [ ] 4.3 用一轮端到端 dogfood 样例复核 finish 收尾报告、验证噪音分层和 tracking 回写闭环。
