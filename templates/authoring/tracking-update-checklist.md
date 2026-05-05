# 追踪回填清单模板

> 使用方式：复制到 `stories/<故事名>/tracking-update-checklist.md`，在每次正文或重要修订后勾查。清单帮助回填，不替代作者确认。

## 正文完成后先确认

- [ ] 本次新增事实是否已经出现在正文，或由作者明确确认。
- [ ] 候选规划、下一章想法和 agent 建议没有被写入 canon。
- [ ] 章节任务状态只标记实际完成的任务。
- [ ] 如果关系、能力或世界规则发生变化，已记录证据路径。

## 结构化追踪

- [ ] `spec/tracking/plot-tracker.json`：新增或完成的情节点、下一步节点、证据路径。
- [ ] `spec/tracking/timeline.json`：时间、地点、顺序和章节证据。
- [ ] `spec/tracking/character-state.json`：人物状态、能力边界、伤势、资源、目标变化。
- [ ] `spec/tracking/relationships.json`：关系强度、信任变化、冲突变化、证据路径。
- [ ] `spec/tracking/promises.json`：新承诺、轻触承诺、兑现承诺和仍开放承诺。
- [ ] `spec/canon/facts.json`：只写正文已发生或作者明确确认的正典事实。
- [ ] `spec/graph/entities.json`：新增人物、地点、势力、物件等实体。
- [ ] `spec/graph/edges.json`：新增关系边，必须带证据路径。

## 可读知识库

- [ ] `spec/knowledge/character-profiles.md`：同步重要人物状态，但不要复制整章正文。
- [ ] `spec/knowledge/world-setting.md`：同步已确认世界规则、地点、势力和生产关系。
- [ ] `stories/<故事名>/story-dashboard.md`：更新当前状态、下一步和风险清单。
- [ ] `stories/<故事名>/open-promises.md`：更新开放承诺优先级。
- [ ] `stories/<故事名>/tasks.md`：更新任务状态和下一步。
- [ ] `stories/<故事名>/handoff.md`：如果生成过 handoff，完成后刷新。

## 验证

```powershell
storyspec validate
```

```powershell
powershell -ExecutionPolicy Bypass -File .specify/scripts/powershell/validate-local.ps1
```

```bash
bash .specify/scripts/bash/validate-local.sh
```

## 记录无法验证项

- 自动验证无法覆盖：`<填写>`
- 需要作者确认：`<填写>`
- 下一次必须先读：`<填写>`
