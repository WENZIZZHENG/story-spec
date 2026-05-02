import {
  getAgentIntegration,
  type AgentIntegrationId
} from '../../agent/registry.js';
import type { CommandSource } from '../command-source.js';
import {
  compileCommandSpec,
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
  runShell: boolean;
}

export interface RenderCommandForPlatformInput {
  commandName: string;
  template?: string;
  commandSource?: CommandSource;
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
    outputFormat: 'markdown-generic',
    runShell: false
  },
  claude: {
    platform: 'claude',
    extension: 'md',
    namespace: 'novel.',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-full',
    runShell: true
  },
  gemini: {
    platform: 'gemini',
    extension: 'toml',
    namespace: '',
    argFormat: '{{args}}',
    outputFormat: 'toml',
    runShell: true
  },
  cursor: {
    platform: 'cursor',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none',
    runShell: true
  },
  windsurf: {
    platform: 'windsurf',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-partial',
    runShell: true
  },
  roocode: {
    platform: 'roocode',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-partial',
    runShell: true
  },
  copilot: {
    platform: 'copilot',
    extension: 'prompt.md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none',
    runShell: false
  },
  qwen: {
    platform: 'qwen',
    extension: 'toml',
    namespace: '',
    argFormat: '{{args}}',
    outputFormat: 'toml',
    runShell: true
  },
  opencode: {
    platform: 'opencode',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-minimal',
    runShell: true
  },
  codex: {
    platform: 'codex',
    extension: 'md',
    namespace: 'novel-',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none',
    runShell: true
  },
  kilocode: {
    platform: 'kilocode',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-partial',
    runShell: true
  },
  auggie: {
    platform: 'auggie',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none',
    runShell: true
  },
  codebuddy: {
    platform: 'codebuddy',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none',
    runShell: true
  },
  q: {
    platform: 'q',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none',
    runShell: false
  }
};

const syncRendererCapabilities = (renderer: PlatformRenderer): PlatformRenderer => ({
  ...renderer,
  runShell: getAgentIntegration(renderer.platform)?.capabilities.runShell ?? renderer.runShell
});

export const getPlatformRenderer = (platform: AgentIntegrationId): PlatformRenderer =>
  syncRendererCapabilities(PLATFORM_RENDERERS[platform]);

export const getAllPlatformRenderers = (): PlatformRenderer[] => Object.values(PLATFORM_RENDERERS)
  .map(syncRendererCapabilities);

export const renderCommandForPlatform = (input: RenderCommandForPlatformInput): RenderedCommand => {
  const renderer = getPlatformRenderer(input.platform);
  const commandName = input.commandSource?.commandName ?? input.commandName;
  const outputFile = `${renderer.namespace}${commandName}.${renderer.extension}`;
  const content = input.commandSource?.kind === 'command-spec'
    ? compileCommandSpec({
      spec: input.commandSource.spec,
      promptBody: input.commandSource.promptBody,
      agent: renderer.platform,
      argFormat: renderer.argFormat,
      scriptVariant: input.scriptVariant,
      outputFormat: renderer.outputFormat,
      runShell: renderer.runShell
    })
    : compileCommandTemplate({
      template: input.commandSource?.kind === 'legacy-template'
        ? input.commandSource.template
        : input.template ?? '',
      agent: renderer.platform,
      argFormat: renderer.argFormat,
      scriptVariant: input.scriptVariant,
      outputFormat: renderer.outputFormat,
      runShell: renderer.runShell
    });

  return {
    outputFile,
    renderer,
    content
  };
};
