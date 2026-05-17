import type { Command } from '@commander-js/extra-typings';
import { createPostgresDatabaseConnection } from '../../server/db/postgres.js';
import { startMultiuserServer } from '../../server/http/multiuser-server.js';
import type { StartMultiuserServerInput, MultiuserServer } from '../../server/http/multiuser-server.js';

export interface MultiuserServerCommandDependencies {
  env?: NodeJS.ProcessEnv;
  startServer?: (input: StartMultiuserServerInput) => Promise<MultiuserServer>;
  createDatabaseConnection?: typeof createPostgresDatabaseConnection;
  waitForShutdown?: () => Promise<void>;
}

const waitForShutdownSignal = (): Promise<void> => new Promise(resolve => {
  const stop = () => {
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
    resolve();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
});

export const registerMultiuserServerCommand = (
  program: Command,
  dependencies: MultiuserServerCommandDependencies = {}
): void => {
  program
    .command('server')
    .description('启动多用户 server 入口')
    .option('--host <host>', '监听地址', '127.0.0.1')
    .option('--port <port>', '监听端口', '43210')
    .option('--version <version>', '服务版本', '0.20.0')
    .action(async options => {
      const env = dependencies.env ?? process.env;
      const host = String(options.host);
      const port = Number.parseInt(String(options.port), 10);
      const version = String(options.version);
      const databaseUrl = env.STORYSPEC_DATABASE_URL?.trim();
      const databaseConnection = databaseUrl
        ? await (dependencies.createDatabaseConnection ?? createPostgresDatabaseConnection)({
          connectionString: databaseUrl,
          migrate: env.STORYSPEC_DATABASE_MIGRATE !== 'false'
        })
        : undefined;
      const server = await (dependencies.startServer ?? startMultiuserServer)({
        host,
        port,
        version,
        sessionRepository: databaseConnection?.repositories.sessions,
        projectRepository: databaseConnection?.repositories.projects,
        jobRepository: databaseConnection?.repositories.jobs,
        collaborationRepository: databaseConnection?.repositories.collaboration,
        auditRepository: databaseConnection?.repositories.audit,
        quotaRepository: databaseConnection?.repositories.quota,
        database: databaseConnection?.ready
      });

      console.log(`Multiuser server running at ${server.url}`);
      try {
        await (dependencies.waitForShutdown ?? waitForShutdownSignal)();
      } finally {
        await server.close();
        await databaseConnection?.close();
      }
    });
};
