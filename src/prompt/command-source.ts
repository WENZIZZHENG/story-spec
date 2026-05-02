import path from 'node:path';
import fs from 'fs-extra';
import {
  parseCommandSpec,
  type CommandSpec,
  type CommandSpecIssue
} from './command-spec.js';

export interface LegacyCommandSource {
  kind: 'legacy-template';
  commandName: string;
  template: string;
  sourcePath: string;
}

export interface SpecCommandSource {
  kind: 'command-spec';
  commandName: string;
  spec: CommandSpec;
  promptBody: string;
  sourcePath: string;
  promptPath: string;
}

export type CommandSource = LegacyCommandSource | SpecCommandSource;

export class CommandSourceError extends Error {
  constructor(
    message: string,
    readonly issues: readonly CommandSpecIssue[] = []
  ) {
    super(message);
    this.name = 'CommandSourceError';
  }
}

const commandNameFromSpecFile = (file: string): string => file.replace(/\.command\.yaml$/, '');

const commandNameFromTemplateFile = (file: string): string => file.replace(/\.md$/, '');

export const getCommandOutputFileNamesFromEntries = (entries: readonly string[]): string[] => {
  const commandNames = new Set<string>();

  for (const entry of entries) {
    if (entry.endsWith('.command.yaml')) {
      commandNames.add(commandNameFromSpecFile(entry));
      continue;
    }

    if (entry.endsWith('.md') && !entry.endsWith('.prompt.md')) {
      commandNames.add(commandNameFromTemplateFile(entry));
    }
  }

  return [...commandNames].sort().map(commandName => `${commandName}.md`);
};

const loadSpecCommandSource = async (
  commandsDir: string,
  specFile: string
): Promise<SpecCommandSource> => {
  const commandName = commandNameFromSpecFile(specFile);
  const sourcePath = path.join(commandsDir, specFile);
  const promptPath = path.join(commandsDir, `${commandName}.prompt.md`);
  const result = parseCommandSpec(await fs.readFile(sourcePath, 'utf-8'), sourcePath);

  if (!result.spec) {
    throw new CommandSourceError(
      `CommandSpec 无法加载：${sourcePath}`,
      result.issues
    );
  }

  if (!await fs.pathExists(promptPath)) {
    throw new CommandSourceError(`CommandSpec 缺少 prompt body：${promptPath}`);
  }

  return {
    kind: 'command-spec',
    commandName,
    spec: result.spec,
    promptBody: await fs.readFile(promptPath, 'utf-8'),
    sourcePath,
    promptPath
  };
};

const loadLegacyCommandSource = async (
  commandsDir: string,
  templateFile: string
): Promise<LegacyCommandSource> => {
  const sourcePath = path.join(commandsDir, templateFile);

  return {
    kind: 'legacy-template',
    commandName: commandNameFromTemplateFile(templateFile),
    template: await fs.readFile(sourcePath, 'utf-8'),
    sourcePath
  };
};

export const listCommandSources = async (rootDir: string): Promise<CommandSource[]> => {
  const commandsDir = path.join(rootDir, 'templates', 'commands');
  if (!await fs.pathExists(commandsDir)) {
    return [];
  }

  const entries = (await fs.readdir(commandsDir)).sort();
  const specFiles = entries.filter(entry => entry.endsWith('.command.yaml'));
  const specCommandNames = new Set(specFiles.map(commandNameFromSpecFile));
  const legacyTemplateFiles = entries.filter(entry =>
    entry.endsWith('.md')
    && !entry.endsWith('.prompt.md')
    && !specCommandNames.has(commandNameFromTemplateFile(entry))
  );

  return [
    ...await Promise.all(specFiles.map(file => loadSpecCommandSource(commandsDir, file))),
    ...await Promise.all(legacyTemplateFiles.map(file => loadLegacyCommandSource(commandsDir, file)))
  ].sort((left, right) => left.commandName.localeCompare(right.commandName));
};
