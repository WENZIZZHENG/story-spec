import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkWritingState,
  countNarrativeChars,
  renderWritingStateChecklist
} from '../../src/application/check-writing-state.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createWritingStateFixture = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-writing-state');
  const fileSystem = new MemoryFileSystem(projectRoot);
  const storyRoot = path.join(projectRoot, 'stories', 'demo');

  await fileSystem.writeFile(path.join(projectRoot, '.specify', 'memory', 'writing-constitution.md'), '# constitution');
  await fileSystem.writeFile(path.join(storyRoot, 'specification.md'), '# spec');
  await fileSystem.writeFile(path.join(storyRoot, 'creative-plan.md'), '# plan');
  await fileSystem.writeFile(path.join(storyRoot, 'tasks.md'), `- [ ] [P0] **T001** - 第一章
  - **输出**：\`content/chapter-001.md\`
- [~] [P1] **T002** - 第二章
  - **输出**：\`content/chapter-002.md\`
- [x] [P2] **T003** - 第三章
  - **输出**：\`content/chapter-003.md\`
`);
  await fileSystem.writeFile(path.join(storyRoot, 'content', 'chapter-001.md'), '# 第一章\n\n正文正文正文');
  await fileSystem.writeFile(path.join(storyRoot, 'content', 'chapter-002.md'), '短');
  await fileSystem.writeFile(path.join(storyRoot, 'scenes', 'scene-001.yaml'), `id: scene-001
chapter: chapter-001
order: 1
pov: 主角
location: 起点
time: 清晨
sceneGoal: 主角做出选择
conflict: 旧规则阻拦
outcome: 主角接受代价
plotThread: 主线推进
readerPromise: 建立许可制度谜题
relationshipChange: 主角和伙伴建立最低限度信任
worldReveal:
  factId: world.rule
  actionImpact: 主角必须绕开许可
  beneficiaries:
    - 管理者
  costs:
    - 主角
  violationConsequence: 被追捕
emotionalBeat: 从戒备转向决意
endingHook: 城门外出现寂静异象
successCriteria:
  - 主角主动选择
  - 读者看到规则代价
`);

  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'tracking', 'good.json'), '{"ok":true}');
  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'tracking', 'bad.json'), '{bad');

  return { projectRoot, fileSystem };
};

describe('checkWritingState', () => {
  it('counts narrative characters without markdown noise', () => {
    expect(countNarrativeChars('# 标题\n\n正文 `code`\n- 项')).toBe(5);
  });

  it('scans documents, task progress, content word counts, and tracking JSON', async () => {
    const { projectRoot, fileSystem } = await createWritingStateFixture();

    const state = await checkWritingState({
      projectRoot,
      fileSystem,
      wordRange: { min: 4, max: 10 }
    });

    expect(state.story).toMatchObject({
      name: 'demo',
      path: path.join(projectRoot, 'stories', 'demo')
    });
    expect(state.documents).toEqual({
      constitution: true,
      specification: true,
      creativePlan: true,
      tasks: true
    });
    expect(state.tasks).toMatchObject({
      total: 3,
      pending: 1,
      inProgress: 1,
      completed: 1,
      completionRate: 33,
      nextTask: 'T001 - 第一章'
    });
    expect(state.content).toMatchObject({
      chapterCount: 2,
      badChapterCount: 1,
      totalChars: 10
    });
    expect(state.sceneGate).toMatchObject({
      total: 1,
      ready: 1,
      missingIntent: 0,
      missingSceneCard: false
    });
    expect(state.tracking).toMatchObject({
      total: 2,
      valid: 1,
      invalid: 1
    });
    expect(state.canWrite).toBe(true);
  });

  it('renders a checklist-compatible report', async () => {
    const { projectRoot, fileSystem } = await createWritingStateFixture();
    const state = await checkWritingState({
      projectRoot,
      fileSystem,
      wordRange: { min: 4, max: 10 }
    });

    const checklist = renderWritingStateChecklist(state);

    expect(checklist).toContain('# 写作状态检查 Checklist');
    expect(checklist).toContain('- [x] CHK001 writing-constitution.md 存在');
    expect(checklist).toContain('- [x] CHK005 有进行中的任务（1 个）');
    expect(checklist).toContain('- [!] CHK009 字数符合标准（1 章不符合）');
    expect(checklist).toContain('- [!] CHK010 tracking JSON 有效（1 个错误）');
    expect(checklist).toContain('- [x] CHK011 Scene Card 写作门禁（1/1 ready）');
  });

  it('blocks writing when no scene card exists for a write-ready story', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-writing-state-missing-scene');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyRoot = path.join(projectRoot, 'stories', 'demo');

    await fileSystem.writeFile(path.join(projectRoot, '.specify', 'memory', 'writing-constitution.md'), '# constitution');
    await fileSystem.writeFile(path.join(storyRoot, 'specification.md'), '# spec');
    await fileSystem.writeFile(path.join(storyRoot, 'creative-plan.md'), '# plan');
    await fileSystem.writeFile(path.join(storyRoot, 'tasks.md'), `- [ ] [P0] [WRITE-READY] **T001** - 第一章
  - **输出**：\`content/chapter-001.md\`
`);

    const state = await checkWritingState({
      projectRoot,
      fileSystem
    });

    expect(state.canWrite).toBe(false);
    expect(state.sceneGate).toMatchObject({
      total: 0,
      ready: 0,
      missingSceneCard: true
    });
    expect(renderWritingStateChecklist(state)).toContain('先运行 storyspec scene:init 或补写 Scene Card preview');
  });

  it('points missing tasks to the agent tasking command and local board check', async () => {
    const projectRoot = path.join(os.tmpdir(), 'memory-novel-writing-state-missing-tasks');
    const fileSystem = new MemoryFileSystem(projectRoot);
    const storyRoot = path.join(projectRoot, 'stories', 'demo');

    await fileSystem.writeFile(path.join(projectRoot, '.specify', 'memory', 'writing-constitution.md'), '# constitution');
    await fileSystem.writeFile(path.join(storyRoot, 'specification.md'), '# spec');
    await fileSystem.writeFile(path.join(storyRoot, 'creative-plan.md'), '# plan');
    await fileSystem.writeFile(path.join(storyRoot, 'scenes', 'scene-001.yaml'), `id: scene-001
chapter: chapter-001
order: 1
pov: 主角
location: 起点
time: 清晨
sceneGoal: 主角做出选择
conflict: 旧规则阻拦
outcome: 主角接受代价
plotThread: 主线推进
readerPromise: 建立第一章谜题
relationshipChange: 主角和伙伴建立最低限度信任
worldReveal:
  factId: world.rule
  actionImpact: 主角必须绕开规则
  beneficiaries:
    - 管理者
  costs:
    - 主角
  violationConsequence: 被追捕
emotionalBeat: 从戒备转向决意
endingHook: 门外出现异常声音
successCriteria:
  - 主角主动接受任务
`);

    const state = await checkWritingState({
      projectRoot,
      fileSystem
    });
    const checklist = renderWritingStateChecklist(state);

    expect(state.canWrite).toBe(false);
    expect(state.documents.tasks).toBe(false);
    expect(checklist).toContain('/storyspec-tasks');
    expect(checklist).toContain('storyspec tasks:board demo');
  });
});
