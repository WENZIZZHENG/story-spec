import type { ValidationSeverity } from './schema/index.js';

export interface ValidationIssueWithSeverity {
  severity: ValidationSeverity;
  code: string;
  path: string;
}

export const VALIDATION_SEVERITIES: readonly ValidationSeverity[] = ['error', 'warning', 'info'];

const SEVERITY_RANK: Record<ValidationSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2
};

export const isValidationSeverity = (value: unknown): value is ValidationSeverity =>
  typeof value === 'string' && VALIDATION_SEVERITIES.includes(value as ValidationSeverity);

export const countIssuesBySeverity = <T extends Pick<ValidationIssueWithSeverity, 'severity'>>(
  issues: readonly T[]
): Record<ValidationSeverity, number> => ({
    error: issues.filter(issue => issue.severity === 'error').length,
    warning: issues.filter(issue => issue.severity === 'warning').length,
    info: issues.filter(issue => issue.severity === 'info').length
  });

export const filterIssuesBySeverity = <T extends Pick<ValidationIssueWithSeverity, 'severity'>>(
  issues: readonly T[],
  minSeverity: ValidationSeverity = 'info'
): T[] => issues.filter(issue => SEVERITY_RANK[issue.severity] <= SEVERITY_RANK[minSeverity]);

export const sortIssuesBySeverity = <T extends ValidationIssueWithSeverity>(
  issues: readonly T[]
): T[] => [...issues].sort((left, right) =>
    SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity]
    || left.path.localeCompare(right.path)
    || left.code.localeCompare(right.code)
  );
