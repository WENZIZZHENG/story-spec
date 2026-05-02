import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import {
  parseCanonDocument,
  parseWorldDocument,
  type CanonFact,
  type WorldFact,
  type WorldbuildingIssue
} from '../domain/worldbuilding.js';

export interface WorldInspectionResult {
  projectRoot: string;
  files: string[];
  facts: WorldFact[];
  issues: WorldbuildingIssue[];
}

export interface CanonInspectionResult {
  projectRoot: string;
  files: string[];
  facts: CanonFact[];
  issues: WorldbuildingIssue[];
}

export interface InspectWorldbuildingInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
}

const listFiles = async (
  fs: ProjectFileSystem,
  dirPath: string,
  predicate: (file: string) => boolean
): Promise<string[]> => {
  if (!await fs.pathExists(dirPath)) {
    return [];
  }

  return (await fs.readDir(dirPath))
    .filter(predicate)
    .sort()
    .map(file => path.join(dirPath, file));
};

export const inspectWorld = async (
  input: InspectWorldbuildingInput
): Promise<WorldInspectionResult> => {
  const worldDir = path.join(input.projectRoot, 'spec', 'world');
  const files = await listFiles(input.fileSystem, worldDir, file => file.endsWith('.yaml') || file.endsWith('.yml'));
  const facts: WorldFact[] = [];
  const issues: WorldbuildingIssue[] = [];

  for (const file of files) {
    const result = parseWorldDocument(await input.fileSystem.readFile(file), file);
    facts.push(...result.worldFacts);
    issues.push(...result.issues);
  }

  return {
    projectRoot: input.projectRoot,
    files,
    facts,
    issues
  };
};

export const inspectCanon = async (
  input: InspectWorldbuildingInput
): Promise<CanonInspectionResult> => {
  const canonDir = path.join(input.projectRoot, 'spec', 'canon');
  const files = await listFiles(input.fileSystem, canonDir, file => file.endsWith('.json'));
  const facts: CanonFact[] = [];
  const issues: WorldbuildingIssue[] = [];

  for (const file of files) {
    const result = parseCanonDocument(await input.fileSystem.readFile(file), file);
    facts.push(...result.canonFacts);
    issues.push(...result.issues);
  }

  return {
    projectRoot: input.projectRoot,
    files,
    facts,
    issues
  };
};

const relativePath = (projectRoot: string, filePath: string): string =>
  path.relative(projectRoot, filePath).split(path.sep).join('/');

export const renderWorldInspection = (result: WorldInspectionResult): string => [
  'World Bible',
  '',
  `文件：${result.files.length}`,
  `WorldFacts：${result.facts.length}`,
  `问题：${result.issues.length}`,
  '',
  ...(
    result.facts.length > 0
      ? result.facts.map(fact => `- ${fact.id}：${fact.title}（${fact.type}）`)
      : ['- 暂无 WorldFact']
  ),
  '',
  ...(
    result.issues.length > 0
      ? [
        '问题列表：',
        ...result.issues.map(issue => `- [${issue.severity}] ${issue.code}: ${relativePath(result.projectRoot, issue.path)} - ${issue.message}`)
      ]
      : []
  )
].filter(line => line !== undefined).join('\n').trimEnd();

export const renderCanonInspection = (result: CanonInspectionResult): string => [
  'Canon Ledger',
  '',
  `文件：${result.files.length}`,
  `CanonFacts：${result.facts.length}`,
  `问题：${result.issues.length}`,
  '',
  ...(
    result.facts.length > 0
      ? result.facts.map(fact => `- ${fact.id}：${fact.summary}（${fact.type}，evidence ${fact.evidence.length}）`)
      : ['- 暂无 CanonFact']
  ),
  '',
  ...(
    result.issues.length > 0
      ? [
        '问题列表：',
        ...result.issues.map(issue => `- [${issue.severity}] ${issue.code}: ${relativePath(result.projectRoot, issue.path)} - ${issue.message}`)
      ]
      : []
  )
].filter(line => line !== undefined).join('\n').trimEnd();
