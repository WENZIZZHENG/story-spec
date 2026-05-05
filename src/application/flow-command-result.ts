export type FlowCommandMode = 'preview' | 'apply' | 'commit';
export type FlowCommandCheckStatus = 'passed' | 'failed' | 'skipped';

export interface FlowCommandCheck {
  id?: string;
  name?: string;
  label?: string;
  command?: string;
  status: FlowCommandCheckStatus;
  message?: string;
  paths?: string[];
  exitCode?: number;
}

export interface FlowCommandCommit {
  requested: boolean;
  created: boolean;
  message?: string;
  skippedReason?: string;
}

export interface FlowCommandResultBase {
  mode: FlowCommandMode;
  wouldWrite: string[];
  updatedFiles: string[];
  checks: FlowCommandCheck[];
  blocked: boolean;
  blockedReasons: string[];
  nextActions: string[];
  commit: FlowCommandCommit;
}
