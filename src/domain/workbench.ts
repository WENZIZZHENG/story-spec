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
  | 'TENSION_LONG_FLATLINE';

export interface ContextPackItem {
  path: string;
  reason: string;
  required: boolean;
}

export interface ContextPack {
  schemaVersion: '1.0';
  id: string;
  purpose: ContextPackPurpose;
  story: string;
  targetTask?: string;
  targetChapter?: string;
  targetScene?: string;
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

export interface PromiseIssue {
  severity: 'error' | 'warning' | 'info';
  code: PromiseIssueCode;
  path: string;
  evidence?: string;
  message: string;
  suggestedAction: string;
}
