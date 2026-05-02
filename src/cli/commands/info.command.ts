import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';

export function registerInfoCommand(program: Command): void {
  // info 命令 - 查看方法信息（保留简单版本）
  program
    .command('info')
    .description('查看可用的写作方法')
    .action(() => {
      console.log(chalk.cyan('\n📚 可用的写作方法:\n'));
      console.log(chalk.yellow('  三幕结构') + ' - 经典的故事结构，适合大多数类型');
      console.log(chalk.yellow('  英雄之旅') + ' - 12阶段的成长之旅，适合奇幻冒险');
      console.log(chalk.yellow('  故事圈') + ' - 8环节的循环结构，适合角色驱动');
      console.log(chalk.yellow('  七点结构') + ' - 紧凑的情节结构，适合悬疑惊悚');
      console.log(chalk.yellow('  皮克斯公式') + ' - 简单有力的故事模板，适合短篇');
      console.log(chalk.yellow('  雪花十步') + ' - 系统化的递进式规划，适合细致构建');
      console.log('\n' + chalk.gray('提示：在 AI 助手中使用 /method 命令进行智能选择'));
      console.log(chalk.gray('AI 会通过对话了解你的需求，推荐最适合的方法'));
      console.log(chalk.gray('追踪系统会在写作过程中自动更新，保持数据同步'));
    });
}
