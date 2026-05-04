export type ContextPackPurpose = 'write' | 'review' | 'revise' | 'handoff' | 'branch';
export type DraftStatus = 'draft' | 'reviewed' | 'approved' | 'published';
export type NarrativeTestStatus = 'pass' | 'fail' | 'warning';
export type NarrativeTestSeverity = 'error' | 'warning' | 'info';
export type DialogueIssueCode =
  | 'INVALID_DIALOGUE_DOCUMENT'
  | 'INVALID_DIALOGUE_BEAT'
  | 'MISSING_DIALOGUE_FIELD'
  | 'UNKNOWN_DIALOGUE_SPEAKER'
  | 'MISSING_DIALOGUE_VOICE'
  | 'MISSING_DIALOGUE_INTENT'
  | 'MISSING_DIALOGUE_RELATIONSHIP_CHANGE';
export type StoryBranchStatus = 'exploring' | 'accepted' | 'rejected' | 'merged';
export type StoryPromiseStatus = 'open' | 'reinforced' | 'paid-off' | 'stale' | 'abandoned';
export type StoryPromiseType = 'mystery' | 'revenge' | 'romance' | 'power-up' | 'world-secret' | 'character-goal';
export type PromiseIssueCode =
  | 'INVALID_PROMISE_DOCUMENT'
  | 'INVALID_PROMISE_ITEM'
  | 'MISSING_PROMISE_FIELD'
  | 'PROMISE_OPEN_TOO_LONG'
  | 'PROMISE_PAYOFF_MISSING_EVIDENCE'
  | 'PROMISE_REPEATED_WITHOUT_PROGRESS'
  | 'INVALID_TENSION_DOCUMENT'
  | 'INVALID_TENSION_POINT'
  | 'TENSION_PAYOFF_GAP'
  | 'TENSION_LONG_FLATLINE'
  | 'INVALID_RHYTHM_CONFIG'
  | 'RHYTHM_HOOK_INTERVAL_GAP'
  | 'RHYTHM_PAYOFF_INTERVAL_GAP'
  | 'RHYTHM_INFO_REVEAL_DENSITY_GAP';
export type ResearchSourceType = 'book' | 'article' | 'web' | 'video' | 'interview' | 'personal-note';
export type ResearchIssueCode =
  | 'INVALID_RESEARCH_DOCUMENT'
  | 'INVALID_RESEARCH_SOURCE'
  | 'MISSING_RESEARCH_SOURCE_FIELD'
  | 'INVALID_CITATION_DOCUMENT'
  | 'INVALID_CITATION_LINK'
  | 'MISSING_CITATION_SOURCE'
  | 'MISSING_CITATION_TARGET';
export type StyleRuleSeverity = 'error' | 'warning' | 'info' | 'off';
export type StyleLintSeverity = Exclude<StyleRuleSeverity, 'off'>;
export type StyleIssueCode =
  | 'INVALID_STYLE_RULE_DOCUMENT'
  | 'INVALID_STYLE_RULE'
  | 'STYLE_RULE_MATCH';
export type CompileWarningCode =
  | 'UNSUPPORTED_COMPILE_FORMAT'
  | 'MISSING_CHAPTER_FILE'
  | 'NO_CHAPTERS_FOUND';
export type ReaderFeedbackType = 'confusion' | 'boredom' | 'excitement' | 'continuity' | 'style' | 'character' | 'world';
export type ReaderFeedbackStatus = 'new' | 'triaged' | 'accepted' | 'rejected' | 'done';

export interface ContextPackItem {
  path: string;
  reason: string;
  required: boolean;
}

export type ContextPackScopeType = 'story' | 'task' | 'chapter' | 'scene';

export interface ContextPackScope {
  type: ContextPackScopeType;
  id: string;
  task?: string;
  chapter?: string;
  scene?: string;
  warnings: string[];
}

export interface ContextPack {
  schemaVersion: '1.0';
  id: string;
  purpose: ContextPackPurpose;
  story: string;
  targetTask?: string;
  targetChapter?: string;
  targetScene?: string;
  scope: ContextPackScope;
  generatedAt: string;
  mustRead: ContextPackItem[];
  allowedWrites: string[];
  worldFacts: string[];
  canonFacts: string[];
  sceneCards: string[];
  voiceFingerprints: string[];
  recentSummary: string;
  constraints: string[];
  validationChecklist: string[];
}

export interface DraftRecord {
  id: string;
  chapter: string;
  version: number;
  path: string;
  basedOn?: string;
  contextPack?: string;
  status: DraftStatus;
  reviewerFindings: string[];
  createdAt: string;
}

export interface DraftIndex {
  schemaVersion: '1.0';
  story: string;
  records: DraftRecord[];
}

export interface NarrativeTestResult {
  id: string;
  status: NarrativeTestStatus;
  severity: NarrativeTestSeverity;
  path: string;
  evidence?: string;
  message: string;
  suggestedAction: string;
}

export interface DialogueBeat {
  id: string;
  sceneId: string;
  speaker: string;
  line: string;
  intent: string;
  subtext?: string;
  relationshipChange?: string;
  reveals: string[];
  hides: string[];
  emotion: string;
  voiceFingerprint?: string;
}

export interface DialogueDocument {
  dialogueBeats: DialogueBeat[];
}

export interface DialogueIssue {
  severity: 'error' | 'warning' | 'info';
  code: DialogueIssueCode;
  path: string;
  message: string;
}

export interface StoryBranch {
  id: string;
  base: string;
  title: string;
  premise: string;
  changedScenes: string[];
  changedCanonFacts: string[];
  impactSummary: string;
  status: StoryBranchStatus;
  createdAt: string;
}

export interface StoryPromise {
  id: string;
  type: StoryPromiseType;
  promise: string;
  establishedAt: string;
  reinforcedAt: string[];
  paidOffAt?: string;
  invertedAt?: string;
  status: StoryPromiseStatus;
  readerExpectation: string;
}

export interface TensionPoint {
  chapter: string;
  scene?: string;
  tension: number;
  emotionalCharge: number;
  informationGain: number;
  payoff: number;
}

export interface RhythmConfig {
  schemaVersion: '1.0';
  sourceMode: 'manual-abstract';
  safetyBoundary: string;
  averageChapterLength: {
    min: number;
    target: number;
    max: number;
  };
  hookFrequency: {
    everyChapters: number;
  };
  payoffInterval: {
    everyChapters: number;
  };
  dialogueActionDescriptionRatio: {
    dialogue: number;
    action: number;
    description: number;
  };
  tensionPattern: string[];
  infoRevealDensity: {
    targetPerChapter: number;
  };
  notes: string[];
}

export interface PromiseIssue {
  severity: 'error' | 'warning' | 'info';
  code: PromiseIssueCode;
  path: string;
  evidence?: string;
  message: string;
  suggestedAction: string;
}

export interface ResearchSource {
  id: string;
  title: string;
  type: ResearchSourceType;
  path?: string;
  url?: string;
  accessedAt?: string;
  notes: string[];
}

export interface CitationLink {
  sourceId: string;
  targetPath: string;
  targetId?: string;
  reason: string;
}

export interface ResearchIssue {
  severity: 'error' | 'warning' | 'info';
  code: ResearchIssueCode;
  path: string;
  message: string;
  suggestedAction: string;
}

export interface StyleRule {
  id: string;
  description: string;
  pattern: string;
  severity: StyleRuleSeverity;
  suggestion: string;
  regex?: boolean;
  enabled?: boolean;
}

export interface StyleLintFinding {
  severity: StyleLintSeverity;
  code: StyleIssueCode;
  ruleId: string;
  path: string;
  evidence: string;
  message: string;
  suggestion: string;
}

export interface CompileChapter {
  path: string;
  title: string;
  order: number;
  wordCount: number;
}

export interface CompileWarning {
  severity: 'warning' | 'info';
  code: CompileWarningCode;
  path: string;
  message: string;
}

export interface ReaderFeedback {
  id: string;
  source: string;
  targetPath: string;
  type: ReaderFeedbackType;
  comment: string;
  suggestedAction?: string;
  status: ReaderFeedbackStatus;
  createdAt: string;
}
