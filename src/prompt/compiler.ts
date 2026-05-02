import { parseCommandTemplate } from './frontmatter.js';

export type ScriptVariant = 'sh' | 'ps';

export type CommandOutputFormat =
  | 'markdown-full'
  | 'markdown-partial'
  | 'markdown-minimal'
  | 'markdown-none'
  | 'toml';

export interface CompileCommandTemplateInput {
  template: string;
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
    case 'markdown-full':
    default:
      return compiled.body;
  }
};
