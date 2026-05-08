import { describe, expect, it } from 'vitest';
import {
  createDoctorJson,
  renderDoctorResult,
  runStartupDoctor,
  type StartupDoctorCheck
} from '../../src/cli/commands/doctor.command.js';

describe('doctor command', () => {
  it('renders pass, warn, and fail checks without mutating the system', async () => {
    const result = await runStartupDoctor({
      cwd: 'D:\\workspace\\story',
      nodeVersion: 'v20.10.0',
      commandExists: async command => command === 'git',
      isStorySpecProject: async () => true,
      canListen: async port => port !== 43127,
      canOpenBrowser: async () => false
    });

    expect(result.mutatesSystem).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining<StartupDoctorCheck>([
      expect.objectContaining({
        id: 'node',
        status: 'pass'
      }),
      expect.objectContaining({
        id: 'git',
        status: 'pass'
      }),
      expect.objectContaining({
        id: 'project-root',
        status: 'pass'
      }),
      expect.objectContaining({
        id: 'app-port',
        status: 'warn',
        suggestedAction: expect.stringContaining('storyspec app')
      }),
      expect.objectContaining({
        id: 'browser',
        status: 'warn'
      })
    ]));
    expect(renderDoctorResult(result)).toContain('Startup doctor');
    expect(renderDoctorResult(result)).toContain('WARN');
  });

  it('produces stable JSON fields for automation', async () => {
    const result = await runStartupDoctor({
      cwd: 'D:\\workspace\\story',
      nodeVersion: 'v16.0.0',
      commandExists: async () => false,
      isStorySpecProject: async () => false,
      canListen: async () => true,
      canOpenBrowser: async () => true
    });

    expect(createDoctorJson(result)).toMatchObject({
      command: 'doctor',
      mutatesSystem: false,
      valid: false,
      checks: [
        {
          id: 'node',
          status: 'fail',
          message: expect.any(String),
          suggestedAction: expect.any(String)
        },
        {
          id: 'git',
          status: 'warn',
          message: expect.any(String)
        },
        {
          id: 'project-root',
          status: 'warn',
          message: expect.any(String)
        },
        {
          id: 'app-port',
          status: 'pass',
          message: expect.any(String)
        },
        {
          id: 'browser',
          status: 'pass',
          message: expect.any(String)
        }
      ]
    });
  });
});
