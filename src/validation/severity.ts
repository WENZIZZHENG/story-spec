import type { ValidationScope, ValidationSeverity } from './schema/index.js';

export type ValidationSeverityBucket = 'blocking' | 'advisory' | 'info';

export interface ValidationIssueWithSeverity {
  severity: ValidationSeverity;
  scope?: ValidationScope;
  code: string;
  path: string;
}

export const VALIDATION_SEVERITIES: readonly ValidationSeverity[] = ['error', 'warning', 'info'];
export const DEFAULT_VALIDATION_SCOPE: ValidationScope = 'project-structure';

const SEVERITY_RANK: Record<ValidationSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2
};

export const isValidationSeverity = (value: unknown): value is ValidationSeverity =>
  typeof value === 'string' && VALIDATION_SEVERITIES.includes(value as ValidationSeverity);

export const toValidationSeverityBucket = (
  severity: ValidationSeverity
): ValidationSeverityBucket => {
  if (severity === 'error') {
    return 'blocking';
  }

  if (severity === 'warning') {
    return 'advisory';
  }

  return 'info';
};

export const countIssuesBySeverity = <T extends Pick<ValidationIssueWithSeverity, 'severity'>>(
  issues: readonly T[]
): Record<ValidationSeverity, number> => ({
  error: issues.filter(issue => issue.severity === 'error').length,
  warning: issues.filter(issue => issue.severity === 'warning').length,
  info: issues.filter(issue => issue.severity === 'info').length
});

export const countIssuesByBucket = <T extends Pick<ValidationIssueWithSeverity, 'severity'>>(
  issues: readonly T[]
): Record<ValidationSeverityBucket, number> => ({
  blocking: issues.filter(issue => toValidationSeverityBucket(issue.severity) === 'blocking').length,
  advisory: issues.filter(issue => toValidationSeverityBucket(issue.severity) === 'advisory').length,
  info: issues.filter(issue => toValidationSeverityBucket(issue.severity) === 'info').length
});

export const countIssuesByScopeAndSeverity = <
  T extends Pick<ValidationIssueWithSeverity, 'severity' | 'scope'>
>(
  issues: readonly T[]
): Partial<Record<ValidationScope, Record<ValidationSeverity, number>>> => {
  const counts: Partial<Record<ValidationScope, Record<ValidationSeverity, number>>> = {};

  for (const issue of issues) {
    const scope = issue.scope ?? DEFAULT_VALIDATION_SCOPE;
    counts[scope] ??= { error: 0, warning: 0, info: 0 };
    counts[scope][issue.severity] += 1;
  }

  return counts;
};

export const filterIssuesBySeverity = <T extends Pick<ValidationIssueWithSeverity, 'severity'>>(
  issues: readonly T[],
  minSeverity: ValidationSeverity = 'info'
): T[] => issues.filter(issue => SEVERITY_RANK[issue.severity] <= SEVERITY_RANK[minSeverity]);

export const sortIssuesBySeverity = <T extends ValidationIssueWithSeverity>(
  issues: readonly T[]
): T[] => [...issues].sort((left, right) =>
  SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity]
  || (left.scope ?? DEFAULT_VALIDATION_SCOPE).localeCompare(right.scope ?? DEFAULT_VALIDATION_SCOPE)
  || left.path.localeCompare(right.path)
  || left.code.localeCompare(right.code)
);
