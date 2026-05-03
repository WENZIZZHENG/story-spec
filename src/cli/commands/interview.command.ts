import type { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  getInterviewStoryState,
  interviewStory,
  normalizeInterviewAnswers,
  prepareInterviewQuestions,
  renderInterviewSummary,
  InterviewStoryError
} from '../../application/interview-story.js';
import { StorySelectionError } from '../../application/workbench-utils.js';
import type { ClarificationQuestion } from '../../domain/clarification.js';
import { nodeFileSystem } from '../../infrastructure/node-file-system.js';
import { isInteractive } from '../../utils/interactive.js';
import { ensureProjectRoot } from '../../utils/project.js';

type InterviewCommandOptions = {
  premise?: string;
  answers?: string;
  useExamples?: boolean;
  maxQuestions?: string;
  json?: boolean;
  write?: boolean;
};

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseAnswerPairs = (value: string | undefined): Record<string, unknown> => {
  if (!value?.trim()) {
    return {};
  }

  return Object.fromEntries(
    value
      .split(';')
      .map(pair => pair.trim())
      .filter(Boolean)
      .map(pair => {
        const separatorIndex = pair.indexOf('=');
        if (separatorIndex === -1) {
          throw new InterviewStoryError(
            'INVALID_ANSWERS',
            `答案格式应为 questionId=answer，多个答案用分号分隔：${pair}`
          );
        }

        return [
          pair.slice(0, separatorIndex).trim(),
          pair.slice(separatorIndex + 1).trim()
        ];
      })
      .filter(([questionId, answer]) => questionId && answer)
  );
};

const answerPreview = (answer: unknown): string => {
  if (answer === undefined || answer === null || answer === '') {
    return '未回答';
  }

  return Array.isArray(answer) ? answer.join('、') : String(answer);
};

const resolveExampleInput = (value: string, question: ClarificationQuestion): string | undefined => {
  const exampleMatch = value.match(/^example:(\d+)$/i);
  if (!exampleMatch) {
    return undefined;
  }

  const exampleIndex = Number.parseInt(exampleMatch[1], 10) - 1;
  return question.exampleAnswers[exampleIndex];
};

const renderQuestionMessage = (
  question: ClarificationQuestion,
  existingAnswer: unknown
): string => {
  const examples = question.exampleAnswers.slice(0, 3)
    .map((example, index) => `  ${index + 1}. ${example}`)
    .join('\n');
  const options = question.options.length > 0
    ? `\n可选项：${question.options.map(option => `${option.label}(${option.value})`).join('、')}`
    : '';

  return [
    `${question.question}${question.required ? '（必答，可稍后）' : ''}`,
    chalk.dim(`影响：${question.whyItMatters}`),
    options ? chalk.dim(options) : '',
    chalk.dim(`旧答案：${answerPreview(existingAnswer)}`),
    chalk.dim(`可复制示例：\n${examples || '暂无示例。'}`),
    chalk.dim('直接回车=保留/稍后；输入 example:1 可使用第 1 个示例。')
  ].filter(Boolean).join('\n');
};

const askListQuestion = async (
  question: ClarificationQuestion,
  existingAnswer: unknown
): Promise<unknown> => {
  const skipValue = '__skip__';
  const choices = [
    ...question.options.map(option => ({
      name: `${option.label}${option.description ? ` - ${option.description}` : ''}`,
      value: `option:${option.value}`
    })),
    ...question.exampleAnswers.slice(0, 3).map((example, index) => ({
      name: `使用示例 ${index + 1}：${example}`,
      value: `example:${index + 1}`
    })),
    {
      name: `稍后回答 / 保留旧答案（${answerPreview(existingAnswer)}）`,
      value: skipValue
    }
  ];
  const answer = await inquirer.prompt<{ value: string }>([
    {
      type: 'list',
      name: 'value',
      message: [
        question.question,
        chalk.dim(`影响：${question.whyItMatters}`)
      ].join('\n'),
      choices,
      pageSize: Math.min(10, choices.length)
    }
  ]);

  if (answer.value === skipValue) {
    return undefined;
  }

  if (answer.value.startsWith('option:')) {
    return answer.value.slice('option:'.length);
  }

  return resolveExampleInput(answer.value, question);
};

const askCheckboxQuestion = async (
  question: ClarificationQuestion,
  existingAnswer: unknown
): Promise<unknown> => {
  const choices = [
    ...question.options.map(option => ({
      name: `${option.label}${option.description ? ` - ${option.description}` : ''}`,
      value: `option:${option.value}`
    })),
    ...question.exampleAnswers.slice(0, 3).map((example, index) => ({
      name: `使用示例 ${index + 1}：${example}`,
      value: `example:${index + 1}`
    }))
  ];
  const answer = await inquirer.prompt<{ values: string[] }>([
    {
      type: 'checkbox',
      name: 'values',
      message: [
        question.question,
        chalk.dim(`影响：${question.whyItMatters}`),
        chalk.dim(`旧答案：${answerPreview(existingAnswer)}`),
        chalk.dim('不选择任何项=保留/稍后。')
      ].join('\n'),
      choices,
      pageSize: Math.min(10, choices.length)
    }
  ]);
  const values = answer.values
    .map(value => value.startsWith('option:')
      ? value.slice('option:'.length)
      : resolveExampleInput(value, question))
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  return values.length > 0 ? values : undefined;
};

const askConfirmQuestion = async (
  question: ClarificationQuestion,
  existingAnswer: unknown
): Promise<unknown> => {
  const answer = await inquirer.prompt<{ value: boolean }>([
    {
      type: 'confirm',
      name: 'value',
      message: [
        question.question,
        chalk.dim(`影响：${question.whyItMatters}`),
        chalk.dim(`旧答案：${answerPreview(existingAnswer)}`)
      ].join('\n'),
      default: typeof existingAnswer === 'boolean' ? existingAnswer : false
    }
  ]);

  return answer.value;
};

const askScaleQuestion = async (
  question: ClarificationQuestion,
  existingAnswer: unknown
): Promise<unknown> => {
  const skipValue = '__skip__';
  const answer = await inquirer.prompt<{ value: string }>([
    {
      type: 'list',
      name: 'value',
      message: [
        question.question,
        chalk.dim(`影响：${question.whyItMatters}`),
        chalk.dim(`旧答案：${answerPreview(existingAnswer)}`)
      ].join('\n'),
      choices: [
        ...[1, 2, 3, 4, 5].map(value => ({
          name: String(value),
          value: String(value)
        })),
        {
          name: '稍后回答 / 保留旧答案',
          value: skipValue
        }
      ]
    }
  ]);

  return answer.value === skipValue ? undefined : Number.parseInt(answer.value, 10);
};

const askFreeformQuestion = async (
  question: ClarificationQuestion,
  existingAnswer: unknown
): Promise<unknown> => {
  const answer = await inquirer.prompt<{ value: string }>([
    {
      type: 'input',
      name: 'value',
      message: renderQuestionMessage(question, existingAnswer)
    }
  ]);
  const value = answer.value.trim();

  return resolveExampleInput(value, question) ?? value;
};

const askQuestionAnswer = async (
  question: ClarificationQuestion,
  existingAnswer: unknown
): Promise<unknown> => {
  if (question.type === 'single-choice' && question.options.length > 0) {
    return askListQuestion(question, existingAnswer);
  }

  if (question.type === 'multi-choice' && question.options.length > 0) {
    return askCheckboxQuestion(question, existingAnswer);
  }

  if (question.type === 'confirm') {
    return askConfirmQuestion(question, existingAnswer);
  }

  if (question.type === 'scale') {
    return askScaleQuestion(question, existingAnswer);
  }

  return askFreeformQuestion(question, existingAnswer);
};

const askPremise = async (premise: string | undefined, existingPremise: string | undefined): Promise<string> => {
  if (premise?.trim()) {
    return premise.trim();
  }

  const answer = await inquirer.prompt<{ premise: string }>([
    {
      type: 'input',
      name: 'premise',
      message: '一句话写下这本小说最想保留的创意：',
      default: existingPremise ?? ''
    }
  ]);

  return answer.premise.trim();
};

const askQuestionAnswers = async (
  questions: ClarificationQuestion[],
  existingAnswers: Map<string, unknown>
): Promise<Record<string, unknown>> => {
  const answers: Record<string, unknown> = {};

  for (const question of questions) {
    const answer = await askQuestionAnswer(question, existingAnswers.get(question.id));
    if (answer !== undefined && answer !== '') {
      answers[question.id] = answer;
    }
  }

  return answers;
};

const runInterviewCommand = async (
  story: string | undefined,
  options: InterviewCommandOptions
): Promise<void> => {
  try {
    const projectRoot = await ensureProjectRoot();
    const maxQuestions = parsePositiveInteger(options.maxQuestions, 6);
    let premise = options.premise?.trim();
    let answers = normalizeInterviewAnswers(parseAnswerPairs(options.answers));

    if (isInteractive() && !options.json) {
      const state = await getInterviewStoryState({
        projectRoot,
        fileSystem: nodeFileSystem,
        story
      });
      premise = await askPremise(premise, state.existingRecord?.premise);
      const prepared = await prepareInterviewQuestions({ premise, maxQuestions });
      const existingAnswers = new Map<string, unknown>(
        state.existingRecord?.answers.map(answer => [answer.questionId, answer.answer]) ?? []
      );
      const promptedAnswers = await askQuestionAnswers(prepared.questions, existingAnswers);

      answers = {
        ...answers,
        ...promptedAnswers
      };
    } else if (!premise) {
      const state = await getInterviewStoryState({
        projectRoot,
        fileSystem: nodeFileSystem,
        story
      });
      premise = state.existingRecord?.premise.trim();
      if (!premise) {
        throw new InterviewStoryError(
          'MISSING_PREMISE',
          '非交互环境请传入 --premise "一句话创意"。'
        );
      }
    }

    const result = await interviewStory({
      projectRoot,
      fileSystem: nodeFileSystem,
      story,
      premise,
      answers,
      useExamples: options.useExamples,
      maxQuestions,
      write: options.write !== false
    });

    if (options.json) {
      console.log(JSON.stringify({
        story: result.story,
        jsonPath: result.jsonPath,
        markdownPath: result.markdownPath,
        written: result.written,
        updatedAnswerIds: result.updatedAnswerIds,
        reusedAnswerIds: result.reusedAnswerIds,
        handoffPrompt: result.handoffPrompt,
        record: result.record
      }, null, 2));
      return;
    }

    console.log(renderInterviewSummary(result));
  } catch (error: any) {
    if (error.message === 'NOT_IN_PROJECT') {
      console.log(chalk.red('\n当前目录不是 novel-writer 项目'));
      console.log(chalk.gray('请在项目根目录运行此命令，或使用 novel init 创建新项目\n'));
      process.exit(1);
    }

    if (error instanceof InterviewStoryError || error instanceof StorySelectionError) {
      console.log(chalk.red(error.message));
      process.exit(1);
    }

    console.error(chalk.red('创作访谈失败'), error);
    process.exit(1);
  }
};

export const registerInterviewCommand = (program: Command): void => {
  const configureInterviewCommand = (command: Command) => command
    .argument('[story]', '故事目录名或路径，默认使用最近更新的 stories/*')
    .option('--premise <text>', '一句话创意或创作方向；非交互环境必填')
    .option('--answers <pairs>', '预填答案，格式：questionId=answer;questionId2=answer2')
    .option('--use-examples', '把未回答问题填入第一个可复制示例，适合 smoke 或快速起步')
    .option('--max-questions <number>', '本轮最多提问数量', '6')
    .option('--no-write', '只预览，不写入 clarifications.json/md')
    .option('--json', '输出 JSON，便于自动化读取')
    .description('用 CLI 完成创作访谈并生成澄清记录');

  configureInterviewCommand(program.command('interview'))
    .action(async (story, options) => {
      await runInterviewCommand(story, options);
    });

  configureInterviewCommand(program.command('clarify'))
    .description('CLI 版创作澄清；非 agent 环境下生成澄清记录')
    .action(async (story, options) => {
      await runInterviewCommand(story, options);
    });
};
