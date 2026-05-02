import type { AgentIntegrationId } from '../../agent/registry.js';
import {
  compileCommandTemplate,
  type CommandOutputFormat,
  type ScriptVariant
} from '../compiler.js';

export interface PlatformRenderer {
  platform: AgentIntegrationId;
  extension: 'md' | 'toml' | 'prompt.md';
  namespace: string;
  argFormat: '$ARGUMENTS' | '{{args}}';
  outputFormat: CommandOutputFormat;
}

export interface RenderCommandForPlatformInput {
  commandName: string;
  template: string;
  platform: AgentIntegrationId;
  scriptVariant: ScriptVariant;
}

export interface RenderedCommand {
  outputFile: string;
  content: string;
  renderer: PlatformRenderer;
}

const PLATFORM_RENDERERS: Record<AgentIntegrationId, PlatformRenderer> = {
  generic: {
    platform: 'generic',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-generic'
  },
  claude: {
    platform: 'claude',
    extension: 'md',
    namespace: 'novel.',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-full'
  },
  gemini: {
    platform: 'gemini',
    extension: 'toml',
    namespace: '',
    argFormat: '{{args}}',
    outputFormat: 'toml'
  },
  cursor: {
    platform: 'cursor',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none'
  },
  windsurf: {
    platform: 'windsurf',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-partial'
  },
  roocode: {
    platform: 'roocode',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-partial'
  },
  copilot: {
    platform: 'copilot',
    extension: 'prompt.md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none'
  },
  qwen: {
    platform: 'qwen',
    extension: 'toml',
    namespace: '',
    argFormat: '{{args}}',
    outputFormat: 'toml'
  },
  opencode: {
    platform: 'opencode',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-minimal'
  },
  codex: {
    platform: 'codex',
    extension: 'md',
    namespace: 'novel-',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none'
  },
  kilocode: {
    platform: 'kilocode',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-partial'
  },
  auggie: {
    platform: 'auggie',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none'
  },
  codebuddy: {
    platform: 'codebuddy',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none'
  },
  q: {
    platform: 'q',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none'
  }
};

export const getPlatformRenderer = (platform: AgentIntegrationId): PlatformRenderer => PLATFORM_RENDERERS[platform];

export const getAllPlatformRenderers = (): PlatformRenderer[] => Object.values(PLATFORM_RENDERERS);

export const renderCommandForPlatform = (input: RenderCommandForPlatformInput): RenderedCommand => {
  const renderer = getPlatformRenderer(input.platform);
  const outputFile = `${renderer.namespace}${input.commandName}.${renderer.extension}`;

  return {
    outputFile,
    renderer,
    content: compileCommandTemplate({
      template: input.template,
      agent: renderer.platform,
      argFormat: renderer.argFormat,
      scriptVariant: input.scriptVariant,
      outputFormat: renderer.outputFormat
    })
  };
};
