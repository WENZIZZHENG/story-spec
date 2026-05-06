import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { renderLocalAppHtml } from './local-app-html.js';

interface LocalAppHttpCore {
  health(): unknown;
  openProject(request: { token: string; projectRoot: string; now?: () => string }): Promise<{ status: number; body: unknown }>;
  listRecentProjects(request: { token: string }): Promise<{ status: number; body: unknown }>;
  createProject(request: {
    token: string;
    name: string;
    workspacePath: string;
    method: string;
    git: boolean;
    withExperts: boolean;
  }): Promise<{ status: number; body: unknown }>;
  getCurrentProjectStatus(request: { token: string }): Promise<{ status: number; body: unknown }>;
  createStoryIdea(request: {
    token: string;
    name: string;
    idea?: string;
  }): Promise<{ status: number; body: unknown }>;
  ingestStoryInput(request: {
    token: string;
    story?: string;
    text?: string;
    applyConfirmed?: boolean;
  }): Promise<{ status: number; body: unknown }>;
  getStoryCoreMissing(request: {
    token: string;
    story?: string;
  }): Promise<{ status: number; body: unknown }>;
  listOutlineCandidates(request: {
    token: string;
    story?: string;
  }): Promise<{ status: number; body: unknown }>;
  createOutlineCandidate(request: {
    token: string;
    story?: string;
    title: string;
    text?: string;
  }): Promise<{ status: number; body: unknown }>;
  compareOutlineCandidates(request: {
    token: string;
    story?: string;
    leftId: string;
    rightId: string;
  }): Promise<{ status: number; body: unknown }>;
  promoteOutlineCandidate(request: {
    token: string;
    story?: string;
    outlineId: string;
    yes?: boolean;
  }): Promise<{ status: number; body: unknown }>;
  getTaskBoard(request: {
    token: string;
    story?: string;
  }): Promise<{ status: number; body: unknown }>;
}

export interface StartLocalAppHttpServerInput {
  host: string;
  port: number;
  core: LocalAppHttpCore;
  token: string;
}

export interface LocalAppHttpServer {
  url: string;
  close(): Promise<void>;
}

const readBody = async (request: http.IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf-8')) as unknown;
  } catch {
    return {};
  }
};

const sendJson = (
  response: http.ServerResponse,
  status: number,
  body: unknown
): void => {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8'
  });
  response.end(JSON.stringify(body));
};

const sendHtml = (
  response: http.ServerResponse,
  body: string
): void => {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8'
  });
  response.end(body);
};

const getToken = (request: http.IncomingMessage): string =>
  String(request.headers['x-storyspec-app-token'] ?? '');

export const startLocalAppHttpServer = async (
  input: StartLocalAppHttpServerInput
): Promise<LocalAppHttpServer> => {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', `http://${input.host}`);

    try {
      if (request.method === 'GET' && url.pathname === '/') {
        sendHtml(response, renderLocalAppHtml({ token: input.token }));
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/app/health') {
        sendJson(response, 200, input.core.health());
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/projects/open') {
        const body = await readBody(request) as { projectRoot?: unknown };
        const result = await input.core.openProject({
          token: getToken(request),
          projectRoot: String(body.projectRoot ?? '')
        });
        sendJson(response, result.status, result.body);
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/projects/recent') {
        const result = await input.core.listRecentProjects({
          token: getToken(request)
        });
        sendJson(response, result.status, result.body);
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/projects/create') {
        const body = await readBody(request) as {
          name?: unknown;
          workspacePath?: unknown;
          method?: unknown;
          git?: unknown;
          withExperts?: unknown;
        };
        const result = await input.core.createProject({
          token: getToken(request),
          name: String(body.name ?? ''),
          workspacePath: String(body.workspacePath ?? ''),
          method: String(body.method ?? 'three-act'),
          git: body.git === true,
          withExperts: body.withExperts === true
        });
        sendJson(response, result.status, result.body);
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/projects/current/status') {
        const result = await input.core.getCurrentProjectStatus({
          token: getToken(request)
        });
        sendJson(response, result.status, result.body);
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/stories/create') {
        const body = await readBody(request) as {
          name?: unknown;
          idea?: unknown;
        };
        const result = await input.core.createStoryIdea({
          token: getToken(request),
          name: String(body.name ?? ''),
          idea: body.idea === undefined ? undefined : String(body.idea)
        });
        sendJson(response, result.status, result.body);
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/stories/ingest') {
        const body = await readBody(request) as {
          story?: unknown;
          text?: unknown;
          applyConfirmed?: unknown;
        };
        const result = await input.core.ingestStoryInput({
          token: getToken(request),
          story: body.story === undefined ? undefined : String(body.story),
          text: body.text === undefined ? undefined : String(body.text),
          applyConfirmed: body.applyConfirmed === true
        });
        sendJson(response, result.status, result.body);
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/stories/core/missing') {
        const story = url.searchParams.get('story');
        const result = await input.core.getStoryCoreMissing({
          token: getToken(request),
          story: story ?? undefined
        });
        sendJson(response, result.status, result.body);
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/outlines/list') {
        const story = url.searchParams.get('story');
        const result = await input.core.listOutlineCandidates({
          token: getToken(request),
          story: story ?? undefined
        });
        sendJson(response, result.status, result.body);
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/outlines/create') {
        const body = await readBody(request) as {
          story?: unknown;
          title?: unknown;
          text?: unknown;
        };
        const result = await input.core.createOutlineCandidate({
          token: getToken(request),
          story: body.story === undefined ? undefined : String(body.story),
          title: String(body.title ?? ''),
          text: body.text === undefined ? undefined : String(body.text)
        });
        sendJson(response, result.status, result.body);
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/outlines/compare') {
        const body = await readBody(request) as {
          story?: unknown;
          leftId?: unknown;
          rightId?: unknown;
        };
        const result = await input.core.compareOutlineCandidates({
          token: getToken(request),
          story: body.story === undefined ? undefined : String(body.story),
          leftId: String(body.leftId ?? ''),
          rightId: String(body.rightId ?? '')
        });
        sendJson(response, result.status, result.body);
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/outlines/promote') {
        const body = await readBody(request) as {
          story?: unknown;
          outlineId?: unknown;
          yes?: unknown;
        };
        const result = await input.core.promoteOutlineCandidate({
          token: getToken(request),
          story: body.story === undefined ? undefined : String(body.story),
          outlineId: String(body.outlineId ?? ''),
          yes: body.yes === true
        });
        sendJson(response, result.status, result.body);
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/tasks/board') {
        const story = url.searchParams.get('story');
        const result = await input.core.getTaskBoard({
          token: getToken(request),
          story: story ?? undefined
        });
        sendJson(response, result.status, result.body);
        return;
      }

      sendJson(response, 404, {
        blocked: true,
        blockedReasons: ['未知的本机 App API 路径']
      });
    } catch (error) {
      sendJson(response, 500, {
        blocked: true,
        blockedReasons: [error instanceof Error ? error.message : String(error)]
      });
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(input.port, input.host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address() as AddressInfo;

  return {
    url: `http://${input.host}:${address.port}`,
    close: () => new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    })
  };
};
