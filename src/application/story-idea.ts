import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';

const USER_ORIGINAL_HEADING = /^##\s+用户原文\s*$/;
const NEXT_HEADING = /^##\s+/;

const cleanIdeaLine = (line: string): string =>
  line
    .trim()
    .replace(/^[-*]\s+/, '')
    .trim();

const stripWrappingQuotes = (value: string): string =>
  value.replace(/^["“”']+|["“”']+$/g, '').trim();

export const extractIdeaPremise = (markdown: string): string => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const userOriginalIndex = lines.findIndex(line => USER_ORIGINAL_HEADING.test(line.trim()));

  if (userOriginalIndex !== -1) {
    const sectionLines: string[] = [];

    for (const line of lines.slice(userOriginalIndex + 1)) {
      if (NEXT_HEADING.test(line.trim())) {
        break;
      }

      const cleaned = cleanIdeaLine(line);
      if (cleaned) {
        sectionLines.push(cleaned);
      }
    }

    const sectionText = stripWrappingQuotes(sectionLines.join(' ').trim());
    if (sectionText) {
      return sectionText;
    }
  }

  const bodyLines = lines
    .map(cleanIdeaLine)
    .filter(line =>
      line.length > 0
      && !line.startsWith('#')
      && !line.startsWith('创建时间：')
      && !line.startsWith('（尚未记录')
      && !line.includes('AI 候选必须经过用户确认')
    );

  return stripWrappingQuotes(bodyLines.join(' ').trim());
};

export const readIdeaPremise = async (
  fs: ProjectFileSystem,
  storyPath: string
): Promise<string> => {
  const ideaPath = path.join(storyPath, 'idea.md');
  if (!await fs.pathExists(ideaPath)) {
    return '';
  }

  try {
    return extractIdeaPremise(await fs.readFile(ideaPath));
  } catch {
    return '';
  }
};

export const quoteCliArgument = (value: string): string =>
  `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

export const buildInterviewCommand = (
  story: string,
  options: {
    focus?: string;
    premise?: string;
    maxQuestions?: number;
    noWrite?: boolean;
  } = {}
): string => [
  'storyspec',
  'interview',
  story,
  ...(options.focus ? ['--focus', options.focus] : []),
  ...(options.maxQuestions ? ['--max-questions', String(options.maxQuestions)] : []),
  ...(options.noWrite ? ['--no-write'] : []),
  ...(options.premise?.trim() ? ['--premise', quoteCliArgument(options.premise.trim())] : [])
].join(' ');
