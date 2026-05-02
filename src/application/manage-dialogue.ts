import path from 'node:path';
import yaml from 'js-yaml';
import type { ProjectFileSystem } from './project-ports.js';
import { inspectStoryGraph } from './inspect-story-structure.js';
import { inspectVoice } from './inspect-voice.js';
import type {
  DialogueBeat,
  DialogueIssue
} from '../domain/workbench.js';
import {
  relativePath,
  selectStoryProject,
  toPosixPath
} from './workbench-utils.js';

export interface DialogueInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  chapter?: string;
}

export interface DialoguePlanInput extends DialogueInput {
  scene: string;
  write?: boolean;
}

export interface DialoguePlanResult {
  story: string;
  outputPath: string;
  beats: DialogueBeat[];
  written: boolean;
}

export interface DialogueCheckResult {
  projectRoot: string;
  story: string;
  files: string[];
  beats: DialogueBeat[];
  issues: DialogueIssue[];
}

const normalizeChapter = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? `chapter-${trimmed.padStart(3, '0')}` : trimmed;
};

const dialogueDir = (storyPath: string): string => path.join(storyPath, 'dialogue');

const dialogueFileName = (chapter: string, scene: string): string =>
  `${chapter}.${scene}.yaml`;

const createTemplateBeat = (sceneId: string): DialogueBeat => ({
  id: `${sceneId}.beat-001`,
  sceneId,
  speaker: 'entity.protagonist',
  line: '【待确认对白】',
  intent: '推进冲突或信息揭示',
  subtext: '未明说的真实目的',
  relationshipChange: '关系变化待确认',
  reveals: [],
  hides: [],
  emotion: '克制但有压力',
  voiceFingerprint: 'entity.protagonist'
});

export const planDialogue = async (input: DialoguePlanInput): Promise<DialoguePlanResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const chapter = normalizeChapter(input.chapter) ?? 'chapter-001';
  const outputPath = path.join(dialogueDir(story.path), dialogueFileName(chapter, input.scene));
  const beats = [createTemplateBeat(input.scene)];

  if (input.write !== false) {
    await input.fileSystem.ensureDir(path.dirname(outputPath));
    await input.fileSystem.writeFile(outputPath, yaml.dump({
      dialogueBeats: beats
    }, { lineWidth: 120 }));
  }

  return {
    story: story.name,
    outputPath,
    beats,
    written: input.write !== false
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim())
    : [];

const readDialogueBeats = (
  content: string,
  filePath: string
): { beats: DialogueBeat[]; issues: DialogueIssue[] } => {
  let document: unknown;
  try {
    document = yaml.load(content);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      beats: [],
      issues: [{
        severity: 'error',
        code: 'INVALID_DIALOGUE_DOCUMENT',
        path: filePath,
        message: `dialogue YAML 无法解析：${detail}`
      }]
    };
  }

  if (!isRecord(document) || !Array.isArray(document.dialogueBeats)) {
    return {
      beats: [],
      issues: [{
        severity: 'error',
        code: 'INVALID_DIALOGUE_DOCUMENT',
        path: filePath,
        message: 'dialogue 文档必须包含 dialogueBeats 数组'
      }]
    };
  }

  const beats: DialogueBeat[] = [];
  const issues: DialogueIssue[] = [];
  document.dialogueBeats.forEach((candidate, index) => {
    const basePath = `${filePath}#dialogueBeats[${index}]`;
    if (!isRecord(candidate)) {
      issues.push({
        severity: 'error',
        code: 'INVALID_DIALOGUE_BEAT',
        path: basePath,
        message: 'DialogueBeat 必须是对象'
      });
      return;
    }

    const required = ['id', 'sceneId', 'speaker', 'line', 'intent', 'emotion'];
    for (const field of required) {
      if (typeof candidate[field] !== 'string' || !candidate[field].trim()) {
        issues.push({
          severity: 'warning',
          code: 'MISSING_DIALOGUE_FIELD',
          path: `${basePath}.${field}`,
          message: `DialogueBeat 缺少 ${field}`
        });
      }
    }

    if (required.some(field => typeof candidate[field] !== 'string' || !candidate[field].trim())) {
      return;
    }

    beats.push({
      id: String(candidate.id).trim(),
      sceneId: String(candidate.sceneId).trim(),
      speaker: String(candidate.speaker).trim(),
      line: String(candidate.line).trim(),
      intent: String(candidate.intent).trim(),
      subtext: typeof candidate.subtext === 'string' && candidate.subtext.trim() ? candidate.subtext.trim() : undefined,
      relationshipChange: typeof candidate.relationshipChange === 'string' && candidate.relationshipChange.trim()
        ? candidate.relationshipChange.trim()
        : undefined,
      reveals: toStringArray(candidate.reveals),
      hides: toStringArray(candidate.hides),
      emotion: String(candidate.emotion).trim(),
      voiceFingerprint: typeof candidate.voiceFingerprint === 'string' && candidate.voiceFingerprint.trim()
        ? candidate.voiceFingerprint.trim()
        : undefined
    });
  });

  return { beats, issues };
};

const listDialogueFiles = async (
  fs: ProjectFileSystem,
  storyPath: string,
  chapter?: string
): Promise<string[]> => {
  const dir = dialogueDir(storyPath);
  if (!await fs.pathExists(dir)) {
    return [];
  }

  const normalizedChapter = normalizeChapter(chapter);
  return (await fs.readDir(dir))
    .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
    .filter(file => !normalizedChapter || file.startsWith(`${normalizedChapter}.`))
    .sort()
    .map(file => path.join(dir, file));
};

export const checkDialogue = async (input: DialogueInput): Promise<DialogueCheckResult> => {
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const files = await listDialogueFiles(input.fileSystem, story.path, input.chapter);
  const graph = await inspectStoryGraph({ projectRoot: input.projectRoot, fileSystem: input.fileSystem });
  const voice = await inspectVoice({ projectRoot: input.projectRoot, fileSystem: input.fileSystem });
  const entityIds = new Set(graph.entities.map(entity => entity.id));
  const voiceIds = new Set(voice.fingerprints.map(fingerprint => fingerprint.characterId));
  const beats: DialogueBeat[] = [];
  const issues: DialogueIssue[] = [];

  for (const file of files) {
    const parsed = readDialogueBeats(await input.fileSystem.readFile(file), file);
    beats.push(...parsed.beats);
    issues.push(...parsed.issues);
  }

  for (const beat of beats) {
    const beatPath = files.find(file => file.includes(beat.sceneId)) ?? story.path;
    if (!entityIds.has(beat.speaker)) {
      issues.push({
        severity: 'error',
        code: 'UNKNOWN_DIALOGUE_SPEAKER',
        path: beatPath,
        message: `对白 speaker 不存在于 Entity Graph：${beat.speaker}`
      });
    }

    if (!beat.voiceFingerprint || !voiceIds.has(beat.voiceFingerprint)) {
      issues.push({
        severity: 'warning',
        code: 'MISSING_DIALOGUE_VOICE',
        path: beatPath,
        message: `对白缺少可用 VoiceFingerprint：${beat.id}`
      });
    }

    if (!beat.intent.trim()) {
      issues.push({
        severity: 'warning',
        code: 'MISSING_DIALOGUE_INTENT',
        path: beatPath,
        message: `对白缺少 intent：${beat.id}`
      });
    }

    if (!beat.relationshipChange?.trim()) {
      issues.push({
        severity: 'info',
        code: 'MISSING_DIALOGUE_RELATIONSHIP_CHANGE',
        path: beatPath,
        message: `对白未声明 relationshipChange：${beat.id}`
      });
    }
  }

  return {
    projectRoot: input.projectRoot,
    story: story.name,
    files,
    beats,
    issues
  };
};

export const renderDialoguePlan = (result: DialoguePlanResult): string => [
  'Dialogue Plan',
  '',
  `故事：${result.story}`,
  `输出：${result.outputPath}`,
  `Beats：${result.beats.length}`,
  `模式：${result.written ? '已写入' : '预览'}`
].join('\n');

export const renderDialogueCheck = (result: DialogueCheckResult): string => [
  'Dialogue Check',
  '',
  `故事：${result.story}`,
  `文件：${result.files.length}`,
  `Beats：${result.beats.length}`,
  `问题：${result.issues.length}`,
  '',
  ...(result.issues.length > 0
    ? result.issues.map(issue => `- [${issue.severity}] ${issue.code}: ${toPosixPath(issue.path)} - ${issue.message}`)
    : ['- 无'])
].join('\n').trimEnd();
