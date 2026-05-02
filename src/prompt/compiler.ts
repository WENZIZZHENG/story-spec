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
}

export interface CompileCommandSpecInput {
  spec: CommandSpec;
  promptBody: string;
  agent: string;
  argFormat: string;
  scriptVariant: ScriptVariant;
  outputFormat: CommandOutputFormat;
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

const compileTemplateBody = (input: CompileCommandTemplateInput): {
  body: string;
  promptBody: string;
  description?: string;
  argumentHint?: string;
} => {
  const parsed = parseCommandTemplate(input.template);
  const scriptCommand = parsed.frontmatter.scripts[input.scriptVariant]
    ?? `echo 'Missing script command for ${input.scriptVariant}'`;

  const replacedTemplate = input.template
    .replaceAll('{SCRIPT}', scriptCommand);
  const withoutScripts = stripScriptsFromFrontmatter(replacedTemplate);
  const body = rewriteSpecifyPaths(withoutScripts
    .replaceAll('{ARGS}', input.argFormat)
    .replaceAll('$ARGUMENTS', input.argFormat)
    .replaceAll('__AGENT__', input.agent));

  return {
    body,
    promptBody: extractPromptBody(body),
    description: parsed.frontmatter.description,
    argumentHint: parsed.frontmatter.argumentHint
  };
};

const formatMarkdownList = (items: readonly string[]): string[] => items.length > 0
  ? items.map(item => `- \`${item}\``)
  : ['- 无'];

const getSpecScriptCommand = (input: CompileCommandSpecInput): string => {
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
  const promptBody = rewriteSpecifyPaths(input.promptBody
    .replaceAll('{SCRIPT}', scriptCommand)
    .replaceAll('{ARGS}', input.argFormat)
    .replaceAll('$ARGUMENTS', input.argFormat)
    .replaceAll('__AGENT__', input.agent));
  const frontmatter = [
    '---',
    `description: ${input.spec.description}`,
    input.spec.arguments?.hint ? `argument-hint: ${input.spec.arguments.hint}` : undefined,
    '---',
    ''
  ].filter(line => line !== undefined).join('\n');

  return {
    body: `${frontmatter}\n${promptBody}`,
    promptBody,
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
        `# ${compiled.description ?? 'Novel Writer command'}`,
        '',
        compiled.argumentHint ? `参数提示：\`${compiled.argumentHint}\`` : undefined,
        '',
        '## 目的',
        compiled.description ?? '执行 Novel Writer 命令。',
        '',
        '## 前置条件',
        '- 阅读并遵守 `.specify/agent-contract.md`。',
        '- 确认当前任务边界、允许写入范围和验证要求。',
        '- 如果项目已有 `stories/*/tasks.md`，优先选择当前任务清单中的任务。',
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
        '- 仅写入本命令正文或当前任务明确允许的文件。',
        '- 不确定是否允许写入时，先记录澄清项，不直接修改正文或 tracking。',
        '',
        '## 执行步骤',
        compiled.promptBody,
        '',
        '## 输出位置',
        '- 按命令正文或当前任务声明的输出路径写入。',
        '- 如果命令正文未指定输出路径，在回复中列出建议路径，不擅自创建新位置。',
        '',
        '## 验证',
        '- 如果可以执行 CLI，请在阶段完成前运行 `novel validate`。',
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
        '',
        '## 必须读取',
        ...formatMarkdownList(input.spec.requiredReads),
        '',
        '## 允许写入',
        ...formatMarkdownList(input.spec.allowedWrites),
        '',
        '## 执行步骤',
        compiled.promptBody,
        '',
        '## 输出位置',
        '- 按命令正文或当前任务声明的路径写入。',
        '- 如果无法确定输出路径，在回复中列出建议路径，不擅自创建新位置。',
        '',
        '## 验证',
        '- 如果可以执行 CLI，请在阶段完成前运行 `novel validate`。',
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
