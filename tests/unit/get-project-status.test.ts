import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getProjectStatus,
  renderProjectStatus
} from '../../src/application/get-project-status.js';

const tempDirs: string[] = [];

const makeTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'novel-project-status-'));
  tempDirs.push(dir);
  return dir;
};

const createProjectFixture = async () => {
  const projectRoot = await makeTempDir();

  await mkdir(path.join(projectRoot, '.specify'), { recursive: true });
  await writeFile(path.join(projectRoot, '.specify', 'config.json'), JSON.stringify({
    name: 'status-demo',
    version: '0.8.0',
    method: 'three-act'
  }, null, 2));

  await mkdir(path.join(projectRoot, '.codex', 'prompts'), { recursive: true });
  await writeFile(path.join(projectRoot, 'AGENTS.md'), '# Agents');

  await mkdir(path.join(projectRoot, 'spec', 'tracking'), { recursive: true });
  await writeFile(path.join(projectRoot, 'spec', 'tracking', 'plot.json'), '{"valid":true}');
  await writeFile(path.join(projectRoot, 'spec', 'tracking', 'broken.json'), '{broken');

  const storyPath = path.join(projectRoot, 'stories', '001-demo');
  await mkdir(path.join(storyPath, 'content'), { recursive: true });
  await writeFile(path.join(storyPath, 'specification.md'), '- **版本**：v1');
  await writeFile(path.join(storyPath, 'creative-plan.md'), '版本: plan-v1');
  await writeFile(path.join(storyPath, 'tasks.md'), '- [ ] **T001** 起草第一章');
  await writeFile(path.join(storyPath, 'content', 'chapter-01.md'), '# 第一章\n\n一段正文。');

  return projectRoot;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

describe('getProjectStatus', () => {
  it('summarizes project, codex handoff files, story progress, tracking, and next actions', async () => {
    const projectRoot = await createProjectFixture();

    const status = await getProjectStatus(projectRoot);

    expect(status).toMatchObject({
      projectRoot,
      projectName: 'status-demo',
      version: '0.8.0',
      method: 'three-act',
      configuredAI: ['codex'],
      codex: {
        prompts: true,
        agentsFile: true
      },
      story: {
        name: '001-demo',
        hasSpecification: true,
        hasCreativePlan: true,
        hasTasks: true,
        specificationVersion: 'v1',
        creativePlanVersion: 'plan-v1',
        nextTask: 'T001 起草第一章',
        chapterFiles: 1,
        contentFiles: 1
      }
    });
    expect(status.tracking).toContainEqual({ file: 'plot.json', valid: true });
    expect(status.tracking.find(item => item.file === 'broken.json')).toMatchObject({
      valid: false
    });
    expect(status.nextActions).toContain('下一步任务：T001 起草第一章');
  });

  it('renders the common status model for CLI output', async () => {
    const projectRoot = await createProjectFixture();
    const status = await getProjectStatus(projectRoot);

    const output = renderProjectStatus(status);

    expect(output).toContain('Codex 项目状态');
    expect(output).toContain('项目：status-demo');
    expect(output).toContain('当前故事：001-demo');
    expect(output).toContain('追踪 JSON：存在错误');
    expect(output).toContain('建议下一步：');
  });
});
