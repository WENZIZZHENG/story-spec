import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  addResearchSource,
  checkResearch,
  linkResearchCitation,
  listResearchSources
} from '../../src/application/manage-research.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-research');
  const fileSystem = new MemoryFileSystem(projectRoot);

  await fileSystem.writeFile(path.join(projectRoot, 'spec', 'world', 'rules.yaml'), 'facts: []');

  return { projectRoot, fileSystem };
};

describe('manage research', () => {
  it('adds local personal notes and stores source metadata', async () => {
    const fixture = await createProject();

    const added = await addResearchSource({
      ...fixture,
      title: '朝代制度笔记',
      type: 'personal-note',
      note: '官制参考与世界观设定分开记录。'
    });

    expect(added.source.id).toBe('source.朝代制度笔记');
    expect(added.source.path).toBe('research/notes/朝代制度笔记.md');
    expect(added.notePath).toContain(path.join('research', 'notes'));
    await expect(fixture.fileSystem.readFile(added.notePath!)).resolves.toContain('官制参考');

    const listed = await listResearchSources(fixture);
    expect(listed.sources.map(source => source.id)).toEqual(['source.朝代制度笔记']);
    expect(listed.issues).toEqual([]);
  });

  it('links citations and validates local targets', async () => {
    const fixture = await createProject();
    const added = await addResearchSource({
      ...fixture,
      title: '朝代制度笔记',
      type: 'personal-note'
    });

    const linked = await linkResearchCitation({
      ...fixture,
      sourceId: added.source.id,
      targetPath: 'spec/world/rules.yaml',
      targetId: 'world.government',
      reason: '支撑官制设定'
    });

    expect(linked.link).toMatchObject({
      sourceId: 'source.朝代制度笔记',
      targetPath: 'spec/world/rules.yaml',
      targetId: 'world.government'
    });

    const checked = await checkResearch(fixture);
    expect(checked.valid).toBe(true);
    expect(checked.issues).toEqual([]);
  });

  it('reports broken source and citation references', async () => {
    const fixture = await createProject();
    await fixture.fileSystem.writeJson(path.join(fixture.projectRoot, 'research', 'sources', 'sources.json'), {
      schemaVersion: '1.0',
      sources: [{
        id: 'source.missing-file',
        title: '缺文件资料',
        type: 'book',
        path: 'research/sources/missing.md',
        notes: []
      }]
    });
    await fixture.fileSystem.writeJson(path.join(fixture.projectRoot, 'research', 'citations.json'), {
      schemaVersion: '1.0',
      links: [{
        sourceId: 'source.unknown',
        targetPath: 'spec/world/missing.yaml',
        reason: '错误引用'
      }]
    });

    const checked = await checkResearch(fixture);

    expect(checked.valid).toBe(false);
    expect(checked.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'INVALID_RESEARCH_SOURCE', severity: 'warning' }),
      expect.objectContaining({ code: 'MISSING_CITATION_SOURCE', severity: 'error' }),
      expect.objectContaining({ code: 'MISSING_CITATION_TARGET', severity: 'warning' })
    ]));
  });
});
