import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import {
  parseVoiceDocument,
  type VoiceFingerprint,
  type VoiceIssue
} from '../domain/voice.js';

export interface VoiceInspectionResult {
  projectRoot: string;
  files: string[];
  fingerprints: VoiceFingerprint[];
  issues: VoiceIssue[];
}

export interface VoiceSampleResult {
  projectRoot: string;
  characterId: string;
  fingerprint?: VoiceFingerprint;
  samples: Array<{
    path: string;
    content: string;
  }>;
  issues: VoiceIssue[];
}

export interface InspectVoiceInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
}

const toPosixPath = (value: string): string => value.split(path.sep).join('/');

const relativePath = (projectRoot: string, filePath: string): string =>
  toPosixPath(path.relative(projectRoot, filePath));

const listFiles = async (
  fs: ProjectFileSystem,
  dirPath: string
): Promise<string[]> => {
  if (!await fs.pathExists(dirPath)) {
    return [];
  }

  return (await fs.readDir(dirPath))
    .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
    .sort()
    .map(file => path.join(dirPath, file));
};

const resolveProjectPath = (projectRoot: string, filePath: string): string =>
  path.isAbsolute(filePath) ? filePath : path.join(projectRoot, ...filePath.split('/'));

const validateSamplePaths = async (
  fs: ProjectFileSystem,
  projectRoot: string,
  fingerprint: VoiceFingerprint
): Promise<VoiceIssue[]> => {
  const issues: VoiceIssue[] = [];

  for (const samplePath of fingerprint.samplePaths) {
    const absolutePath = resolveProjectPath(projectRoot, samplePath);
    if (!await fs.pathExists(absolutePath)) {
      issues.push({
        severity: 'warning',
        code: 'MISSING_VOICE_SAMPLE',
        path: absolutePath,
        message: `角色 ${fingerprint.characterId} 的声音样本不存在：${samplePath}`
      });
    }
  }

  return issues;
};

export const inspectVoice = async (
  input: InspectVoiceInput
): Promise<VoiceInspectionResult> => {
  const voiceDir = path.join(input.projectRoot, 'spec', 'voice');
  const files = await listFiles(input.fileSystem, voiceDir);
  const fingerprints: VoiceFingerprint[] = [];
  const issues: VoiceIssue[] = [];

  for (const file of files) {
    const result = parseVoiceDocument(await input.fileSystem.readFile(file), file);
    fingerprints.push(...result.fingerprints);
    issues.push(...result.issues);
  }

  for (const fingerprint of fingerprints) {
    issues.push(...await validateSamplePaths(input.fileSystem, input.projectRoot, fingerprint));
  }

  return {
    projectRoot: input.projectRoot,
    files,
    fingerprints,
    issues
  };
};

export const inspectVoiceSample = async (
  input: InspectVoiceInput & { characterId: string }
): Promise<VoiceSampleResult> => {
  const result = await inspectVoice(input);
  const fingerprint = result.fingerprints.find(item => item.characterId === input.characterId);
  const samples: VoiceSampleResult['samples'] = [];

  if (fingerprint) {
    for (const samplePath of fingerprint.samplePaths) {
      const absolutePath = resolveProjectPath(input.projectRoot, samplePath);
      if (await input.fileSystem.pathExists(absolutePath)) {
        samples.push({
          path: absolutePath,
          content: await input.fileSystem.readFile(absolutePath)
        });
      }
    }
  }

  return {
    projectRoot: input.projectRoot,
    characterId: input.characterId,
    fingerprint,
    samples,
    issues: result.issues
  };
};

export const renderVoiceInspection = (result: VoiceInspectionResult): string => [
  'Voice Fingerprints',
  '',
  `文件：${result.files.length}`,
  `VoiceFingerprints：${result.fingerprints.length}`,
  `问题：${result.issues.length}`,
  '',
  ...(
    result.fingerprints.length > 0
      ? result.fingerprints.map(fingerprint => `- ${fingerprint.characterId}：${fingerprint.sentenceLength} / ${fingerprint.conflictStyle}`)
      : ['- 暂无 VoiceFingerprint']
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

