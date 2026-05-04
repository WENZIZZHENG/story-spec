import type { StoryCoreElementAssessment } from '../domain/story-core-elements.js';

export interface CreationEchoSummary {
  flavor: string;
  strongestParts: string[];
  missingPieces: string[];
  nextEcho: string;
  maturityNote: string;
}

const labelForEcho = (element: StoryCoreElementAssessment): string => {
  switch (element.id) {
    case 'protagonist':
      return '主角/价值观';
    case 'partner':
      return '核心伙伴';
    case 'stage':
      return '世界问题';
    case 'power':
      return '能力风味';
    case 'factionConflict':
      return '势力冲突';
    case 'longThreat':
      return '长线威胁';
    case 'genrePromise':
      return '阅读承诺';
    case 'growthRoute':
      return '成功路线';
    case 'voice':
      return '作品声音';
  }
};

const compact = (value: string): string => value.replace(/\s+/g, ' ').trim();

const stripSentenceEnd = (value: string): string => compact(value).replace(/[。.!！?？]+$/u, '');

const uniqueTexts = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const text = compact(value);
    if (!text) {
      continue;
    }

    const key = text.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(text);
  }

  return result;
};

const maturityNoteFor = (
  story: string,
  planCriticalConfirmedCount: number,
  planCriticalTotal: number
): string => {
  if (planCriticalConfirmedCount === 0) {
    return `${story} 还在聚拢灵感，先补主角、舞台和第一轮冲突最划算。`;
  }

  if (planCriticalConfirmedCount >= planCriticalTotal) {
    return `${story} 的核心骨架已经成形，可以进入规格、计划和写作。`;
  }

  if (planCriticalConfirmedCount >= Math.max(2, Math.ceil(planCriticalTotal / 2))) {
    return `${story} 的核心骨架已经长出大半，只差几块关键部件。`;
  }

  return `${story} 已经长出一些关键部件，但还需要继续补齐主角、舞台或冲突。`;
};

export const summarizeCreationEcho = (
  story: string,
  premise: string | undefined,
  coreElements: StoryCoreElementAssessment[]
): CreationEchoSummary => {
  const confirmedOrPartial = coreElements
    .filter(element => element.status === 'confirmed' || element.status === 'partial');
  const planCriticalElements = coreElements.filter(element => element.planCritical);
  const planCriticalConfirmedCount = planCriticalElements.filter(element =>
    element.status === 'confirmed' || element.status === 'partial'
  ).length;
  const strongestParts = uniqueTexts(confirmedOrPartial
    .slice(0, 5)
    .map(element => `${labelForEcho(element)}：${element.summary}`));
  const missingPieces = uniqueTexts(coreElements
    .filter(element => element.status === 'missing' || element.status === 'partial' || element.status === 'deferred')
    .slice(0, 5)
    .map(element => `${element.label}：${element.nextPrompt ?? '仍待共创。'}`));
  const sourceFlavor = uniqueTexts([
    compact(premise ?? ''),
    ...confirmedOrPartial.slice(0, 3).map(element => compact(element.summary))
  ]).join('；');
  const flavor = sourceFlavor
    ? `${story}：${sourceFlavor}`
    : `${story} 现在还处在灵感聚拢阶段，小说灵魂仍待共创。`;
  const maturityNote = maturityNoteFor(story, planCriticalConfirmedCount, planCriticalElements.length);
  const nextEcho = missingPieces.length > 0
    ? `这次创作已经让故事轮廓更清楚；${maturityNote} 下一轮最值得补的是 ${stripSentenceEnd(missingPieces[0])}。`
    : `${maturityNote} 现在可以进入预览、分支比较或场景写作。`;

  return {
    flavor,
    strongestParts: strongestParts.length > 0
      ? strongestParts
      : ['项目框架已建立，但小说灵魂仍待共创。'],
    missingPieces,
    nextEcho,
    maturityNote
  };
};
