import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { scanStoryArtifacts } from '../../src/validation/artifact-scanner.js';

const tempDirs: string[] = [];

const makeTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'novel-artifact-scanner-'));
  tempDirs.push(dir);
  return dir;
};

const writeFixtureFile = async (rootDir: string, relativePath: string, content: string) => {
  const targetPath = path.join(rootDir, relativePath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, content);
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('scanStoryArtifacts', () => {
  it('scans stories, tasks, content, and tracking health', async () => {
    const projectRoot = await makeTempDir();

    await writeFixtureFile(projectRoot, 'stories/ready/specification.md', '# spec');
    await writeFixtureFile(projectRoot, 'stories/ready/creative-plan.md', '# plan');
    await writeFixtureFile(projectRoot, 'stories/ready/tasks.md', `- [ ] [P0] **T001** - 第一章
  - **依赖**：无
  - **输出**：\`content/volume1/chapter-001.md\`
- [x] [P1] **T002** - 第二章
  - **依赖**：T001
  - **输出**：\`content/volume1/chapter-002.md\`
`);
    await writeFixtureFile(projectRoot, 'stories/ready/content/volume1/chapter-001.md', '# chapter 1');

    await writeFixtureFile(projectRoot, 'stories/missing/specification.md', '# spec only');
    await writeFixtureFile(projectRoot, 'stories/idea/idea.md', '# 初始灵感');
    await writeFixtureFile(projectRoot, 'stories/interviewing/clarifications.md', '# 澄清记录');

    await writeFixtureFile(projectRoot, 'spec/tracking/plot-tracker.json', '{"items": []}');
    await writeFixtureFile(projectRoot, 'spec/tracking/broken.json', '{bad json');

    const result = await scanStoryArtifacts({ projectRoot });

    expect(result.stories.map(story => story.name)).toEqual(['idea', 'interviewing', 'missing', 'ready']);
    const ready = result.stories.find(story => story.name === 'ready');
    expect(ready?.tasks.map(task => [task.id, task.status, task.outputs])).toEqual([
      ['T001', 'todo', ['content/volume1/chapter-001.md']],
      ['T002', 'done', ['content/volume1/chapter-002.md']]
    ]);
    expect(ready?.artifacts.find(artifact => artifact.path.endsWith('chapter-001.md'))).toMatchObject({
      kind: 'chapter',
      exists: true
    });
    expect(ready?.issues).toContainEqual({
      severity: 'warning',
      code: 'MISSING_TASK_OUTPUT',
      message: '任务 T002 的输出文件不存在: content/volume1/chapter-002.md',
      path: path.join(projectRoot, 'stories', 'ready', 'content', 'volume1', 'chapter-002.md')
    });

    const missing = result.stories.find(story => story.name === 'missing');
    expect(missing?.stage).toBe('specified');
    expect(missing?.issues.map(issue => [issue.code, issue.severity])).toEqual([
      ['MISSING_CREATIVE_PLAN', 'info']
    ]);

    const idea = result.stories.find(story => story.name === 'idea');
    expect(idea?.stage).toBe('idea');
    expect(idea?.issues.map(issue => issue.code)).not.toContain('MISSING_SPECIFICATION');
    expect(idea?.issues.map(issue => issue.code)).not.toContain('MISSING_CREATIVE_PLAN');
    expect(idea?.issues.map(issue => issue.code)).not.toContain('MISSING_TASKS');

    const interviewing = result.stories.find(story => story.name === 'interviewing');
    expect(interviewing?.stage).toBe('interviewing');
    expect(interviewing?.issues.map(issue => issue.code)).toEqual([]);

    expect(result.tracking.map(item => [item.file, item.valid])).toEqual([
      ['broken.json', false],
      ['plot-tracker.json', true]
    ]);
    expect(result.issues.map(issue => issue.code)).toContain('INVALID_TRACKING_JSON');
  });
});
