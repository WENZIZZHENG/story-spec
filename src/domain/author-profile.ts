export type AuthorProfileEntryStatus = 'provisional' | 'confirmed' | 'deprecated';
export type AuthorProfileEntryCategory = 'genre' | 'pacing' | 'voice' | 'boundary' | 'pattern';
export type AuthorProfileEntrySource = 'sampled' | 'user-explicit' | 'inferred' | 'imported';

export interface AuthorProfileEntry {
  id: string;
  category: AuthorProfileEntryCategory;
  label: string;
  value: string;
  status: AuthorProfileEntryStatus;
  source: AuthorProfileEntrySource;
  evidence: string[];
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  ignored?: boolean;
  notes?: string;
}

export interface AuthorProfile {
  schemaVersion: '1.0';
  updatedAt: string;
  notes: string[];
  entries: AuthorProfileEntry[];
}

export interface AuthorProfileSampleQuestion {
  id: AuthorProfileEntryCategory;
  label: string;
  question: string;
  whyItMatters: string;
  examples: string[];
  skippable: boolean;
}

export interface AuthorProfileSummary {
  path: string;
  exists: boolean;
  activeHints: string[];
  confirmedCount: number;
  provisionalCount: number;
  deprecatedCount: number;
  ignoredCount: number;
  firstUse: boolean;
  hasReusableHints: boolean;
  sampleQuestions: AuthorProfileSampleQuestion[];
}

export interface AuthorProfileIssue {
  severity: 'error' | 'warning' | 'info';
  code: 'AUTHOR_PROFILE_INVALID' | 'AUTHOR_PROFILE_UNSUPPORTED_VERSION';
  path: string;
  message: string;
  suggestedAction: string;
}
