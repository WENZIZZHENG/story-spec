import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import path from 'node:path';
import {
  buildStoryGraphIndexes,
  fixSceneCardPaths,
  inspectScenes,
  inspectStoryGraph,
  renderSceneInspection,
  renderStoryGraphInspection
} from '../../application/inspect-story-structure.js';
import {
  createInitialSceneCard,
  renderSceneCardCreateSummary
} from '../../application/create-scene-card.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { ensureProjectRoot } from '../../utils/project.js';

export interface RegisterStoryStructureCommandOptions {
  packageRoot: string;
}

const handleProjectError = (error: any, fallbackMessage: string): never => {
  if (error.message === 'NOT_IN_PROJECT') {
    console.log(chalk.red('\n当前目录不是 story-spec 项目'));
    console.log(chalk.gray('请在项目根目录运行此命令，或使用 storyspec init 创建新项目\n'));
    process.exit(1);
  }

  console.error(chalk.red(fallbackMessage), error);
  process.exit(1);
};

export const registerStoryStructureCommand = (
  program: Command,
  options: RegisterStoryStructureCommandOptions
): void => {
  program
    .command('entity:list')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('列出 Entity Graph 中的 StoryEntity')
    .action(async (options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await inspectStoryGraph({ projectRoot, fileSystem: nodeFileSystem });
        const payload = {
          projectRoot: result.projectRoot,
          files: result.files,
          entities: result.entities,
          issues: result.issues
        };

        console.log(options.json ? JSON.stringify(payload, null, 2) : renderStoryGraphInspection(result));
      } catch (error: any) {
        handleProjectError(error, 'Entity Graph 读取失败');
      }
    });

  program
    .command('graph:check')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('检查 Entity Graph 的实体、边和证据路径')
    .action(async (options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await inspectStoryGraph({ projectRoot, fileSystem: nodeFileSystem });

        console.log(options.json ? JSON.stringify(result, null, 2) : renderStoryGraphInspection(result));
        if (result.issues.some(issue => issue.severity === 'error')) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        handleProjectError(error, 'Entity Graph 检查失败');
      }
    });

  program
    .command('graph:build')
    .option('--json', '输出 JSON，便于自动化读取')
    .option('--no-write', '只预览 indexes，不写入 spec/graph/indexes.json')
    .description('从显式 graph 文件构建第一版 Entity Graph 视图')
    .action(async (commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await inspectStoryGraph({ projectRoot, fileSystem: nodeFileSystem });
        const indexes = buildStoryGraphIndexes(result);
        const outputPath = path.join(projectRoot, 'spec', 'graph', 'indexes.json');
        const shouldWrite = commandOptions.write && !commandOptions.json;
        const payload = {
          ...result,
          indexes,
          outputPath: shouldWrite ? outputPath : undefined
        };

        if (shouldWrite) {
          await nodeFileSystem.writeJson(outputPath, indexes, { spaces: 2 });
        }

        console.log(commandOptions.json
          ? JSON.stringify(payload, null, 2)
          : [
            renderStoryGraphInspection(result),
            '',
            `Indexes：${Object.keys(indexes.byType).length} type / ${Object.keys(indexes.byTag).length} tag / ${Object.keys(indexes.adjacency).length} adjacency`,
            shouldWrite ? `输出：${outputPath}` : '输出：预览模式'
          ].join('\n'));

        if (result.issues.some(issue => issue.severity === 'error')) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        handleProjectError(error, 'Entity Graph 构建失败');
      }
    });

  program
    .command('scene:init')
    .argument('<story>', '故事目录名或 stories/* 路径')
    .option('--id <id>', '场景卡 ID 与文件名', 'scene-001')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('在指定故事目录创建第一张 Scene Card 模板')
    .action(async (story, commandOptions) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await createInitialSceneCard({
          projectRoot,
          packageRoot: options.packageRoot,
          fileSystem: nodeFileSystem,
          story,
          id: commandOptions.id
        });
        console.log(commandOptions.json
          ? JSON.stringify(result, null, 2)
          : renderSceneCardCreateSummary(result));
      } catch (error: any) {
        if (String(error.message).startsWith('SCENE_CARD_EXISTS:')) {
          console.log(chalk.red(`Scene Card 已存在：${error.message.replace('SCENE_CARD_EXISTS:', '')}`));
          process.exit(1);
        }
        handleProjectError(error, 'Scene Card 初始化失败');
      }
    });

  program
    .command('graph:impact')
    .argument('<entityId>', '要查看影响范围的 entity id')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('列出与指定 entity 相连的边和 evidencePaths')
    .action(async (entityId, options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const graph = await inspectStoryGraph({ projectRoot, fileSystem: nodeFileSystem });
        const entity = graph.entities.find(item => item.id === entityId);
        const edges = graph.edges.filter(edge => edge.from === entityId || edge.to === entityId);
        const result = {
          projectRoot,
          entityId,
          entity,
          edges,
          evidencePaths: [...new Set(edges.flatMap(edge => edge.evidencePaths))],
          issues: graph.issues
        };

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        console.log([
          'Graph Impact',
          '',
          `Entity：${entity ? `${entity.id} ${entity.name}` : `${entityId}（未找到）`}`,
          `Edges：${edges.length}`,
          `Evidence：${result.evidencePaths.length}`,
          '',
          ...(edges.length > 0
            ? edges.map(edge => `- ${edge.id}: ${edge.from} -> ${edge.to} (${edge.relation})`)
            : ['- 暂无关联 edge'])
        ].join('\n'));

        if (!entity || graph.issues.some(issue => issue.severity === 'error')) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        handleProjectError(error, 'Entity Graph 影响范围读取失败');
      }
    });

  program
    .command('scene:list')
    .argument('[story]', '故事目录名，默认扫描所有 stories/*')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('列出 Scene Cards')
    .action(async (story, options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await inspectScenes({ projectRoot, fileSystem: nodeFileSystem, story });

        console.log(options.json ? JSON.stringify(result, null, 2) : renderSceneInspection(result));
      } catch (error: any) {
        handleProjectError(error, 'Scene Card 读取失败');
      }
    });

  program
    .command('scene:check')
    .argument('[story]', '故事目录名，默认扫描所有 stories/*')
    .option('--json', '输出 JSON，便于自动化读取')
    .option('--fix-paths', '修复 Scene Card 中重复 stories/<story>/ 前缀的路径')
    .description('检查 Scene Cards 的关键字段和 entity 引用')
    .action(async (story, options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        if (options.fixPaths) {
          const fixResult = await fixSceneCardPaths({
            projectRoot,
            fileSystem: nodeFileSystem,
            story,
            write: true
          });
          if (options.json) {
            console.log(JSON.stringify(fixResult, null, 2));
          } else {
            console.log([
              'Scene Card 路径修复',
              '',
              `检查文件：${fixResult.checkedFiles.length}`,
              `修改文件：${fixResult.changedFiles.length}`,
              `替换：${fixResult.replacements.length}`,
              '',
              ...(fixResult.replacements.length > 0
                ? fixResult.replacements.map(item =>
                  `- ${path.relative(projectRoot, item.file)}: ${item.from} -> ${item.to}`
                )
                : ['- 无需修复'])
            ].join('\n'));
          }
          return;
        }

        const result = await inspectScenes({ projectRoot, fileSystem: nodeFileSystem, story });

        console.log(options.json ? JSON.stringify(result, null, 2) : renderSceneInspection(result));
        if (result.issues.some(issue => issue.severity === 'error')) {
          process.exitCode = 1;
        }
      } catch (error: any) {
        handleProjectError(error, 'Scene Card 检查失败');
      }
    });

  program
    .command('scene:compile')
    .argument('[story]', '故事目录名，默认扫描所有 stories/*')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('按 scene order 输出章节草稿路径清单')
    .action(async (story, options) => {
      try {
        const projectRoot = await ensureProjectRoot();
        const result = await inspectScenes({ projectRoot, fileSystem: nodeFileSystem, story });
        const draftPaths = result.scenes
          .map(scene => scene.draftPath)
          .filter((draftPath): draftPath is string => Boolean(draftPath));
        const payload = {
          projectRoot,
          storyPath: result.storyPath,
          draftPaths,
          scenes: result.scenes,
          issues: result.issues
        };

        if (options.json) {
          console.log(JSON.stringify(payload, null, 2));
          return;
        }

        console.log([
          'Scene Compile',
          '',
          `Scenes：${result.scenes.length}`,
          `Draft paths：${draftPaths.length}`,
          '',
          ...(draftPaths.length > 0 ? draftPaths.map(item => `- ${item}`) : ['- 暂无 draftPath'])
        ].join('\n'));
      } catch (error: any) {
        handleProjectError(error, 'Scene Card 编译清单生成失败');
      }
    });
};
