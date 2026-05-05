import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const packageRoot = process.cwd();

describe('authoring templates', () => {
  it('provides a chapter preflight constraint card in the chapter card template', async () => {
    const template = await readFile(
      path.join(packageRoot, 'templates', 'authoring', 'chapter-card.md'),
      'utf-8'
    );

    expect(template).toContain('## 时间点');
    expect(template).toContain('## 本章约束卡');
    expect(template).toContain('### 当前能力与语言水平');
    expect(template).toContain('### 本章情感检查点');
    expect(template).toContain('### 硬约束');
    expect(template).toContain('### 软约束');
    expect(template).toContain('## 写后自检对照');
    expect(template).toContain('内心独白措辞不超出当前语言水平');
    expect(template).toContain('资料不足时标为待确认');
    expect(template).toContain('## 写中沉浸原则');
    expect(template).toContain('约束卡用于写前确认和写后自检');
    expect(template).toContain('不作为正文生成时逐句审查器');
    expect(template).toContain('正文阶段优先身体感、感官、动作、当下反应和句子质感');
  });
});
