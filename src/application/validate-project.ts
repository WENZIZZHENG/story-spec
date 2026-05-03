import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import type { ArtifactIssue } from '../validation/artifact-scanner.js';
import { scanStoryArtifacts } from '../validation/artifact-scanner.js';
import {
  validateTrackingDocument,
  validateWritingTask,
  type ValidationIssue,
  type ValidationSeverity
} from '../validation/schema/index.js';
import {
  createDefaultWritingRules,
  runWritingRules,
  type WritingRuleIssue
} from '../validation/rules/writing-rules.js';
import {
  parseCanonDocument,
  parseWorldDocument,
  type WorldbuildingIssue
} from '../domain/worldbuilding.js';
import {
  inspectScenes,
  inspectStoryGraph
} from './inspect-story-structure.js';
import type { StoryStructureIssue } from '../domain/story-structure.js';
import { inspectVoice } from './inspect-voice.js';
import type { VoiceIssue } from '../domain/voice.js';
import { inspectPreset } from './manage-presets.js';
import type { PresetDoctorIssue } from './manage-presets.js';
import {
  countIssuesBySeverity,
  filterIssuesBySeverity,
  sortIssuesBySeverity
} from '../validation/severity.js';
import { getCommandOutputFileNamesFromEntries } from '../prompt/command-source.js';
import {
  createEmptyStoryStageCounts,
  type StoryMaturityStage
} from '../domain/story-stage.js';

export type ProjectValidationIssueCode =
  | ValidationIssue['code']
  | ArtifactIssue['code']
  | WritingRuleIssue['code']
  | WorldbuildingIssue['code']
  | StoryStructureIssue['code']
  | VoiceIssue['code']
  | PresetDoctorIssue['code']
  | 'MISSING_PROJECT_CONFIG'
  | 'MISSING_PROJECT_DIR'
  | 'MISSING_WORLD_DIR'
  | 'MISSING_CANON_DIR'
  | 'MISSING_GRAPH_DIR'
  | 'MISSING_VOICE_DIR'
  | 'MISSING_TEMPLATE'
  | 'MISSING_AGENT_CONTRACT'
  | 'MISSING_AGENTS_FILE'
  | 'MISSING_AGENT_COMMAND';

export interface ProjectValidationIssue {
  severity: ValidationSeverity;
  code: ProjectValidationIssueCode;
  path: string;
  message: string;
}

export interface ProjectValidationSummary {
  stories: number;
  tasks: number;
  trackingFiles: number;
  templatesChecked: number;
  agentCommandsChecked: number;
  worldFiles: number;
  canonFiles: number;
  graphEntities: number;
  graphEdges: number;
  scenes: number;
  voiceFingerprints: number;
  storyStages: Record<StoryMaturityStage, number>;
  activePreset?: string;
}

export interface ProjectValidationResult {
  projectRoot: string;
  valid: boolean;
  summary: ProjectValidationSummary;
  issueCounts: Record<ValidationSeverity, number>;
  issues: ProjectValidationIssue[];
}

export interface ValidateProjectInput {
  projectRoot: string;
  packageRoot?: string;
  fileSystem: ProjectFileSystem;
}

export interface RenderProjectValidationOptions {
  minSeverity?: ValidationSeverity;
}

interface TemplateValidationResult {
  templatesChecked: number;
  issues: ProjectValidationIssue[];
}

interface AgentContractValidationResult {
  agentCommandsChecked: number;
  issues: ProjectValidationIssue[];
}

const createIssue = (
  code: ProjectValidationIssueCode,
  pathValue: string,
  message: string,
  severity: ValidationSeverity = 'error'
): ProjectValidationIssue => ({
  severity,
  code,
  path: pathValue,
  message
});

const toProjectIssue = (issue: ValidationIssue | ArtifactIssue | WritingRuleIssue): ProjectValidationIssue => ({
  severity: issue.severity,
  code: issue.code,
  path: issue.path,
  message: issue.message
});

const toWorldbuildingProjectIssue = (issue: WorldbuildingIssue): ProjectValidationIssue => ({
  severity: issue.severity,
  code: issue.code,
  path: issue.path,
  message: issue.message
});

const toStoryStructureProjectIssue = (issue: StoryStructureIssue): ProjectValidationIssue => ({
  severity: issue.severity,
  code: issue.code,
  path: issue.path,
  message: issue.message
});

const toVoiceProjectIssue = (issue: VoiceIssue): ProjectValidationIssue => ({
  severity: issue.severity,
  code: issue.code,
  path: issue.path,
  message: issue.message
});

const toPresetProjectIssue = (issue: PresetDoctorIssue): ProjectValidationIssue => ({
  severity: issue.severity,
  code: issue.code,
  path: issue.path,
  message: issue.message
});

const listFiles = async (
  fs: ProjectFileSystem,
  rootDir: string,
  currentDir = rootDir
): Promise<string[]> => {
  if (!await fs.pathExists(rootDir)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of await fs.readDir(currentDir)) {
    const entryPath = path.join(currentDir, entry);
    const stat = await fs.stat(entryPath);
    if (stat.isDirectory()) {
      files.push(...await listFiles(fs, rootDir, entryPath));
    } else if (stat.isFile()) {
      files.push(path.relative(rootDir, entryPath).split(path.sep).join('/'));
    }
  }

  return files.sort();
};

const validateProjectStructure = async (
  fs: ProjectFileSystem,
  projectRoot: string
): Promise<ProjectValidationIssue[]> => {
  const requiredDirs = ['.specify', '.specify/templates', 'stories', 'spec', 'spec/tracking'];
  const issues: ProjectValidationIssue[] = [];
  const configPath = path.join(projectRoot, '.specify', 'config.json');

  if (!await fs.pathExists(configPath)) {
    issues.push(createIssue('MISSING_PROJECT_CONFIG', configPath, '缺少 .specify/config.json'));
  }

  for (const dir of requiredDirs) {
    const dirPath = path.join(projectRoot, dir);
    if (!await fs.pathExists(dirPath)) {
      issues.push(createIssue('MISSING_PROJECT_DIR', dirPath, `缺少项目目录：${dir}`, 'warning'));
    }
  }

  return issues;
};

const validateTrackingFiles = async (
  fs: ProjectFileSystem,
  projectRoot: string
): Promise<{ count: number; issues: ProjectValidationIssue[] }> => {
  const trackingDir = path.join(projectRoot, 'spec', 'tracking');
  if (!await fs.pathExists(trackingDir)) {
    return { count: 0, issues: [] };
  }

  const files = (await fs.readDir(trackingDir)).filter(file => file.endsWith('.json')).sort();
  const issues: ProjectValidationIssue[] = [];

  for (const file of files) {
    const filePath = path.join(trackingDir, file);
    try {
      const document = JSON.parse(await fs.readFile(filePath));
      issues.push(...validateTrackingDocument(document, filePath).map(toProjectIssue));
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      issues.push(createIssue('INVALID_TRACKING_JSON', filePath, `tracking JSON 无效：${file} (${detail})`));
    }
  }

  return { count: files.length, issues };
};

const validateWorldFiles = async (
  fs: ProjectFileSystem,
  projectRoot: string
): Promise<{ count: number; issues: ProjectValidationIssue[] }> => {
  const worldDir = path.join(projectRoot, 'spec', 'world');
  if (!await fs.pathExists(worldDir)) {
    return {
      count: 0,
      issues: [createIssue('MISSING_WORLD_DIR', worldDir, '缺少 spec/world；旧项目可运行 upgrade 补齐 World Bible 模板', 'warning')]
    };
  }

  const files = (await fs.readDir(worldDir))
    .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
    .sort();
  const issues: ProjectValidationIssue[] = [];

  for (const file of files) {
    const filePath = path.join(worldDir, file);
    const result = parseWorldDocument(await fs.readFile(filePath), filePath);
    issues.push(...result.issues.map(toWorldbuildingProjectIssue));
  }

  return { count: files.length, issues };
};

const validateCanonFiles = async (
  fs: ProjectFileSystem,
  projectRoot: string
): Promise<{ count: number; issues: ProjectValidationIssue[] }> => {
  const canonDir = path.join(projectRoot, 'spec', 'canon');
  if (!await fs.pathExists(canonDir)) {
    return {
      count: 0,
      issues: [createIssue('MISSING_CANON_DIR', canonDir, '缺少 spec/canon；旧项目可运行 upgrade 补齐 Canon Ledger 模板', 'warning')]
    };
  }

  const files = (await fs.readDir(canonDir))
    .filter(file => file.endsWith('.json'))
    .sort();
  const issues: ProjectValidationIssue[] = [];

  for (const file of files) {
    const filePath = path.join(canonDir, file);
    const result = parseCanonDocument(await fs.readFile(filePath), filePath);
    issues.push(...result.issues.map(toWorldbuildingProjectIssue));
  }

  return { count: files.length, issues };
};

const validateStoryStructureFiles = async (
  fs: ProjectFileSystem,
  projectRoot: string
): Promise<{
  graphEntities: number;
  graphEdges: number;
  scenes: number;
  issues: ProjectValidationIssue[];
}> => {
  const graphDir = path.join(projectRoot, 'spec', 'graph');
  const issues: ProjectValidationIssue[] = [];

  if (!await fs.pathExists(graphDir)) {
    issues.push(createIssue('MISSING_GRAPH_DIR', graphDir, '缺少 spec/graph；旧项目可运行 upgrade 补齐 Entity Graph 模板', 'warning'));
  }

  const graph = await inspectStoryGraph({ projectRoot, fileSystem: fs });
  const sceneResult = await inspectScenes({ projectRoot, fileSystem: fs });

  return {
    graphEntities: graph.entities.length,
    graphEdges: graph.edges.length,
    scenes: sceneResult.scenes.length,
    issues: [
      ...issues,
      ...graph.issues.map(toStoryStructureProjectIssue),
      ...sceneResult.issues.map(toStoryStructureProjectIssue)
    ]
  };
};

const validateVoiceFiles = async (
  fs: ProjectFileSystem,
  projectRoot: string
): Promise<{ voiceFingerprints: number; issues: ProjectValidationIssue[] }> => {
  const voiceDir = path.join(projectRoot, 'spec', 'voice');
  const issues: ProjectValidationIssue[] = [];

  if (!await fs.pathExists(voiceDir)) {
    issues.push(createIssue('MISSING_VOICE_DIR', voiceDir, '缺少 spec/voice；旧项目可运行 upgrade 补齐 VoiceFingerprint 模板', 'warning'));
  }

  const voice = await inspectVoice({ projectRoot, fileSystem: fs });

  return {
    voiceFingerprints: voice.fingerprints.length,
    issues: [
      ...issues,
      ...voice.issues.map(toVoiceProjectIssue)
    ]
  };
};

const validateTemplates = async (
  fs: ProjectFileSystem,
  projectRoot: string,
  packageRoot?: string
): Promise<TemplateValidationResult> => {
  if (!packageRoot) {
    return { templatesChecked: 0, issues: [] };
  }

  const sourceRoot = path.join(packageRoot, 'templates');
  const targetRoot = path.join(projectRoot, '.specify', 'templates');
  const templates = await listFiles(fs, sourceRoot);
  const issues: ProjectValidationIssue[] = [];

  for (const template of templates) {
    const targetPath = path.join(targetRoot, ...template.split('/'));
    if (!await fs.pathExists(targetPath)) {
      issues.push(createIssue('MISSING_TEMPLATE', targetPath, `缺少模板：${template}`));
    }
  }

  return {
    templatesChecked: templates.length,
    issues
  };
};

const readProjectConfig = async (
  fs: ProjectFileSystem,
  projectRoot: string
): Promise<Record<string, unknown>> => {
  const configPath = path.join(projectRoot, '.specify', 'config.json');
  if (!await fs.pathExists(configPath)) {
    return {};
  }

  try {
    return await fs.readJson<Record<string, unknown>>(configPath);
  } catch {
    return {};
  }
};

const declaresGenericIntegration = (config: Record<string, unknown>): boolean => {
  if (config.agent === 'generic' || config.ai === 'generic') {
    return true;
  }

  if (!Array.isArray(config.integrations)) {
    return false;
  }

  return config.integrations.some(integration => {
    if (integration === 'generic') {
      return true;
    }

    return typeof integration === 'object'
      && integration !== null
      && 'id' in integration
      && integration.id === 'generic';
  });
};

const listExpectedGenericCommands = async (
  fs: ProjectFileSystem,
  packageRoot?: string
): Promise<string[]> => {
  if (!packageRoot) {
    return [];
  }

  const sourceDir = path.join(packageRoot, 'templates', 'commands');
  if (!await fs.pathExists(sourceDir)) {
    return [];
  }

  return getCommandOutputFileNamesFromEntries(await fs.readDir(sourceDir));
};

const validateAgentContract = async (
  fs: ProjectFileSystem,
  projectRoot: string,
  packageRoot?: string
): Promise<AgentContractValidationResult> => {
  const issues: ProjectValidationIssue[] = [];
  const contractPath = path.join(projectRoot, '.specify', 'agent-contract.md');
  const agentsPath = path.join(projectRoot, 'AGENTS.md');

  if (!await fs.pathExists(contractPath)) {
    issues.push(createIssue(
      'MISSING_AGENT_CONTRACT',
      contractPath,
      '缺少 .specify/agent-contract.md，请运行 novel contract:sync'
    ));
  }

  if (!await fs.pathExists(agentsPath)) {
    issues.push(createIssue(
      'MISSING_AGENTS_FILE',
      agentsPath,
      '缺少 AGENTS.md，请运行 novel contract:sync'
    ));
  }

  const config = await readProjectConfig(fs, projectRoot);
  const commandsDir = path.join(projectRoot, '.specify', 'commands');
  const shouldCheckCommands = declaresGenericIntegration(config) || await fs.pathExists(commandsDir);
  if (!shouldCheckCommands) {
    return {
      agentCommandsChecked: 0,
      issues
    };
  }

  const expectedCommands = await listExpectedGenericCommands(fs, packageRoot);
  for (const commandFile of expectedCommands) {
    const commandPath = path.join(commandsDir, commandFile);
    if (!await fs.pathExists(commandPath)) {
      issues.push(createIssue(
        'MISSING_AGENT_COMMAND',
        commandPath,
        `缺少 generic command：.specify/commands/${commandFile}`
      ));
    }
  }

  return {
    agentCommandsChecked: expectedCommands.length,
    issues
  };
};

export const validateProject = async (input: ValidateProjectInput): Promise<ProjectValidationResult> => {
  const { projectRoot, fileSystem: fs } = input;
  const artifactScan = await scanStoryArtifacts({ projectRoot, fileSystem: fs });
  const trackingResult = await validateTrackingFiles(fs, projectRoot);
  const worldResult = await validateWorldFiles(fs, projectRoot);
  const canonResult = await validateCanonFiles(fs, projectRoot);
  const storyStructureResult = await validateStoryStructureFiles(fs, projectRoot);
  const voiceResult = await validateVoiceFiles(fs, projectRoot);
  const presetResult = await inspectPreset({ projectRoot, fileSystem: fs });
  const templateResult = await validateTemplates(fs, projectRoot, input.packageRoot);
  const agentContractResult = await validateAgentContract(fs, projectRoot, input.packageRoot);
  const writingRuleResult = await runWritingRules({
    projectRoot,
    fileSystem: fs,
    artifactScan,
    rules: createDefaultWritingRules()
  });
  const taskIssues = artifactScan.stories.flatMap(story =>
    story.tasks.flatMap(task =>
      validateWritingTask(task).map(issue => ({
        ...toProjectIssue(issue),
        path: `${task.tasksPath}#${task.id}:${issue.path}`
      }))
    )
  );
  const artifactIssues = artifactScan.issues
    .filter(issue => issue.code !== 'INVALID_TRACKING_JSON')
    .map(toProjectIssue);
  const issues = sortIssuesBySeverity([
    ...await validateProjectStructure(fs, projectRoot),
    ...artifactIssues,
    ...trackingResult.issues,
    ...worldResult.issues,
    ...canonResult.issues,
    ...storyStructureResult.issues,
    ...voiceResult.issues,
    ...presetResult.issues
      .filter(issue => issue.code !== 'NO_ACTIVE_PRESET')
      .map(toPresetProjectIssue),
    ...taskIssues,
    ...writingRuleResult.issues.map(toProjectIssue),
    ...agentContractResult.issues,
    ...templateResult.issues
  ]);
  const issueCounts = countIssuesBySeverity(issues);

  return {
    projectRoot,
    valid: issueCounts.error === 0,
    summary: {
      stories: artifactScan.stories.length,
      tasks: artifactScan.stories.reduce((total, story) => total + story.tasks.length, 0),
      trackingFiles: trackingResult.count,
      templatesChecked: templateResult.templatesChecked,
      agentCommandsChecked: agentContractResult.agentCommandsChecked,
      worldFiles: worldResult.count,
      canonFiles: canonResult.count,
      graphEntities: storyStructureResult.graphEntities,
      graphEdges: storyStructureResult.graphEdges,
      scenes: storyStructureResult.scenes,
      voiceFingerprints: voiceResult.voiceFingerprints,
      storyStages: artifactScan.stories.reduce((counts, story) => {
        counts[story.stage] += 1;
        return counts;
      }, createEmptyStoryStageCounts()),
      activePreset: presetResult.activePreset?.id
    },
    issueCounts,
    issues
  };
};

export const renderProjectValidation = (
  result: ProjectValidationResult,
  options: RenderProjectValidationOptions = {}
): string => {
  const visibleIssues = filterIssuesBySeverity(result.issues, options.minSeverity ?? 'info');
  const lines = [
    'Novel Writer 项目校验',
    '',
    `根目录：${result.projectRoot}`,
    `结果：${result.valid ? '通过' : '失败'}`,
    `故事：${result.summary.stories}`,
    `故事阶段：${Object.entries(result.summary.storyStages)
      .filter(([, count]) => count > 0)
      .map(([stage, count]) => `${stage}=${count}`)
      .join(', ') || '无'}`,
    `任务：${result.summary.tasks}`,
    `tracking JSON：${result.summary.trackingFiles}`,
    `world 文件：${result.summary.worldFiles}`,
    `canon 文件：${result.summary.canonFiles}`,
    `graph entities：${result.summary.graphEntities}`,
    `graph edges：${result.summary.graphEdges}`,
    `scene cards：${result.summary.scenes}`,
    `voice fingerprints：${result.summary.voiceFingerprints}`,
    `active preset：${result.summary.activePreset ?? '无'}`,
    `模板检查：${result.summary.templatesChecked}`,
    `generic commands：${result.summary.agentCommandsChecked}`,
    `问题：${result.issueCounts.error} error / ${result.issueCounts.warning} warning / ${result.issueCounts.info} info`
  ];

  if (visibleIssues.length > 0) {
    lines.push('', '问题列表：');
    for (const issue of visibleIssues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.path} - ${issue.message}`);
    }
  }

  return lines.join('\n');
};
