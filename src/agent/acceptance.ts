import path from 'node:path';
import type {
  AgentIntegration,
  AgentIntegrationId,
  LegacyAIIntegrationId,
  RendererId
} from './registry.js';

export interface AgentIntegrationAcceptanceCheck {
  id:
    | 'registry.identity'
    | 'metadata.required-fields'
    | 'install-target.safe-relative-paths'
    | 'renderer.registered'
    | 'command-surface.slash-prefix'
    | 'legacy.compatibility';
  description: string;
}

export interface AgentIntegrationAcceptanceIssue {
  checkId: AgentIntegrationAcceptanceCheck['id'];
  message: string;
}

export interface AgentIntegrationAcceptanceOptions {
  rendererIds: readonly RendererId[];
  legacyIds: readonly LegacyAIIntegrationId[];
}

export const AGENT_INTEGRATION_ACCEPTANCE_CHECKS: readonly AgentIntegrationAcceptanceCheck[] = [
  {
    id: 'registry.identity',
    description: 'Agent id 必须唯一登记，并与 registry 顺序保持一致。'
  },
  {
    id: 'metadata.required-fields',
    description: 'displayName、kind、commandSurface、capabilities、renderer 必须完整。'
  },
  {
    id: 'install-target.safe-relative-paths',
    description: 'install target 路径必须是仓库内相对路径，不能为绝对路径或包含上级跳转。'
  },
  {
    id: 'renderer.registered',
    description: 'renderer 必须有平台 renderer 支持，或显式使用 generic-markdown。'
  },
  {
    id: 'command-surface.slash-prefix',
    description: 'slash-command integration 必须声明 slashPrefix。'
  },
  {
    id: 'legacy.compatibility',
    description: 'legacy --ai integration 必须保留 legacyAiId 映射。'
  }
];

const issue = (
  checkId: AgentIntegrationAcceptanceIssue['checkId'],
  message: string
): AgentIntegrationAcceptanceIssue => ({
  checkId,
  message
});

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isSafeRelativePath = (value: string): boolean =>
  !path.isAbsolute(value)
  && value.split(/[\\/]+/).every(segment => segment !== '..')
  && value.trim().length > 0;

export const validateAgentIntegrationAcceptance = (
  integration: AgentIntegration,
  options: AgentIntegrationAcceptanceOptions
): AgentIntegrationAcceptanceIssue[] => {
  const issues: AgentIntegrationAcceptanceIssue[] = [];

  if (!isNonEmptyString(integration.id)) {
    issues.push(issue('registry.identity', 'id 不能为空'));
  }

  if (!isNonEmptyString(integration.displayName)) {
    issues.push(issue('metadata.required-fields', 'displayName 不能为空'));
  }

  if (!isNonEmptyString(integration.kind)) {
    issues.push(issue('metadata.required-fields', 'kind 不能为空'));
  }

  if (!isNonEmptyString(integration.commandSurface)) {
    issues.push(issue('metadata.required-fields', 'commandSurface 不能为空'));
  }

  if (!integration.capabilities) {
    issues.push(issue('metadata.required-fields', 'capabilities 不能为空'));
  }

  if (!isNonEmptyString(integration.renderer)) {
    issues.push(issue('metadata.required-fields', 'renderer 不能为空'));
  }

  if (integration.installTargets.length === 0) {
    issues.push(issue('install-target.safe-relative-paths', 'installTargets 至少需要一个目标'));
  }

  for (const [index, target] of integration.installTargets.entries()) {
    const fields = [
      ['dir', target.dir],
      ['commandsDir', target.commandsDir],
      ['distDir', target.distDir]
    ] as const;

    for (const [field, value] of fields) {
      if (!isSafeRelativePath(value)) {
        issues.push(issue(
          'install-target.safe-relative-paths',
          `installTargets[${index}].${field} 必须是安全相对路径`
        ));
      }
    }

    for (const field of ['initDirs', 'extraDirs', 'extraFiles'] as const) {
      for (const [itemIndex, value] of (target[field] ?? []).entries()) {
        if (!isSafeRelativePath(value)) {
          issues.push(issue(
            'install-target.safe-relative-paths',
            `installTargets[${index}].${field}[${itemIndex}] 必须是安全相对路径`
          ));
        }
      }
    }
  }

  if (
    integration.renderer !== 'generic-markdown'
    && !options.rendererIds.includes(integration.renderer as AgentIntegrationId)
  ) {
    issues.push(issue('renderer.registered', `renderer 未注册：${integration.renderer}`));
  }

  if (integration.commandSurface === 'slash-command' && !isNonEmptyString(integration.slashPrefix)) {
    issues.push(issue('command-surface.slash-prefix', 'slash-command integration 必须声明 slashPrefix'));
  }

  if (integration.legacyAiId && !options.legacyIds.includes(integration.legacyAiId)) {
    issues.push(issue('legacy.compatibility', `legacyAiId 未登记：${integration.legacyAiId}`));
  }

  if (options.legacyIds.includes(integration.id as LegacyAIIntegrationId) && integration.legacyAiId !== integration.id) {
    issues.push(issue('legacy.compatibility', 'legacy integration 必须保留同名 legacyAiId'));
  }

  return issues;
};
