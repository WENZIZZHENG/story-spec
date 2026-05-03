import path from 'node:path';
import type {
  AuthorProfile,
  AuthorProfileEntry,
  AuthorProfileEntryCategory,
  AuthorProfileIssue,
  AuthorProfileSampleQuestion,
  AuthorProfileSummary
} from '../domain/author-profile.js';
import type { ProjectFileSystem } from './project-ports.js';
import { relativePath } from './workbench-utils.js';

export interface AuthorProfileLoadInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
}

export interface AuthorProfileLoadResult {
  path: string;
  exists: boolean;
  profile: AuthorProfile;
  summary: AuthorProfileSummary;
  issues: AuthorProfileIssue[];
}

export interface InitAuthorProfileInput extends AuthorProfileLoadInput {
  answers?: Partial<Record<AuthorProfileEntryCategory, unknown>>;
  write?: boolean;
  now?: () => Date;
}

export interface AuthorProfileMutationInput extends AuthorProfileLoadInput {
  confirmIds?: string[];
  deprecateIds?: string[];
  ignoreIds?: string[];
  clear?: boolean;
  write?: boolean;
  now?: () => Date;
}

export interface AuthorProfileMutationResult extends AuthorProfileLoadResult {
  written: boolean;
  created: boolean;
  sampleQuestions: AuthorProfileSampleQuestion[];
  updatedIds: string[];
}

export const AUTHOR_PROFILE_NOTES = [
  '作者画像只影响推荐、示例和提示词上下文，不是故事正典。',
  '首次使用可以跳过；采样条目默认 provisional，确认后才复用为强偏好。'
];

export const DEFAULT_AUTHOR_PROFILE_SAMPLE_QUESTIONS: AuthorProfileSampleQuestion[] = [
  {
    id: 'genre',
    label: '题材偏好',
    question: '近期最想写的题材、风味或读者承诺是什么？',
    whyItMatters: '用于给访谈问题和示例排序，但不会替当前故事定案。',
    examples: [
      '18+ 玄幻、异界穿越、轻松冒险。',
      '悬疑外壳下的角色成长，世界谜团慢慢浮现。'
    ],
    skippable: true
  },
  {
    id: 'pacing',
    label: '节奏偏好',
    question: '你更喜欢慢热铺垫、单元冒险、快节奏爽点，还是混合节奏？',
    whyItMatters: '用于控制共创访谈的提问密度和示例颗粒度。',
    examples: [
      '慢热，先把主角、伙伴和舞台共创清楚。',
      '单元冒险推进，每一卷都要有局部胜利。'
    ],
    skippable: true
  },
  {
    id: 'voice',
    label: '叙述声音',
    question: '叙述声音更偏幽默、克制、热血、冷静，还是别的口味？',
    whyItMatters: '用于示例文本的语气参考，不覆盖角色 voice fingerprint。',
    examples: [
      '轻松但不胡闹，吐槽服务于人物判断。',
      '克制、有现实压力，但保留冒险感。'
    ],
    skippable: true
  },
  {
    id: 'boundary',
    label: '创作禁区',
    question: '明确不想写成什么样？有哪些创作禁区或踩雷点？',
    whyItMatters: '用于避免 AI 推荐偏离作者乐趣边界。',
    examples: [
      '建设流和思想改造只是支撑工具，不写成纯种田。',
      '不要过早替主角定胜利路线，也不要把感情线快进。'
    ],
    skippable: true
  }
];

const DEFAULT_PROFILE: AuthorProfile = {
  schemaVersion: '1.0',
  updatedAt: '',
  notes: AUTHOR_PROFILE_NOTES,
  entries: []
};

export const authorProfilePath = (projectRoot: string): string =>
  path.join(projectRoot, '.specify', 'memory', 'author-profile.json');

const nowIso = (now?: () => Date): string =>
  (now ?? (() => new Date()))().toISOString();

const cloneDefaultProfile = (timestamp = ''): AuthorProfile => ({
  ...DEFAULT_PROFILE,
  updatedAt: timestamp,
  notes: [...AUTHOR_PROFILE_NOTES],
  entries: []
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCategory = (value: unknown): value is AuthorProfileEntryCategory =>
  value === 'genre'
  || value === 'pacing'
  || value === 'voice'
  || value === 'boundary'
  || value === 'pattern';

const normalizeAnswer = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map(item => normalizeAnswer(item)).filter(Boolean).join('；');
  }

  return String(value).trim();
};

const sanitizeEntry = (value: unknown): AuthorProfileEntry | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const category = isCategory(value.category) ? value.category : undefined;
  const label = typeof value.label === 'string' ? value.label.trim() : '';
  const entryValue = typeof value.value === 'string' ? value.value.trim() : '';
  const status = value.status === 'confirmed' || value.status === 'deprecated'
    ? value.status
    : 'provisional';
  const source = value.source === 'user-explicit'
    || value.source === 'inferred'
    || value.source === 'imported'
    ? value.source
    : 'sampled';
  const createdAt = typeof value.createdAt === 'string' ? value.createdAt : '';
  const updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : createdAt;

  if (!id || !category || !label || !entryValue || !createdAt || !updatedAt) {
    return undefined;
  }

  return {
    id,
    category,
    label,
    value: entryValue,
    status,
    source,
    evidence: Array.isArray(value.evidence)
      ? value.evidence.map(item => String(item).trim()).filter(Boolean)
      : [],
    createdAt,
    updatedAt,
    confirmedAt: typeof value.confirmedAt === 'string' ? value.confirmedAt : undefined,
    ignored: value.ignored === true,
    notes: typeof value.notes === 'string' ? value.notes : undefined
  };
};

const sanitizeProfile = (value: unknown, timestamp = ''): AuthorProfile | undefined => {
  if (!isRecord(value) || value.schemaVersion !== '1.0') {
    return undefined;
  }

  return {
    schemaVersion: '1.0',
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : timestamp,
    notes: Array.isArray(value.notes)
      ? value.notes.map(item => String(item).trim()).filter(Boolean)
      : [...AUTHOR_PROFILE_NOTES],
    entries: Array.isArray(value.entries)
      ? value.entries.map(sanitizeEntry).filter((entry): entry is AuthorProfileEntry => Boolean(entry))
      : []
  };
};

export const summarizeAuthorProfile = (
  profile: AuthorProfile,
  input?: { path?: string; exists?: boolean }
): AuthorProfileSummary => {
  const activeEntries = profile.entries
    .filter(entry => entry.status !== 'deprecated' && !entry.ignored)
    .sort((left, right) => {
      const leftRank = left.status === 'confirmed' ? 0 : 1;
      const rightRank = right.status === 'confirmed' ? 0 : 1;
      return leftRank - rightRank || left.id.localeCompare(right.id);
    });

  return {
    path: input?.path ?? '',
    exists: input?.exists ?? false,
    activeHints: activeEntries.map(entry => `[${entry.status}] ${entry.label}：${entry.value}`),
    confirmedCount: profile.entries.filter(entry => entry.status === 'confirmed' && !entry.ignored).length,
    provisionalCount: profile.entries.filter(entry => entry.status === 'provisional' && !entry.ignored).length,
    deprecatedCount: profile.entries.filter(entry => entry.status === 'deprecated').length,
    ignoredCount: profile.entries.filter(entry => entry.ignored).length,
    firstUse: profile.entries.length === 0,
    hasReusableHints: activeEntries.some(entry => entry.status === 'confirmed'),
    sampleQuestions: DEFAULT_AUTHOR_PROFILE_SAMPLE_QUESTIONS
  };
};

const buildIssue = (profilePath: string, message: string): AuthorProfileIssue => ({
  severity: 'warning',
  code: 'AUTHOR_PROFILE_INVALID',
  path: profilePath,
  message,
  suggestedAction: '运行 storyspec author-profile --init 重新生成轻量采样文件，或手动修正 JSON。'
});

export const loadAuthorProfile = async (
  input: AuthorProfileLoadInput
): Promise<AuthorProfileLoadResult> => {
  const profilePath = authorProfilePath(input.projectRoot);
  const exists = await input.fileSystem.pathExists(profilePath);
  const issues: AuthorProfileIssue[] = [];

  if (!exists) {
    const profile = cloneDefaultProfile();
    return {
      path: profilePath,
      exists: false,
      profile,
      summary: summarizeAuthorProfile(profile, { path: profilePath, exists: false }),
      issues
    };
  }

  try {
    const raw = await input.fileSystem.readJson<unknown>(profilePath);
    const profile = sanitizeProfile(raw);
    if (!profile) {
      const fallback = cloneDefaultProfile();
      issues.push(buildIssue(profilePath, '作者画像 JSON 结构无效或 schemaVersion 不受支持。'));
      return {
        path: profilePath,
        exists: true,
        profile: fallback,
        summary: summarizeAuthorProfile(fallback, { path: profilePath, exists: true }),
        issues
      };
    }

    return {
      path: profilePath,
      exists: true,
      profile,
      summary: summarizeAuthorProfile(profile, { path: profilePath, exists: true }),
      issues
    };
  } catch {
    const fallback = cloneDefaultProfile();
    issues.push(buildIssue(profilePath, '作者画像 JSON 无法读取或解析。'));
    return {
      path: profilePath,
      exists: true,
      profile: fallback,
      summary: summarizeAuthorProfile(fallback, { path: profilePath, exists: true }),
      issues
    };
  }
};

const questionById = new Map(DEFAULT_AUTHOR_PROFILE_SAMPLE_QUESTIONS.map(question => [question.id, question]));

const entryId = (category: AuthorProfileEntryCategory): string => `pref.${category}`;

const upsertSampleEntries = (
  profile: AuthorProfile,
  answers: Partial<Record<AuthorProfileEntryCategory, unknown>>,
  timestamp: string
): { profile: AuthorProfile; updatedIds: string[] } => {
  const entries = new Map(profile.entries.map(entry => [entry.id, entry]));
  const updatedIds: string[] = [];

  for (const question of DEFAULT_AUTHOR_PROFILE_SAMPLE_QUESTIONS) {
    const value = normalizeAnswer(answers[question.id]);
    if (!value) {
      continue;
    }

    const id = entryId(question.id);
    const existing = entries.get(id);
    entries.set(id, {
      id,
      category: question.id,
      label: question.label,
      value,
      status: existing?.status === 'confirmed' ? 'confirmed' : 'provisional',
      source: existing?.source ?? 'sampled',
      evidence: [
        ...(existing?.evidence ?? []),
        '作者画像首次/手动采样'
      ].filter((item, index, all) => all.indexOf(item) === index),
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      confirmedAt: existing?.confirmedAt,
      ignored: existing?.ignored,
      notes: existing?.notes
    });
    updatedIds.push(id);
  }

  return {
    profile: {
      ...profile,
      updatedAt: timestamp,
      notes: profile.notes.length > 0 ? profile.notes : [...AUTHOR_PROFILE_NOTES],
      entries: [...entries.values()]
    },
    updatedIds
  };
};

export const initAuthorProfile = async (
  input: InitAuthorProfileInput
): Promise<AuthorProfileMutationResult> => {
  const timestamp = nowIso(input.now);
  const loaded = await loadAuthorProfile(input);
  const created = !loaded.exists;
  const baseProfile = loaded.exists ? loaded.profile : cloneDefaultProfile(timestamp);
  const { profile, updatedIds } = upsertSampleEntries(baseProfile, input.answers ?? {}, timestamp);
  const write = input.write !== false;

  if (write) {
    await input.fileSystem.ensureDir(path.dirname(loaded.path));
    await input.fileSystem.writeJson(loaded.path, profile, { spaces: 2 });
  }

  return {
    path: loaded.path,
    exists: true,
    profile,
    summary: summarizeAuthorProfile(profile, { path: loaded.path, exists: true }),
    issues: loaded.issues,
    written: write,
    created,
    sampleQuestions: DEFAULT_AUTHOR_PROFILE_SAMPLE_QUESTIONS,
    updatedIds
  };
};

const updateEntryStatus = (
  entry: AuthorProfileEntry,
  status: AuthorProfileEntry['status'],
  timestamp: string
): AuthorProfileEntry => ({
  ...entry,
  status,
  updatedAt: timestamp,
  confirmedAt: status === 'confirmed' ? timestamp : entry.confirmedAt
});

export const updateAuthorProfile = async (
  input: AuthorProfileMutationInput
): Promise<AuthorProfileMutationResult> => {
  const timestamp = nowIso(input.now);
  const loaded = await loadAuthorProfile(input);
  const write = input.write !== false;
  const confirmIds = new Set(input.confirmIds ?? []);
  const deprecateIds = new Set(input.deprecateIds ?? []);
  const ignoreIds = new Set(input.ignoreIds ?? []);
  const updatedIds = new Set<string>();
  const profile: AuthorProfile = input.clear
    ? {
      ...cloneDefaultProfile(timestamp),
      entries: []
    }
    : {
      ...loaded.profile,
      updatedAt: timestamp,
      entries: loaded.profile.entries.map(entry => {
        let next = entry;
        if (confirmIds.has(entry.id)) {
          next = updateEntryStatus(next, 'confirmed', timestamp);
          updatedIds.add(entry.id);
        }
        if (deprecateIds.has(entry.id)) {
          next = updateEntryStatus(next, 'deprecated', timestamp);
          updatedIds.add(entry.id);
        }
        if (ignoreIds.has(entry.id)) {
          next = {
            ...next,
            ignored: true,
            updatedAt: timestamp
          };
          updatedIds.add(entry.id);
        }
        return next;
      })
    };

  if (input.clear) {
    updatedIds.add('*');
  }

  if (write) {
    await input.fileSystem.ensureDir(path.dirname(loaded.path));
    await input.fileSystem.writeJson(loaded.path, profile, { spaces: 2 });
  }

  return {
    path: loaded.path,
    exists: true,
    profile,
    summary: summarizeAuthorProfile(profile, { path: loaded.path, exists: true }),
    issues: loaded.issues,
    written: write,
    created: !loaded.exists,
    sampleQuestions: DEFAULT_AUTHOR_PROFILE_SAMPLE_QUESTIONS,
    updatedIds: [...updatedIds]
  };
};

export const renderAuthorProfileSummary = (result: AuthorProfileLoadResult): string => [
  'StorySpec 作者画像',
  '',
  `路径：${relativePath(process.cwd(), result.path)}`,
  `状态：${result.exists ? '已建立' : '未建立'}`,
  `确认偏好：${result.summary.confirmedCount}`,
  `临时采样：${result.summary.provisionalCount}`,
  `已废弃：${result.summary.deprecatedCount}`,
  '',
  '边界：只影响推荐和示例，不进入故事正典；当前故事的明确回答永远优先。',
  '',
  '可复用提示：',
  ...(result.summary.activeHints.length > 0
    ? result.summary.activeHints.map(item => `- ${item}`)
    : ['- 暂无；首次使用可运行 `storyspec author-profile --init` 做 2-4 个可跳过采样。']),
  '',
  ...(result.issues.length > 0
    ? [
      '问题：',
      ...result.issues.map(issue => `- ${issue.code}：${issue.message}`)
    ]
    : [])
].join('\n').trimEnd();

export const renderAuthorProfileMutation = (result: AuthorProfileMutationResult): string => [
  'StorySpec 作者画像',
  '',
  `写入状态：${result.written ? '已写入' : '预览未写入'}`,
  `更新条目：${result.updatedIds.join(', ') || '无'}`,
  '',
  renderAuthorProfileSummary(result)
].join('\n');

export const renderAuthorProfileSamplingGuide = (summary: AuthorProfileSummary): string[] => {
  if (!summary.firstUse && summary.activeHints.length > 0) {
    return summary.activeHints.map(item => `- ${item}`);
  }

  return [
    '- 首次使用暂无历史画像可回填，可运行 `storyspec author-profile --init` 做轻量偏好采样。',
    '- 所有采样问题都可跳过；采样结果默认是 provisional，确认后才作为强偏好复用。'
  ];
};
