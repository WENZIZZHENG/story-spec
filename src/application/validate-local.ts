import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';

export interface LocalValidationIssue {
  code: 'MISSING_LOCAL_FILE' | 'INVALID_LOCAL_JSON';
  path: string;
  message: string;
}

export interface LocalValidationResult {
  projectRoot: string;
  valid: boolean;
  checkedFiles: number;
  checkedJson: number;
  issues: LocalValidationIssue[];
}

export interface ValidateLocalInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
}

const REQUIRED_PATHS = [
  'CONTINUE.md',
  path.join('.specify', 'config.json'),
  'stories',
  path.join('spec', 'tracking')
];

const createMissingIssue = (filePath: string): LocalValidationIssue => ({
  code: 'MISSING_LOCAL_FILE',
  path: filePath,
  message: `缺少本地验证所需路径：${filePath}`
});

const createInvalidJsonIssue = (filePath: string, detail: string): LocalValidationIssue => ({
  code: 'INVALID_LOCAL_JSON',
  path: filePath,
  message: `JSON 无法解析：${filePath} (${detail})`
});

export const validateLocalProject = async (
  input: ValidateLocalInput
): Promise<LocalValidationResult> => {
  const { projectRoot, fileSystem: fs } = input;
  const issues: LocalValidationIssue[] = [];
  let checkedFiles = 0;
  let checkedJson = 0;

  for (const relativePath of REQUIRED_PATHS) {
    const absolutePath = path.join(projectRoot, relativePath);
    checkedFiles += 1;
    if (!await fs.pathExists(absolutePath)) {
      issues.push(createMissingIssue(absolutePath));
    }
  }

  const trackingDir = path.join(projectRoot, 'spec', 'tracking');
  if (await fs.pathExists(trackingDir)) {
    const files = (await fs.readDir(trackingDir)).filter(file => file.endsWith('.json')).sort();
    for (const file of files) {
      const filePath = path.join(trackingDir, file);
      checkedJson += 1;
      try {
        JSON.parse(await fs.readFile(filePath));
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        issues.push(createInvalidJsonIssue(filePath, detail));
      }
    }
  }

  return {
    projectRoot,
    valid: issues.length === 0,
    checkedFiles,
    checkedJson,
    issues
  };
};

export const renderLocalValidation = (result: LocalValidationResult): string => {
  const lines = [
    'StorySpec 本地轻量验证',
    '',
    `根目录：${result.projectRoot}`,
    `结果：${result.valid ? '通过' : '失败'}`,
    `检查路径：${result.checkedFiles}`,
    `检查 JSON：${result.checkedJson}`
  ];

  if (result.issues.length > 0) {
    lines.push('', '问题列表：');
    for (const issue of result.issues) {
      lines.push(`- ${issue.code}: ${issue.path} - ${issue.message}`);
    }
  }

  return lines.join('\n');
};
