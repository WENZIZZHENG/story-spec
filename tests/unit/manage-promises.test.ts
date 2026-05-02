import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  chartTension,
  checkPromises,
  listPromises
} from '../../src/application/manage-promises.js';
import { MemoryFileSystem } from '../helpers/memory-file-system.js';

const createProject = async () => {
  const projectRoot = path.join(os.tmpdir(), 'memory-novel-promises');
  const fileSystem = new MemoryFileSystem(projectRoot);

  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'tracking', 'promises.json'), {
    promises: [
      {
        id: 'promise.identity',
        type: 'mystery',
        promise: '主角身份谜题',
        establishedAt: 'chapter-001',
        reinforcedAt: [],
        status: 'open',
        readerExpectation: '读者期待身份揭示'
      },
      {
        id: 'promise.payoff',
        type: 'revenge',
        promise: '复仇线阶段回报',
        establishedAt: 'chapter-002',
        reinforcedAt: [],
        status: 'paid-off',
        readerExpectation: '读者期待复仇兑现'
      },
      {
        id: 'promise.repeat',
        type: 'romance',
        promise: '感情线误会',
        establishedAt: 'chapter-003',
        reinforcedAt: ['chapter-004', 'chapter-006', 'chapter-008'],
        status: 'reinforced',
        readerExpectation: '读者期待关系变化'
      }
    ]
  });
  await fileSystem.writeJson(path.join(projectRoot, 'spec', 'tracking', 'tension-curve.json'), {
    tensionPoints: [
      {
        chapter: 'chapter-001',
        scene: 'scene-001',
        tension: 2,
        emotionalCharge: 2,
        informationGain: 2,
        payoff: 2
      },
      {
        chapter: 'chapter-002',
        tension: 3,
        emotionalCharge: 2,
        informationGain: 1,
        payoff: 2
      },
      {
        chapter: 'chapter-003',
        tension: 1,
        emotionalCharge: 3,
        informationGain: 2,
        payoff: 1
      },
      {
        chapter: 'chapter-020',
        scene: 'scene-020',
        tension: 8,
        emotionalCharge: 7,
        informationGain: 3,
        payoff: 1
      }
    ]
  });

  return { projectRoot, fileSystem };
};

describe('manage promises', () => {
  it('lists promises from tracking document', async () => {
    const fixture = await createProject();

    const listed = await listPromises(fixture);

    expect(listed.promises.map(promise => promise.id)).toEqual([
      'promise.identity',
      'promise.payoff',
      'promise.repeat'
    ]);
    expect(listed.issues).toEqual([]);
  });

  it('checks open promises, missing payoff evidence, repeated setup, and tension gaps', async () => {
    const fixture = await createProject();

    const checked = await checkPromises(fixture);

    expect(checked.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'PROMISE_OPEN_TOO_LONG', severity: 'warning' }),
      expect.objectContaining({ code: 'PROMISE_PAYOFF_MISSING_EVIDENCE', severity: 'error' }),
      expect.objectContaining({ code: 'PROMISE_REPEATED_WITHOUT_PROGRESS', severity: 'warning' }),
      expect.objectContaining({ code: 'TENSION_PAYOFF_GAP', severity: 'warning' }),
      expect.objectContaining({ code: 'TENSION_LONG_FLATLINE', severity: 'info' })
    ]));
    expect(checked.taskDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        task_title: expect.stringContaining('PROMISE_OPEN_TOO_LONG'),
        sourceFinding: 'reader:PROMISE_OPEN_TOO_LONG'
      })
    ]));
  });

  it('renders a markdown tension chart table', async () => {
    const fixture = await createProject();

    const chart = await chartTension(fixture);

    expect(chart.points).toHaveLength(4);
    expect(chart.markdown).toContain('| Chapter | Scene | Tension | Emotion | Info | Payoff |');
    expect(chart.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'TENSION_PAYOFF_GAP' })
    ]));
  });
});
