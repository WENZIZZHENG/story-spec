import { describe, expect, it } from 'vitest';
import { renderLocalAppStartPreview, renderLocalAppStarted } from '../../src/cli/commands/app.command.js';

describe('local app command', () => {
  it('renders a start preview with loopback host and token requirement', () => {
    expect(renderLocalAppStartPreview({
      host: '127.0.0.1',
      port: 43127,
      tokenRequired: true
    })).toContain('http://127.0.0.1:43127');
    expect(renderLocalAppStartPreview({
      host: '127.0.0.1',
      port: 43127,
      tokenRequired: true
    })).toContain('需要本机 session token');
  });

  it('renders a started message with the local app URL', () => {
    expect(renderLocalAppStarted({
      url: 'http://127.0.0.1:43127',
      tokenRequired: true
    })).toContain('http://127.0.0.1:43127');
    expect(renderLocalAppStarted({
      url: 'http://127.0.0.1:43127',
      tokenRequired: true
    })).toContain('Ctrl+C');
  });
});
