import path from 'node:path';
import type { ProjectFileSystem } from './project-ports.js';
import { inspectScenes } from './inspect-story-structure.js';
import type {
  CompileChapter,
  CompileWarning
} from '../domain/workbench.js';
import {
  relativePath,
  resolveProjectPath,
  selectStoryProject,
  toPosixPath,
  unique
} from './workbench-utils.js';

export interface CompileManuscriptInput {
  projectRoot: string;
  fileSystem: ProjectFileSystem;
  story?: string;
  format?: 'markdown';
  withFrontmatter?: boolean;
  includeAppendix?: boolean;
  writtenOnly?: boolean;
  check?: boolean;
  now?: () => Date;
}

export interface CompileManuscriptResult {
  projectRoot: string;
  story: string;
  format: 'markdown';
  outputPath: string;
  frontmatterPath?: string;
  reportPath: string;
  written: boolean;
  chapters: CompileChapter[];
  warnings: CompileWarning[];
  totalWordCount: number;
}

const buildDir = (projectRoot: string): string => path.join(projectRoot, 'build');
const reportsDir = (projectRoot: string): string => path.join(buildDir(projectRoot), 'reports');
const manuscriptPath = (projectRoot: string): string => path.join(buildDir(projectRoot), 'manuscript.md');
const frontmatterPath = (projectRoot: string): string => path.join(buildDir(projectRoot), 'manuscript.frontmatter.json');
const reportPath = (projectRoot: string): string => path.join(reportsDir(projectRoot), 'manuscript-report.json');

const listMarkdownFiles = async (
  fs: ProjectFileSystem,
  dirPath: string
): Promise<string[]> => {
  if (!await fs.pathExists(dirPath)) {
    return [];
  }

  const files: string[] = [];
  for (const entry of await fs.readDir(dirPath)) {
    const entryPath = path.join(dirPath, entry);
    const stat = await fs.stat(entryPath);
    if (stat.isDirectory()) {
      files.push(...await listMarkdownFiles(fs, entryPath));
    } else if (stat.isFile() && entry.endsWith('.md')) {
      files.push(entryPath);
    }
  }

  return files.sort();
};

const stripMarkdown = (content: string): string =>
  content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/^#+\s+.*$/gm, ' ')
    .replace(/[*_>#\-|]/g, ' ');

export const countWords = (content: string): number => {
  const plain = stripMarkdown(content);
  const han = plain.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const words = plain.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length ?? 0;
  return han + words;
};

const readTitle = (content: string, fallback: string): string => {
  const heading = content.split(/\r?\n/).find(line => /^#\s+/.test(line));
  return heading ? heading.replace(/^#\s+/, '').trim() : fallback;
};

const sceneOrderedChapterPaths = async (
  input: CompileManuscriptInput,
  storyName: string,
  storyPath: string
): Promise<{ paths: string[]; warnings: CompileWarning[] }> => {
  const scenes = await inspectScenes({
    projectRoot: input.projectRoot,
    fileSystem: input.fileSystem,
    story: storyName
  });
  const warnings: CompileWarning[] = [];
  const ordered = scenes.scenes
    .map(scene => {
      const relativeDraftPath = scene.draftPath ?? `content/${scene.chapter}.md`;
      const absolutePath = resolveProjectPath(input.projectRoot, relativePath(input.projectRoot, path.join(storyPath, relativeDraftPath)));
      return {
        scene,
        absolutePath
      };
    })
    .sort((left, right) =>
      left.scene.chapter.localeCompare(right.scene.chapter)
      || left.scene.order - right.scene.order
      || left.scene.id.localeCompare(right.scene.id)
    );

  for (const item of ordered) {
    if (!input.writtenOnly && !await input.fileSystem.pathExists(item.absolutePath)) {
      warnings.push({
        severity: 'warning',
        code: 'MISSING_CHAPTER_FILE',
        path: relativePath(input.projectRoot, item.absolutePath),
        message: `SceneCard ${item.scene.id} 指向的章节文件不存在`
      });
    }
  }

  return {
    paths: unique(ordered
      .map(item => item.absolutePath)
      .filter((filePath, index, all) => all.indexOf(filePath) === index)),
    warnings
  };
};

const collectChapterPaths = async (
  input: CompileManuscriptInput,
  storyName: string,
  storyPath: string
): Promise<{ paths: string[]; warnings: CompileWarning[] }> => {
  const sceneOrdered = await sceneOrderedChapterPaths(input, storyName, storyPath);
  const existingScenePaths: string[] = [];
  for (const filePath of sceneOrdered.paths) {
    if (await input.fileSystem.pathExists(filePath)) {
      existingScenePaths.push(filePath);
    }
  }

  if (existingScenePaths.length > 0) {
    return {
    paths: existingScenePaths,
    warnings: input.writtenOnly ? [] : sceneOrdered.warnings
  };
}

  const contentFiles = await listMarkdownFiles(input.fileSystem, path.join(storyPath, 'content'));
  return {
    paths: contentFiles,
    warnings: [
      ...sceneOrdered.warnings,
      ...(contentFiles.length === 0
        ? [{
          severity: 'warning' as const,
          code: 'NO_CHAPTERS_FOUND' as const,
          path: relativePath(input.projectRoot, path.join(storyPath, 'content')),
          message: '没有找到可编译的 Markdown 章节'
        }]
        : [])
    ]
  };
};

const renderManuscript = (
  story: string,
  chapters: ReadonlyArray<CompileChapter & { content: string }>,
  includeAppendix: boolean
): string => [
  `# ${story}`,
  '',
  ...chapters.flatMap(chapter => [
    `<!-- source: ${chapter.path}; words: ${chapter.wordCount} -->`,
    chapter.content.trim(),
    ''
  ]),
  ...(includeAppendix
    ? [
      '---',
      '',
      '## Appendix',
      '',
      `- Chapters: ${chapters.length}`,
      `- Words: ${chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)}`
    ]
    : [])
].join('\n').trimEnd() + '\n';

export const compileManuscript = async (
  input: CompileManuscriptInput
): Promise<CompileManuscriptResult> => {
  const format = input.format ?? 'markdown';
  const story = await selectStoryProject(input.projectRoot, input.fileSystem, input.story);
  const warnings: CompileWarning[] = [];

  if (format !== 'markdown') {
    warnings.push({
      severity: 'warning',
      code: 'UNSUPPORTED_COMPILE_FORMAT',
      path: 'build/manuscript.md',
      message: `当前仅支持 markdown，已使用 markdown 输出：${format}`
    });
  }

  const collected = await collectChapterPaths(input, story.name, story.path);
  warnings.push(...collected.warnings);
  const chapterEntries: Array<CompileChapter & { content: string }> = [];

  for (const [index, filePath] of collected.paths.entries()) {
    if (!await input.fileSystem.pathExists(filePath)) {
      continue;
    }

    const content = await input.fileSystem.readFile(filePath);
    const chapter: CompileChapter & { content: string } = {
      path: relativePath(input.projectRoot, filePath),
      title: readTitle(content, path.basename(filePath, '.md')),
      order: index + 1,
      wordCount: countWords(content),
      content
    };
    chapterEntries.push(chapter);
  }

  const output = manuscriptPath(input.projectRoot);
  const report = reportPath(input.projectRoot);
  const totalWordCount = chapterEntries.reduce((sum, chapter) => sum + chapter.wordCount, 0);
  const chapters = chapterEntries.map(({ content: _content, ...chapter }) => chapter);
  const result: CompileManuscriptResult = {
    projectRoot: input.projectRoot,
    story: story.name,
    format: 'markdown',
    outputPath: output,
    frontmatterPath: input.withFrontmatter ? frontmatterPath(input.projectRoot) : undefined,
    reportPath: report,
    written: !input.check,
    chapters,
    warnings,
    totalWordCount
  };

  if (input.check) {
    return result;
  }

  await input.fileSystem.ensureDir(buildDir(input.projectRoot));
  await input.fileSystem.ensureDir(reportsDir(input.projectRoot));
  await input.fileSystem.writeFile(output, renderManuscript(story.name, chapterEntries, input.includeAppendix ?? false));

  if (input.withFrontmatter) {
    await input.fileSystem.writeJson(frontmatterPath(input.projectRoot), {
      schemaVersion: '1.0',
      story: story.name,
      format: 'markdown',
      generatedAt: (input.now ?? (() => new Date()))().toISOString(),
      totalWordCount,
      chapters
    }, { spaces: 2 });
  }

  await input.fileSystem.writeJson(report, {
    schemaVersion: '1.0',
    story: story.name,
    outputPath: relativePath(input.projectRoot, output),
    frontmatterPath: result.frontmatterPath ? relativePath(input.projectRoot, result.frontmatterPath) : undefined,
    totalWordCount,
    chapters,
    warnings
  }, { spaces: 2 });

  return result;
};

export const renderCompileResult = (result: CompileManuscriptResult): string => [
  'Compile Manuscript',
  '',
  `故事：${result.story}`,
  `格式：${result.format}`,
  `写入：${result.written ? '是' : '否（check 模式）'}`,
  `输出：${toPosixPath(result.outputPath)}`,
  ...(result.frontmatterPath ? [`Frontmatter：${toPosixPath(result.frontmatterPath)}`] : []),
  `Report：${toPosixPath(result.reportPath)}`,
  `章节：${result.chapters.length}`,
  `字数：${result.totalWordCount}`,
  `Warnings：${result.warnings.length}`,
  '',
  ...(result.chapters.length > 0
    ? result.chapters.map(chapter => `- #${chapter.order} ${chapter.title}：${chapter.wordCount} 字（${chapter.path}）`)
    : ['- 暂无章节']),
  '',
  ...(result.warnings.length > 0
    ? result.warnings.map(warning => `- [${warning.severity}] ${warning.code}: ${toPosixPath(warning.path)} - ${warning.message}`)
    : [])
].join('\n').trimEnd();
