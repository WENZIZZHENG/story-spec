import type { MultiuserContractPermissionState } from '../http/api-contract.js';

export const PROJECT_ROLES = ['owner', 'editor', 'reviewer', 'viewer', 'agent'] as const;

export type ProjectRole = typeof PROJECT_ROLES[number];

export const PROJECT_PERMISSION_ACTIONS = [
  'view-project',
  'view-story',
  'view-chapter',
  'create-candidate',
  'comment',
  'review-canon',
  'apply-canon-change',
  'publish-chapter',
  'run-agent-job',
  'manage-members',
  'export-project',
  'delete-project'
] as const;

export type ProjectPermissionAction = typeof PROJECT_PERMISSION_ACTIONS[number];

export interface ProjectPermissionDecision {
  action: ProjectPermissionAction;
  state: MultiuserContractPermissionState;
  reason: string;
  requiresConfirmation: boolean;
  requestAccessHref?: string;
}

export interface ProjectRoleDefinition {
  role: ProjectRole;
  label: string;
  description: string;
  permissions: ProjectPermissionDecision[];
}

const requestAccessHref = '/settings/access';

const allowed = (action: ProjectPermissionAction, reason: string): ProjectPermissionDecision => ({
  action,
  state: 'allowed',
  reason,
  requiresConfirmation: false
});

const requiresConfirmation = (action: ProjectPermissionAction, reason: string): ProjectPermissionDecision => ({
  action,
  state: 'requires-confirmation',
  reason,
  requiresConfirmation: true
});

const denied = (
  action: ProjectPermissionAction,
  reason: string,
  canRequestAccess = true
): ProjectPermissionDecision => ({
  action,
  state: 'denied',
  reason,
  requiresConfirmation: false,
  ...(canRequestAccess ? { requestAccessHref } : {})
});

const baseViewPermissions = (roleLabel: string): ProjectPermissionDecision[] => [
  allowed('view-project', `${roleLabel}可以查看项目入口。`),
  allowed('view-story', `${roleLabel}可以查看故事工作台。`),
  allowed('view-chapter', `${roleLabel}可以查看章节内容。`)
];

export const PROJECT_ROLE_DEFINITIONS: ProjectRoleDefinition[] = [
  {
    role: 'owner',
    label: '拥有者',
    description: '项目拥有者和最终确认人，负责成员、导出、删除和正典写入确认。',
    permissions: [
      ...baseViewPermissions('拥有者'),
      allowed('create-candidate', '拥有者可以创建候选方案。'),
      allowed('comment', '拥有者可以评论和标注。'),
      allowed('review-canon', '拥有者可以复核正典和冲突。'),
      requiresConfirmation('apply-canon-change', '正典变更必须经过拥有者二次确认。'),
      requiresConfirmation('publish-chapter', '章节发布会改变正式故事，必须二次确认。'),
      allowed('run-agent-job', '拥有者可以运行 agent job。'),
      requiresConfirmation('manage-members', '成员权限变更必须二次确认并写入审计。'),
      requiresConfirmation('export-project', '项目导出包含故事资料，必须确认导出范围。'),
      requiresConfirmation('delete-project', '项目删除属于高风险生命周期操作，必须二次确认。')
    ]
  },
  {
    role: 'editor',
    label: '编辑',
    description: '协助整理草稿、候选和任务，可运行 agent job，但不能确认高影响写入。',
    permissions: [
      ...baseViewPermissions('编辑'),
      allowed('create-candidate', '编辑可以提交候选方案供拥有者确认。'),
      allowed('comment', '编辑可以评论和标注。'),
      allowed('review-canon', '编辑可以复核正典和冲突。'),
      denied('apply-canon-change', '编辑不能应用正典变更，需要拥有者确认。'),
      denied('publish-chapter', '编辑不能发布正式章节，需要拥有者确认。'),
      allowed('run-agent-job', '编辑可以运行 agent job 生成候选或预览。'),
      denied('manage-members', '编辑不能管理成员权限。'),
      denied('export-project', '编辑不能导出项目，需要拥有者确认。'),
      denied('delete-project', '编辑不能删除项目。')
    ]
  },
  {
    role: 'reviewer',
    label: '审稿者',
    description: '复核文本、评论和正典一致性，不能运行 job 或写入正式故事。',
    permissions: [
      ...baseViewPermissions('审稿者'),
      allowed('create-candidate', '审稿者可以提交修改候选供拥有者确认。'),
      allowed('comment', '审稿者可以评论和标注。'),
      allowed('review-canon', '审稿者可以复核正典和冲突。'),
      denied('apply-canon-change', '审稿者不能应用正典变更。'),
      denied('publish-chapter', '审稿者不能发布正式章节。'),
      denied('run-agent-job', '审稿者不能运行 agent job，需要编辑或拥有者处理。'),
      denied('manage-members', '审稿者不能管理成员权限。'),
      denied('export-project', '审稿者不能导出项目。'),
      denied('delete-project', '审稿者不能删除项目。')
    ]
  },
  {
    role: 'viewer',
    label: '只读成员',
    description: '只能查看项目、故事和章节，不参与评论、候选或写入。',
    permissions: [
      ...baseViewPermissions('只读成员'),
      denied('create-candidate', '只读成员不能创建候选，需要向项目拥有者申请更高权限。'),
      denied('comment', '只读成员不能评论，需要向项目拥有者申请更高权限。'),
      denied('review-canon', '只读成员不能复核正典，需要向项目拥有者申请更高权限。'),
      denied('apply-canon-change', '只读成员不能应用正典变更。'),
      denied('publish-chapter', '只读成员不能发布正式章节。'),
      denied('run-agent-job', '只读成员不能运行 agent job。'),
      denied('manage-members', '只读成员不能管理成员权限。'),
      denied('export-project', '只读成员不能导出项目。'),
      denied('delete-project', '只读成员不能删除项目。')
    ]
  },
  {
    role: 'agent',
    label: 'Agent 执行身份',
    description: '机器执行身份，只能提交候选、预览和日志，不能确认或管理项目。',
    permissions: [
      allowed('view-project', 'Agent 可以读取执行所需的项目上下文。'),
      allowed('view-story', 'Agent 可以读取执行所需的故事上下文。'),
      allowed('view-chapter', 'Agent 可以读取执行所需的章节上下文。'),
      allowed('create-candidate', 'Agent 只能提交候选或预览，不能直接写入正典。'),
      allowed('comment', 'Agent 可以写入任务日志或审阅建议。'),
      denied('review-canon', 'Agent 不能作为正典复核人。', false),
      denied('apply-canon-change', 'Agent 不能应用正典变更。', false),
      denied('publish-chapter', 'Agent 不能发布正式章节。', false),
      denied('run-agent-job', 'Agent 不能自行启动新的 agent job。', false),
      denied('manage-members', 'Agent 不能管理成员权限。', false),
      denied('export-project', 'Agent 不能导出项目。', false),
      denied('delete-project', 'Agent 不能删除项目。', false)
    ]
  }
];

const definitionsByRole = new Map(PROJECT_ROLE_DEFINITIONS.map(definition => [
  definition.role,
  definition
]));

export const resolveProjectPermissionDecision = (
  input: {
    role: ProjectRole;
    action: ProjectPermissionAction;
  }
): ProjectPermissionDecision => {
  const definition = definitionsByRole.get(input.role);
  const decision = definition?.permissions.find(permission => permission.action === input.action);
  if (!decision) {
    return denied(input.action, '未知权限动作。', false);
  }
  return decision;
};

export const canProjectRole = (role: ProjectRole, action: ProjectPermissionAction): boolean => {
  const decision = resolveProjectPermissionDecision({ role, action });
  return decision.state === 'allowed' || decision.state === 'requires-confirmation';
};
