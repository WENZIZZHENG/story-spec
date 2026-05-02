export type ContextPackPurpose = 'write' | 'review' | 'revise' | 'handoff' | 'branch';
export type DraftStatus = 'draft' | 'reviewed' | 'approved' | 'published';
export type NarrativeTestStatus = 'pass' | 'fail' | 'warning';
export type NarrativeTestSeverity = 'error' | 'warning' | 'info';

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
