import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

interface CommandRow {
  command: string;
  description: string;
}

const readReadme = async (): Promise<string> =>
  readFile(path.join(process.cwd(), 'README.md'), 'utf-8');

const getHighFrequencyCommandRows = (readme: string): CommandRow[] => {
  const sectionStart = readme.indexOf('## 高频命令');
  const sectionEnd = readme.indexOf('## Agent 命令输出位置', sectionStart);
  const section = readme.slice(sectionStart, sectionEnd);

  return section
    .split(/\r?\n/)
    .filter(line => line.startsWith('| `'))
    .map(line => {
      const cells = line.split('|').map(cell => cell.trim()).filter(Boolean);

      return {
        command: cells[0].replace(/`/g, ''),
        description: cells[1] ?? ''
      };
    });
};

describe('README fact boundaries', () => {
  it('does not repeat commands in the high-frequency command tables', async () => {
    const rows = getHighFrequencyCommandRows(await readReadme());
    const commandCounts = new Map<string, number>();

    for (const row of rows) {
      commandCounts.set(row.command, (commandCounts.get(row.command) ?? 0) + 1);
    }

    const duplicateCommands = [...commandCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([command]) => command);

    expect(duplicateCommands).toEqual([]);
  });

  it('keeps App and Server descriptions scoped to implemented capabilities', async () => {
    const rows = getHighFrequencyCommandRows(await readReadme());
    const rowByCommand = new Map(rows.map(row => [row.command, row.description]));

    expect(rowByCommand.get('storyspec app [--project <path>]')).toContain('实验性本机 Web 工作台');
    expect(rowByCommand.get('storyspec app [--project <path>]')).toContain('首批前端架构契约和 API 地图');
    expect(rowByCommand.get('storyspec app [--project <path>]')).toContain('仍不包含账号、云端、实时协作或富文本编辑器');
    expect(rowByCommand.get('storyspec server [--host <host>] [--port <port>]')).toContain('实验性多用户控制平面');
    expect(rowByCommand.get('storyspec server [--host <host>] [--port <port>]')).toContain('当前不包含完整 SaaS、独立前端项目或实时协作');
    expect(rowByCommand.get('storyspec worker [--once]')).toContain('preview-only');
    expect(rowByCommand.get('storyspec worker [--once]')).toContain('不自动写入正文或正典');
  });
});
