import type { Command } from '@commander-js/extra-typings';
import { startMultiuserServer } from '../../server/http/multiuser-server.js';

export const registerMultiuserServerCommand = (program: Command): void => {
  program
    .command('server')
    .description('启动多用户 server 入口')
    .option('--host <host>', '监听地址', '127.0.0.1')
    .option('--port <port>', '监听端口', '43210')
    .option('--version <version>', '服务版本', '0.20.0')
    .action(async options => {
      const host = String(options.host);
      const port = Number.parseInt(String(options.port), 10);
      const version = String(options.version);
      const server = await startMultiuserServer({ host, port, version });

      console.log(`Multiuser server running at ${server.url}`);
      await new Promise<void>(resolve => {
        const stop = async () => {
          await server.close();
          resolve();
        };
        process.once('SIGINT', stop);
        process.once('SIGTERM', stop);
      });
    });
};
