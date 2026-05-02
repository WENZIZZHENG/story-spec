import yaml from 'js-yaml';

export type VoiceSentenceLength = 'short' | 'mixed' | 'long';
export type VoiceConflictStyle = 'avoidant' | 'direct' | 'sarcastic' | 'silent' | 'performative';

export interface VoiceFingerprint {
  characterId: string;
  sentenceLength: VoiceSentenceLength;
  diction: string[];
  forbiddenWords: string[];
  addressRules: Record<string, string>;
  emotionalExpression: string;
  conflictStyle: VoiceConflictStyle;
  lieMarkers: string[];
  samplePaths: string[];
}

export interface VoiceIssue {
  severity: 'error' | 'warning' | 'info';
  code:
    | 'INVALID_VOICE_DOCUMENT'
    | 'INVALID_VOICE_FINGERPRINT'
    | 'MISSING_VOICE_FIELD'
    | 'MISSING_VOICE_SAMPLE';
  path: string;
  message: string;
}

export interface ParsedVoiceDocument {
  fingerprints: VoiceFingerprint[];
  issues: VoiceIssue[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(isNonEmptyString).map(item => item.trim())
    : [];

const toStringRecord = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => isNonEmptyString(item))
      .map(([key, item]) => [key, String(item).trim()])
  );
};

const issue = (
  code: VoiceIssue['code'],
  path: string,
  message: string,
  severity: VoiceIssue['severity'] = 'warning'
): VoiceIssue => ({
  code,
  path,
  message,
  severity
});

const readFingerprints = (document: unknown): unknown[] => {
  if (!isRecord(document)) {
    return [];
  }

  if (Array.isArray(document.voiceFingerprints)) {
    return document.voiceFingerprints;
  }

  return [];
};

export const parseVoiceDocument = (
  content: string,
  filePath: string
): ParsedVoiceDocument => {
  let document: unknown;
  try {
    document = yaml.load(content);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      fingerprints: [],
      issues: [issue('INVALID_VOICE_DOCUMENT', filePath, `voice 文档无法解析：${detail}`, 'error')]
    };
  }

  if (!isRecord(document)) {
    return {
      fingerprints: [],
      issues: [issue('INVALID_VOICE_DOCUMENT', filePath, 'voice 文档顶层必须是对象')]
    };
  }

  const issues: VoiceIssue[] = [];
  const fingerprints: VoiceFingerprint[] = [];
  readFingerprints(document).forEach((candidate, index) => {
    const basePath = `${filePath}#voiceFingerprints[${index}]`;
    if (!isRecord(candidate)) {
      issues.push(issue('INVALID_VOICE_FINGERPRINT', basePath, 'VoiceFingerprint 必须是对象'));
      return;
    }

    const missingFields = [
      ['characterId', candidate.characterId],
      ['emotionalExpression', candidate.emotionalExpression],
      ['conflictStyle', candidate.conflictStyle]
    ].filter(([, value]) => !isNonEmptyString(value));

    for (const [field] of missingFields) {
      issues.push(issue('MISSING_VOICE_FIELD', `${basePath}.${field}`, `VoiceFingerprint 缺少 ${field}`));
    }

    const forbiddenWords = toStringArray(candidate.forbiddenWords);
    if (forbiddenWords.length === 0) {
      issues.push(issue('MISSING_VOICE_FIELD', `${basePath}.forbiddenWords`, 'VoiceFingerprint 必须声明 forbiddenWords'));
    }

    const addressRules = toStringRecord(candidate.addressRules);
    if (Object.keys(addressRules).length === 0) {
      issues.push(issue('MISSING_VOICE_FIELD', `${basePath}.addressRules`, 'VoiceFingerprint 必须声明 addressRules'));
    }

    const samplePaths = toStringArray(candidate.samplePaths);
    if (samplePaths.length === 0) {
      issues.push(issue('MISSING_VOICE_FIELD', `${basePath}.samplePaths`, 'VoiceFingerprint 必须声明 samplePaths'));
    }

    if (missingFields.length > 0 || forbiddenWords.length === 0 || Object.keys(addressRules).length === 0 || samplePaths.length === 0) {
      return;
    }

    fingerprints.push({
      characterId: String(candidate.characterId).trim(),
      sentenceLength: isNonEmptyString(candidate.sentenceLength) ? candidate.sentenceLength.trim() as VoiceSentenceLength : 'mixed',
      diction: toStringArray(candidate.diction),
      forbiddenWords,
      addressRules,
      emotionalExpression: String(candidate.emotionalExpression).trim(),
      conflictStyle: String(candidate.conflictStyle).trim() as VoiceConflictStyle,
      lieMarkers: toStringArray(candidate.lieMarkers),
      samplePaths
    });
  });

  return { fingerprints, issues };
};

