#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(dirname, '..', '..');
const changesDir = path.join(rootDir, 'changes');

const requiredSections = [
  '## CLI 行为',
  '## 模板契约',
  '## 生成产物',
  '## 验证'
] as const;

const allowedChangeTypes = new Set(['major', 'minor', 'patch', 'none']);

const parseFrontmatter = (content: string): Map<string, string> => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const metadata = new Map<string, string>();

  if (!match) {
    return metadata;
  }

  for (const line of match[1].split(/\r?\n/)) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) {
      metadata.set(key, value);
    }
  }

  return metadata;
};

const getSectionBody = (content: string, heading: string): string => {
  const startIndex = content.indexOf(heading);
  if (startIndex === -1) {
    return '';
  }

  const afterHeading = content.slice(startIndex + heading.length);
  const nextHeadingIndex = afterHeading.search(/\r?\n##\s+/);
  const body = nextHeadingIndex === -1
    ? afterHeading
    : afterHeading.slice(0, nextHeadingIndex);

  return body.replace(/<!--[\s\S]*?-->/g, '').trim();
};

const validateRecord = async (fileName: string): Promise<string[]> => {
  const filePath = path.join(changesDir, fileName);
  const content = await readFile(filePath, 'utf-8');
  const issues: string[] = [];

  if (!/^#\s+\S/m.test(content)) {
    issues.push('缺少一级标题');
  }

  const metadata = parseFrontmatter(content);
  const changeType = metadata.get('change_type');
  if (!changeType) {
    issues.push('缺少 frontmatter 字段 change_type');
  } else if (!allowedChangeTypes.has(changeType)) {
    issues.push(`change_type 必须是 ${[...allowedChangeTypes].join(', ')} 之一`);
  }

  if (!metadata.get('scope')) {
    issues.push('缺少 frontmatter 字段 scope');
  }

  for (const section of requiredSections) {
    const body = getSectionBody(content, section);
    if (!body) {
      issues.push(`缺少非空章节：${section}`);
    }
  }

  return issues.map(issue => `${fileName}: ${issue}`);
};

const main = async (): Promise<void> => {
  const entries = await readdir(changesDir, { withFileTypes: true });
  const changeFiles = entries
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .filter(name => name.endsWith('.md') && name.toLowerCase() !== 'readme.md')
    .sort();

  if (changeFiles.length === 0) {
    console.error('变更记录检查失败：changes/ 目录下没有可发布变更记录。');
    process.exit(1);
  }

  const issueGroups = await Promise.all(changeFiles.map(validateRecord));
  const issues = issueGroups.flat();

  if (issues.length > 0) {
    console.error('变更记录检查失败：');
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  console.log(`变更记录检查通过：${changeFiles.length} 个文件。`);
};

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
