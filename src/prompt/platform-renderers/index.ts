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
  writeFiles: boolean;
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
    runShell: false,
    writeFiles: true
  },
  'continue-check': {
    platform: 'continue-check',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-generic',
    runShell: false,
    writeFiles: false
  },
  claude: {
    platform: 'claude',
    extension: 'md',
    namespace: 'storyspec.',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-full',
    runShell: true,
    writeFiles: true
  },
  gemini: {
    platform: 'gemini',
    extension: 'toml',
    namespace: '',
    argFormat: '{{args}}',
    outputFormat: 'toml',
    runShell: true,
    writeFiles: true
  },
  cursor: {
    platform: 'cursor',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none',
    runShell: true,
    writeFiles: true
  },
  windsurf: {
    platform: 'windsurf',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-partial',
    runShell: true,
    writeFiles: true
  },
  roocode: {
    platform: 'roocode',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-partial',
    runShell: true,
    writeFiles: true
  },
  copilot: {
    platform: 'copilot',
    extension: 'prompt.md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none',
    runShell: false,
    writeFiles: true
  },
  qwen: {
    platform: 'qwen',
    extension: 'toml',
    namespace: '',
    argFormat: '{{args}}',
    outputFormat: 'toml',
    runShell: true,
    writeFiles: true
  },
  opencode: {
    platform: 'opencode',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-minimal',
    runShell: true,
    writeFiles: true
  },
  codex: {
    platform: 'codex',
    extension: 'md',
    namespace: 'storyspec-',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none',
    runShell: true,
    writeFiles: true
  },
  kilocode: {
    platform: 'kilocode',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-partial',
    runShell: true,
    writeFiles: true
  },
  auggie: {
    platform: 'auggie',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none',
    runShell: true,
    writeFiles: true
  },
  codebuddy: {
    platform: 'codebuddy',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none',
    runShell: true,
    writeFiles: true
  },
  q: {
    platform: 'q',
    extension: 'md',
    namespace: '',
    argFormat: '$ARGUMENTS',
    outputFormat: 'markdown-none',
    runShell: false,
    writeFiles: true
  }
};

const syncRendererCapabilities = (renderer: PlatformRenderer): PlatformRenderer => ({
  ...renderer,
  runShell: getAgentIntegration(renderer.platform)?.capabilities.runShell ?? renderer.runShell,
  writeFiles: getAgentIntegration(renderer.platform)?.capabilities.writeFiles ?? renderer.writeFiles
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
      runShell: renderer.runShell,
      writeFiles: renderer.writeFiles
    })
    : compileCommandTemplate({
      template: input.commandSource?.kind === 'legacy-template'
        ? input.commandSource.template
        : input.template ?? '',
      agent: renderer.platform,
      argFormat: renderer.argFormat,
      scriptVariant: input.scriptVariant,
      outputFormat: renderer.outputFormat,
      runShell: renderer.runShell,
      writeFiles: renderer.writeFiles
    });

  return {
    outputFile,
    renderer,
    content
  };
};
