import type { StoryCoreElementAssessment } from '../domain/story-core-elements.js';

export interface CreationEchoSummary {
  flavor: string;
  strongestParts: string[];
  missingPieces: string[];
  nextEcho: string;
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

export const summarizeCreationEcho = (
  story: string,
  premise: string | undefined,
  coreElements: StoryCoreElementAssessment[]
): CreationEchoSummary => {
  const confirmedOrPartial = coreElements
    .filter(element => element.status === 'confirmed' || element.status === 'partial');
  const strongestParts = confirmedOrPartial
    .slice(0, 5)
    .map(element => `${labelForEcho(element)}：${element.summary}`);
  const missingPieces = coreElements
    .filter(element => element.status === 'missing' || element.status === 'partial' || element.status === 'deferred')
    .slice(0, 5)
    .map(element => `${element.label}：${element.nextPrompt ?? '仍待共创。'}`);
  const sourceFlavor = [
    compact(premise ?? ''),
    ...confirmedOrPartial.slice(0, 4).map(element => compact(element.summary))
  ].filter(Boolean).join('；');
  const flavor = sourceFlavor
    ? `${story} 现在长成了：${sourceFlavor}`
    : `${story} 现在还处在灵感聚拢阶段，小说灵魂仍待共创。`;
  const nextEcho = missingPieces.length > 0
    ? `这次创作让 ${strongestParts.length > 0 ? strongestParts[0] : story} 更清楚了；下一轮最值得补的是 ${missingPieces[0]}`
    : `这次创作让 ${story} 的核心部件基本成形；下一轮可以进入预览、分支比较或场景写作。`;

  return {
    flavor,
    strongestParts: strongestParts.length > 0
      ? strongestParts
      : ['项目框架已建立，但小说灵魂仍待共创。'],
    missingPieces,
    nextEcho
  };
};
