import { describe, expect, it } from 'vitest';
import {
  determineStoryMaturityStage,
  getStoryStageMissingArtifacts,
  getStoryStageNextQuestions
} from '../../src/domain/story-stage.js';

describe('story maturity stage', () => {
  it('treats early idea and interview files as valid pre-spec stages', () => {
    expect(determineStoryMaturityStage({
      hasIdea: true,
      hasClarifications: false,
      hasCandidates: false,
      hasSpecification: false,
      hasCreativePlan: false,
      hasTasks: false,
      contentFiles: 0
    })).toBe('idea');

    expect(determineStoryMaturityStage({
      hasIdea: false,
      hasClarifications: true,
      hasCandidates: false,
      hasSpecification: false,
      hasCreativePlan: false,
      hasTasks: false,
      contentFiles: 0
    })).toBe('interviewing');
  });

  it('promotes maturity as canonical writing artifacts appear', () => {
    expect(determineStoryMaturityStage({
      hasIdea: true,
      hasClarifications: true,
      hasCandidates: false,
      hasSpecification: true,
      hasCreativePlan: false,
      hasTasks: false,
      contentFiles: 0
    })).toBe('specified');

    expect(determineStoryMaturityStage({
      hasIdea: true,
      hasClarifications: true,
      hasCandidates: false,
      hasSpecification: true,
      hasCreativePlan: true,
      hasTasks: true,
      contentFiles: 1
    })).toBe('drafting');
  });

  it('only requires artifacts that fit the current maturity stage', () => {
    expect(getStoryStageMissingArtifacts({
      stage: 'idea',
      hasSpecification: false,
      hasCreativePlan: false,
      hasTasks: false
    })).toEqual([]);

    expect(getStoryStageMissingArtifacts({
      stage: 'drafting',
      hasSpecification: true,
      hasCreativePlan: false,
      hasTasks: false
    })).toEqual(['creative-plan', 'tasks']);
  });

  it('offers three creative questions for early-stage stories', () => {
    expect(getStoryStageNextQuestions('idea')).toEqual([
      '主角是谁，当前最想要什么？',
      '故事从哪里开始，舞台的第一眼差异是什么？',
      '第一卷的核心冲突和失败代价是什么？'
    ]);
  });
});
