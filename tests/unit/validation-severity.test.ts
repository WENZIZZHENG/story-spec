import { describe, expect, it } from 'vitest';
import {
  countIssuesBySeverity,
  filterIssuesBySeverity,
  isValidationSeverity,
  sortIssuesBySeverity
} from '../../src/validation/severity.js';
import type { ValidationSeverity } from '../../src/validation/schema/index.js';

interface TestIssue {
  severity: ValidationSeverity;
  code: string;
  path: string;
}

const issues: TestIssue[] = [
  { severity: 'info', code: 'INFO_RULE', path: 'z.md' },
  { severity: 'warning', code: 'WARNING_RULE', path: 'b.md' },
  { severity: 'error', code: 'ERROR_RULE', path: 'c.md' },
  { severity: 'error', code: 'ANOTHER_ERROR', path: 'a.md' }
];

describe('validation severity helpers', () => {
  it('recognizes supported severity levels', () => {
    expect(isValidationSeverity('error')).toBe(true);
    expect(isValidationSeverity('warning')).toBe(true);
    expect(isValidationSeverity('info')).toBe(true);
    expect(isValidationSeverity('fatal')).toBe(false);
  });

  it('counts issues by severity with zero defaults', () => {
    expect(countIssuesBySeverity(issues)).toEqual({
      error: 2,
      warning: 1,
      info: 1
    });
    expect(countIssuesBySeverity([])).toEqual({
      error: 0,
      warning: 0,
      info: 0
    });
  });

  it('filters by minimum severity', () => {
    expect(filterIssuesBySeverity(issues, 'error').map(issue => issue.code)).toEqual([
      'ERROR_RULE',
      'ANOTHER_ERROR'
    ]);
    expect(filterIssuesBySeverity(issues, 'warning').map(issue => issue.code)).toEqual([
      'WARNING_RULE',
      'ERROR_RULE',
      'ANOTHER_ERROR'
    ]);
    expect(filterIssuesBySeverity(issues, 'info')).toEqual(issues);
  });

  it('sorts severe issues first, then path and code', () => {
    expect(sortIssuesBySeverity(issues).map(issue => issue.code)).toEqual([
      'ANOTHER_ERROR',
      'ERROR_RULE',
      'WARNING_RULE',
      'INFO_RULE'
    ]);
  });
});
