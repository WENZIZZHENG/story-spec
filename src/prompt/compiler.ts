import type { CommandSpec } from './command-spec.js';
import { parseCommandTemplate } from './frontmatter.js';

export type ScriptVariant = 'sh' | 'ps';

export type CommandOutputFormat =
  | 'markdown-full'
  | 'markdown-partial'
  | 'markdown-minimal'
  | 'markdown-generic'
  | 'markdown-none'
  | 'toml';

export interface CompileCommandTemplateInput {
  template: string;
  agent: string;
  argFormat: string;
  scriptVariant: ScriptVariant;
  outputFormat: CommandOutputFormat;
  runShell?: boolean;
  writeFiles?: boolean;
}

export interface CompileCommandSpecInput {
  spec: CommandSpec;
  promptBody: string;
  agent: string;
  argFormat: string;
  scriptVariant: ScriptVariant;
  outputFormat: CommandOutputFormat;
  runShell?: boolean;
  writeFiles?: boolean;
}

export const rewriteSpecifyPaths = (content: string): string => content
  .replace(/\.specify\/memory\//g, '__SPECIFY_MEMORY__')
  .replace(/\.specify\/scripts\//g, '__SPECIFY_SCRIPTS__')
  .replace(/\.specify\/templates\//g, '__SPECIFY_TEMPLATES__')
  .replace(/(^|[^.\w/-])memory\//g, '$1.specify/memory/')
  .replace(/(^|[^.\w/-])scripts\//g, '$1.specify/scripts/')
  .replace(/(^|[^.\w/-])templates\//g, '$1.specify/templates/')
  .replace(/__SPECIFY_MEMORY__/g, '.specify/memory/')
  .replace(/__SPECIFY_SCRIPTS__/g, '.specify/scripts/')
  .replace(/__SPECIFY_TEMPLATES__/g, '.specify/templates/');

const stripScriptsFromFrontmatter = (content: string): string => {
  const lines = content.split(/\r?\n/);
  let inFrontmatter = false;
  let dashCount = 0;
  let skipScripts = false;

  return lines
    .filter(line => {
      if (line === '---') {
        dashCount += 1;
        inFrontmatter = dashCount === 1;
        skipScripts = false;
        return true;
      }

      if (!inFrontmatter) {
        return true;
      }

      if (/^scripts:\s*$/.test(line)) {
        skipScripts = true;
        return false;
      }

      if (skipScripts && /^[A-Za-z].*:/.test(line)) {
        skipScripts = false;
      }

      if (skipScripts && /^\s+/.test(line)) {
        return false;
      }

      return true;
    })
    .join('\n');
};

const extractPromptBody = (compiledWithFrontmatter: string): string => {
  const match = compiledWithFrontmatter.match(/^---\n[\s\S]*?\n---\n?/);
  return match ? compiledWithFrontmatter.slice(match[0].length) : compiledWithFrontmatter;
};

const escapeTomlString = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const noShellScriptInstruction = '当前 agent 不支持 shell；不要执行 CLI/脚本，改为人工读取相关文件并记录无法自动验证的部分。';

const renderInputClarificationOnboarding = (
  description: string | undefined,
  argumentHint: string | undefined,
  argFormat: string
): string => {
  const normalizedHint = argumentHint?.trim();
  if (!normalizedHint) {
    return '';
  }

  return [
    '## 输入澄清引导',
    '',
    `本命令用途：${description ?? '执行 StorySpec 命令'}。`,
    '',
    `如果用户输入为空、只有空白、仍是未替换的 \`${argFormat}\` 占位符，或只是题材标签、风格词、偏好组合等不足以安全落盘的方向性描述：`,
    '- 不要立即创建、修改或删除文件。',
    `- 先提示用户补充 \`${normalizedHint}\`。`,
    '- 先区分“用户已明确”“需要澄清”“AI 可以提出但不能替用户定稿的建议”。',
    '- 提供 2-3 个可直接复制的示例输入或示例分叉，示例要结合本命令用途，而不是只重复参数占位符。',
    '- 同时提供“让我提问”的选项：用 3-8 个简短问题帮用户补齐关键创作决策。',
    '- 等用户补充有效输入后，再继续执行下面的步骤。',
    '',
    ''
  ].join('\n');
};

const prependInputClarificationOnboarding = (
  content: string,
  description: string | undefined,
  argumentHint: string | undefined,
  argFormat: string
): string => {
  const onboarding = renderInputClarificationOnboarding(description, argumentHint, argFormat);
  if (!onboarding) {
    return content;
  }

  const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n?/);
  if (!frontmatterMatch) {
    return `${onboarding}${content}`;
  }

  return `${frontmatterMatch[0]}${onboarding}${content.slice(frontmatterMatch[0].length)}`;
};

const writePreviewGateDescriptions = [
  '创建或更新小说创作宪法',
  '定义故事规格',
  '基于故事规格制定技术实现方案',
  '将创作计划分解为可执行的任务清单'
] as const;

const shouldInjectWritePreviewGate = (description: string | undefined): boolean => {
  if (!description) {
    return false;
  }

  return writePreviewGateDescriptions.some(target => description.includes(target));
};

const renderWritePreviewGate = (description: string | undefined): string => [
  '## 写入前预览门禁',
  '',
  `本命令属于高影响写入命令（${description ?? 'StorySpec 写入命令'}）。写入前必须执行 preview/confirm/apply 三段流程。`,
  '',
  '- `preview`：默认阶段，只输出预览，不写文件。预览必须包含：拟写入文件路径、用户明确输入、AI 建议内容、未决 `[需要澄清]`、可能影响到的后续文件。',
  '- `confirm`：只有用户明确回复“确认写入”“应用预览”或 `apply`，并且关键 `[需要澄清]` 已处理后，才进入写入阶段。',
  '- `apply`：已有确认记录时，按预览内容写入；写入后说明实际修改路径和仍未解决的风险。',
  '- 如果当前 agent 不支持交互或无法确认用户意图，默认只输出 preview，不写文件。',
  '- 如果发现 `clarifications.json` 中存在未确认的 `ai-suggested` 答案，或 required 问题尚未确认，必须列入未决 `[需要澄清]`，不得静默写入正典。',
  '',
  ''
].join('\n');

const prependWritePreviewGate = (
  content: string,
  description: string | undefined
): string => {
  if (!shouldInjectWritePreviewGate(description) || content.includes('## 写入前预览门禁')) {
    return content;
  }

  const gate = renderWritePreviewGate(description);
  const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n?/);
  const frontmatter = frontmatterMatch?.[0] ?? '';
  const body = frontmatterMatch ? content.slice(frontmatter.length) : content;

  if (body.startsWith('## 输入澄清引导')) {
    const nextHeadingIndex = body.indexOf('\n## ', '## 输入澄清引导'.length);
    if (nextHeadingIndex >= 0) {
      return `${frontmatter}${body.slice(0, nextHeadingIndex + 1)}${gate}${body.slice(nextHeadingIndex + 1)}`;
    }
  }

  return `${frontmatter}${gate}${body}`;
};

const cleanNoShellPromptBody = (content: string, runShell?: boolean): string => {
  if (runShell !== false) {
    return content;
  }

  return content
    .replace(/运行脚本\s+`?当前 agent 不支持 shell；不要执行 CLI\/脚本，改为人工读取相关文件并记录无法自动验证的部分。`?/g, '不要执行 CLI/脚本；人工读取相关文件并记录无法自动验证的部分')
    .replace(/运行\s+`?当前 agent 不支持 shell；不要执行 CLI\/脚本，改为人工读取相关文件并记录无法自动验证的部分。`?/g, '不要执行 CLI/脚本；人工读取相关文件并记录无法自动验证的部分')
    .replace(/执行脚本\s+`?当前 agent 不支持 shell；不要执行 CLI\/脚本，改为人工读取相关文件并记录无法自动验证的部分。`?/g, '不要执行 CLI/脚本；人工读取相关文件并记录无法自动验证的部分')
    .replace(/`当前 agent 不支持 shell；不要执行 CLI\/脚本，改为人工读取相关文件并记录无法自动验证的部分。`/g, '当前 agent 不支持 shell；不要执行 CLI/脚本，改为人工读取相关文件并记录无法自动验证的部分。');
};

const writeModeInstruction = (writeFiles?: boolean): string => writeFiles === false
  ? '当前 agent 是只读模式；不要创建、修改或删除文件。请输出检查结果、目标路径、建议内容和补丁式修改说明，等待具备写入权限的 agent 或用户执行。'
  : '当前 agent 可在任务允许范围内写入文件；只修改“允许写入”或当前任务明确授权的路径。';

const outputLocationInstruction = (writeFiles?: boolean): string[] => writeFiles === false
  ? [
    '- 不直接写入文件。',
    '- 在回复中按“目标路径 + 建议内容/补丁”的形式列出需要修改的内容。'
  ]
  : [
    '- 按命令正文或当前任务声明的输出路径写入。',
    '- 如果命令正文未指定输出路径，在回复中列出建议路径，不擅自创建新位置。'
  ];

const allowedWriteInstruction = (writeFiles?: boolean): string[] => writeFiles === false
  ? [
    '- 只读模式：不要写入任何文件。',
    '- 可以引用允许写入范围来判断建议是否越界，但最终只输出建议和补丁式说明。'
  ]
  : [
    '- 仅写入本命令正文或当前任务明确允许的文件。',
    '- 不确定是否允许写入时，先记录澄清项，不直接修改正文或 tracking。'
  ];

const formatAllowedWritesForMode = (
  items: readonly string[],
  writeFiles?: boolean
): string[] => {
  if (writeFiles !== false) {
    return formatMarkdownList(items);
  }

  return [
    '- 只读模式：不要写入任何文件。',
    '- 以下路径只作为建议修改范围，用于判断补丁式说明是否越界：',
    ...formatMarkdownList(items)
  ];
};

const compileTemplateBody = (input: CompileCommandTemplateInput): {
  body: string;
  promptBody: string;
  description?: string;
  argumentHint?: string;
} => {
  const parsed = parseCommandTemplate(input.template);
  const scriptCommand = parsed.frontmatter.scripts[input.scriptVariant]
    ?? `echo 'Missing script command for ${input.scriptVariant}'`;
  const scriptInstruction = input.runShell === false ? noShellScriptInstruction : scriptCommand;

  const replacedTemplate = input.template
    .replaceAll('{SCRIPT}', scriptInstruction);
  const withoutScripts = stripScriptsFromFrontmatter(replacedTemplate);
  const body = rewriteSpecifyPaths(withoutScripts
    .replaceAll('{ARGS}', input.argFormat)
    .replaceAll('$ARGUMENTS', input.argFormat)
    .replaceAll('__AGENT__', input.agent));
  const bodyWithOnboarding = prependInputClarificationOnboarding(
    body,
    parsed.frontmatter.description,
    parsed.frontmatter.argumentHint,
    input.argFormat
  );
  const bodyWithGates = prependWritePreviewGate(
    bodyWithOnboarding,
    parsed.frontmatter.description
  );

  return {
    body: bodyWithGates,
    promptBody: extractPromptBody(bodyWithGates),
    description: parsed.frontmatter.description,
    argumentHint: parsed.frontmatter.argumentHint
  };
};

const formatMarkdownList = (items: readonly string[]): string[] => items.length > 0
  ? items.map(item => `- \`${item}\``)
  : ['- 无'];

const getSpecScriptCommand = (input: CompileCommandSpecInput): string => {
  if (input.runShell === false) {
    return noShellScriptInstruction;
  }

  const script = input.spec.scripts?.check ?? input.spec.scripts?.run;
  return script?.[input.scriptVariant] ?? `echo 'Missing script command for ${input.spec.id} (${input.scriptVariant})'`;
};

const compileSpecBody = (input: CompileCommandSpecInput): {
  body: string;
  promptBody: string;
  description: string;
  argumentHint?: string;
} => {
  const scriptCommand = getSpecScriptCommand(input);
  const promptBody = cleanNoShellPromptBody(rewriteSpecifyPaths(input.promptBody
    .replaceAll('{SCRIPT}', scriptCommand)
    .replaceAll('{ARGS}', input.argFormat)
    .replaceAll('$ARGUMENTS', input.argFormat)
    .replaceAll('__AGENT__', input.agent)), input.runShell);
  const promptBodyWithOnboarding = prependInputClarificationOnboarding(
    promptBody,
    input.spec.description,
    input.spec.arguments?.hint,
    input.argFormat
  );
  const promptBodyWithGates = prependWritePreviewGate(
    promptBodyWithOnboarding,
    input.spec.description
  );
  const frontmatter = [
    '---',
    `description: ${input.spec.description}`,
    input.spec.arguments?.hint ? `argument-hint: ${input.spec.arguments.hint}` : undefined,
    '---',
    ''
  ].filter(line => line !== undefined).join('\n');

  return {
    body: `${frontmatter}\n${promptBodyWithGates}`,
    promptBody: promptBodyWithGates,
    description: input.spec.description,
    argumentHint: input.spec.arguments?.hint
  };
};

export const compileCommandTemplate = (input: CompileCommandTemplateInput): string => {
  const compiled = compileTemplateBody(input);

  switch (input.outputFormat) {
    case 'toml':
      return [
        compiled.description ? `description = "${escapeTomlString(compiled.description)}"` : undefined,
        compiled.description ? '' : undefined,
        'prompt = """',
        compiled.promptBody,
        '"""'
      ].filter(line => line !== undefined).join('\n');
    case 'markdown-none':
      return compiled.promptBody;
    case 'markdown-minimal':
      return [
        '---',
        compiled.description ? `description: ${compiled.description}` : undefined,
        '---',
        '',
        compiled.promptBody
      ].filter(line => line !== undefined).join('\n');
    case 'markdown-partial':
      return [
        '---',
        compiled.description ? `description: ${compiled.description}` : undefined,
        compiled.argumentHint ? `argument-hint: ${compiled.argumentHint}` : undefined,
        '---',
        '',
        compiled.promptBody
      ].filter(line => line !== undefined).join('\n');
    case 'markdown-generic':
      return [
        `# ${compiled.description ?? 'StorySpec command'}`,
        '',
        compiled.argumentHint ? `参数提示：\`${compiled.argumentHint}\`` : undefined,
        '',
        '## 目的',
        compiled.description ?? '执行 StorySpec 命令。',
        '',
        '## 前置条件',
        '- 阅读并遵守 `.specify/agent-contract.md`。',
        '- 确认当前任务边界、允许写入范围和验证要求。',
        '- 如果项目已有 `stories/*/tasks.md`，优先选择当前任务清单中的任务。',
        `- ${writeModeInstruction(input.writeFiles)}`,
        '',
        '## 必须读取',
        '- `.specify/memory/constitution.md`',
        '- `stories/*/specification.md`',
        '- `stories/*/creative-plan.md`',
        '- `stories/*/tasks.md`',
        '- `spec/tracking/*.json`',
        '- `spec/knowledge/*`',
        '',
        '## 允许写入',
        ...allowedWriteInstruction(input.writeFiles),
        '',
        '## 执行步骤',
        compiled.promptBody,
        '',
        '## 输出位置',
        ...outputLocationInstruction(input.writeFiles),
        '',
        '## 验证',
        '- 如果可以执行 CLI，请在阶段完成前运行 `storyspec validate`。',
        '- 如果无法执行 shell，请人工检查必须读取、允许写入和输出文件是否满足命令要求。',
        '',
        '## 降级方案',
        '- 不支持 slash command 时，直接按本文档步骤执行。',
        '- 不支持 shell 时，跳过脚本命令，改为手动读取相关文件并记录无法验证的部分。',
        '- 不支持写文件时，返回包含目标路径和内容的补丁式说明。'
      ].filter(line => line !== undefined).join('\n');
    case 'markdown-full':
    default:
      return compiled.body;
  }
};

export const compileCommandSpec = (input: CompileCommandSpecInput): string => {
  const compiled = compileSpecBody(input);

  switch (input.outputFormat) {
    case 'toml':
      return [
        `description = "${escapeTomlString(compiled.description)}"`,
        '',
        'prompt = """',
        compiled.promptBody,
        '"""'
      ].join('\n');
    case 'markdown-none':
      return compiled.promptBody;
    case 'markdown-minimal':
      return [
        '---',
        `description: ${compiled.description}`,
        '---',
        '',
        compiled.promptBody
      ].join('\n');
    case 'markdown-partial':
      return [
        '---',
        `description: ${compiled.description}`,
        compiled.argumentHint ? `argument-hint: ${compiled.argumentHint}` : undefined,
        '---',
        '',
        compiled.promptBody
      ].filter(line => line !== undefined).join('\n');
    case 'markdown-generic':
      return [
        `# ${input.spec.title}`,
        '',
        compiled.argumentHint ? `参数提示：\`${compiled.argumentHint}\`` : undefined,
        '',
        '## 目的',
        input.spec.description,
        '',
        '## 前置条件',
        '- 阅读并遵守 `.specify/agent-contract.md`。',
        '- 确认当前任务边界、允许写入范围和验证要求。',
        `- ${writeModeInstruction(input.writeFiles)}`,
        '',
        '## 必须读取',
        ...formatMarkdownList(input.spec.requiredReads),
        '',
        '## 允许写入',
        ...formatAllowedWritesForMode(input.spec.allowedWrites, input.writeFiles),
        '',
        '## 执行步骤',
        compiled.promptBody,
        '',
        '## 输出位置',
        ...outputLocationInstruction(input.writeFiles),
        '',
        '## 验证',
        '- 如果可以执行 CLI，请在阶段完成前运行 `storyspec validate`。',
        '- 如果无法执行 shell，请人工检查必须读取、允许写入和输出文件是否满足命令要求。',
        '',
        '## 降级方案',
        '- 不支持 slash command 时，直接按本文档步骤执行。',
        '- 不支持 shell 时，跳过脚本命令，改为手动读取相关文件并记录无法验证的部分。',
        '- 不支持写文件时，返回包含目标路径和内容的补丁式说明。'
      ].filter(line => line !== undefined).join('\n');
    case 'markdown-full':
    default:
      return compiled.body;
  }
};
