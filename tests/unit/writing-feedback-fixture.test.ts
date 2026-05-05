import { describe, expect, it } from 'vitest';
import feedbackFixture from '../fixtures/writing-feedback/author-first-chapter-feedback.json' with { type: 'json' };

describe('writing feedback dogfood fixture', () => {
  it('captures the author-first chapter feedback contract as plan, write, and finish snapshots', () => {
    expect(feedbackFixture.stages.map(stage => stage.stage)).toEqual(['plan', 'write', 'finish']);
    expect(feedbackFixture.humanSummary.length).toBeLessThanOrEqual(6);
    expect(JSON.stringify(feedbackFixture.stages)).toContain('"stage":"plan"');

    const plan = feedbackFixture.stages.find(stage => stage.stage === 'plan');
    expect(plan?.sceneBeats.length).toBeGreaterThanOrEqual(3);
    expect(plan?.sceneBeats.length).toBeLessThanOrEqual(6);
    expect(plan?.sceneBeats.every(beat =>
      beat.goal
      && beat.conflict
      && beat.characterChange
      && beat.sceneLimit
      && beat.riskOrGap
    )).toBe(true);

    const write = feedbackFixture.stages.find(stage => stage.stage === 'write');
    expect(write?.blocks.length).toBeGreaterThanOrEqual(1);
    expect(write?.blocks[0]).toEqual(expect.objectContaining({
      targetPath: expect.stringContaining('stories/法术编译纪元/content/volume1/chapter-001.md'),
      progress: expect.stringContaining('剧情功能'),
      nextTarget: expect.any(String)
    }));

    const finish = feedbackFixture.stages.find(stage => stage.stage === 'finish');
    expect(finish).toEqual(expect.objectContaining({
      draftPath: 'stories/法术编译纪元/content/volume1/chapter-001.md',
      nextAction: expect.stringContaining('等待作者确认')
    }));
    expect(finish?.verification).toEqual(expect.arrayContaining([
      expect.stringContaining('未确认')
    ]));
    expect(feedbackFixture.canonBoundary).toContain('作者画像只作为偏好');
  });
});
