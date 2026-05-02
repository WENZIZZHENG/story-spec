import {
  getCodexStatus,
  getProjectStatus,
  renderCodexStatus,
  renderProjectStatus
} from '../application/get-project-status.js';
import { commandGitAdapter } from '../infrastructure/command-git-adapter.js';
import { nodeFileSystem } from '../infrastructure/node-file-system.js';

export {
  getProjectStatus,
  renderCodexStatus,
  renderProjectStatus,
  type CodexStatus,
  type GitSummary,
  type ProjectStatus,
  type StorySummary,
  type TrackingSummary
} from '../application/get-project-status.js';

export const getCodexStatusWithNodeAdapters = (projectRoot: string) => getCodexStatus({
  projectRoot,
  fileSystem: nodeFileSystem,
  git: commandGitAdapter
});

export { getCodexStatusWithNodeAdapters as getCodexStatus };
