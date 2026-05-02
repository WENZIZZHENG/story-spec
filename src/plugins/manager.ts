import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import {
  parsePluginManifest,
  type PluginCommand,
  type PluginExpert,
  type PluginManifest
} from '../domain/plugin-manifest.js';
import { AI_PLATFORMS, type AIPlatformId } from '../utils/ai-platforms.js';
import { logger } from '../utils/logger.js';

export type PluginInstallOperationKind =
  | 'copy-plugin'
  | 'install-command'
  | 'install-gemini-command'
  | 'register-expert';

export interface PluginInstallOperation {
  kind: PluginInstallOperationKind;
  sourcePath: string;
  targetPath: string;
  conflict: boolean;
  platform?: AIPlatformId;
  id?: string;
}

export interface PluginInstallConflict {
  targetPath: string;
  operation: PluginInstallOperationKind;
  id?: string;
}

export interface PluginInstallPlan {
  pluginName: string;
  sourcePath: string;
  manifest: PluginManifest;
  operations: PluginInstallOperation[];
  conflicts: PluginInstallConflict[];
}

export class PluginManager {
  private pluginsDir: string
  private commandsDirs: {
    claude: string
    cursor: string
    gemini: string
    windsurf: string
    roocode: string
  }
  private expertsDir: string

  constructor(projectRoot: string) {
    this.pluginsDir = path.join(projectRoot, 'plugins')
    this.commandsDirs = {
      claude: path.join(projectRoot, '.claude', 'commands'),
      cursor: path.join(projectRoot, '.cursor', 'commands'),
      gemini: path.join(projectRoot, '.gemini', 'commands'),
      windsurf: path.join(projectRoot, '.windsurf', 'workflows'),
      roocode: path.join(projectRoot, '.roo', 'commands')
    }
    this.expertsDir = path.join(projectRoot, 'experts')
  }

  private getCommandDir(platformId: AIPlatformId): string {
    const platform = AI_PLATFORMS.find(item => item.name === platformId)
    if (!platform) {
      throw new Error(`Unsupported AI platform: ${platformId}`)
    }

    return path.join(path.dirname(this.pluginsDir), platform.dir, platform.commandsDir)
  }

  /**
   * 扫描并加载所有插件
   */
  async loadPlugins(): Promise<void> {
    try {
      // 确保插件目录存在
      await fs.ensureDir(this.pluginsDir)

      // 扫描插件目录
      const plugins = await this.scanPlugins()

      if (plugins.length === 0) {
        logger.info('没有发现插件')
        return
      }

      logger.info(`发现 ${plugins.length} 个插件`)

      // 加载每个插件
      for (const pluginName of plugins) {
        await this.loadPlugin(pluginName)
      }

      logger.success('所有插件加载完成')
    } catch (error) {
      logger.error('加载插件失败:', error)
    }
  }

  /**
   * 扫描插件目录，返回所有插件名称
   */
  private async scanPlugins(): Promise<string[]> {
    try {
      // 检查插件目录是否存在
      if (!await fs.pathExists(this.pluginsDir)) {
        return []
      }

      const entries = await fs.promises.readdir(this.pluginsDir, { withFileTypes: true })

      // 过滤出目录，并且包含config.yaml的
      const plugins = []
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const configPath = path.join(this.pluginsDir, entry.name, 'config.yaml')
          if (await fs.pathExists(configPath)) {
            plugins.push(entry.name)
          }
        }
      }

      return plugins
    } catch (error) {
      logger.error('扫描插件目录失败:', error)
      return []
    }
  }

  /**
   * 加载单个插件
   */
  private async loadPlugin(pluginName: string): Promise<void> {
    try {
      logger.info(`加载插件: ${pluginName}`)

      // 读取插件配置
      const configPath = path.join(this.pluginsDir, pluginName, 'config.yaml')
      const config = await this.loadConfig(configPath)

      if (!config) {
        logger.warn(`插件 ${pluginName} 配置无效`)
        return
      }

      // 检查依赖
      if (!this.checkDependencies(config)) {
        logger.warn(`插件 ${pluginName} 依赖不满足`)
        return
      }

      // 注入命令
      if (config.commands && config.commands.length > 0) {
        await this.injectCommands(pluginName, config.commands)
      }

      // 注册专家
      if (config.experts && config.experts.length > 0) {
        await this.registerExperts(pluginName, config.experts)
      }

      logger.success(`插件 ${pluginName} 加载成功`)

      // 显示安装信息
      if (config.installation?.message) {
        console.log(config.installation.message)
      }
    } catch (error) {
      logger.error(`加载插件 ${pluginName} 失败:`, error)
    }
  }

  /**
   * 读取并解析插件配置
   */
  private async loadConfig(configPath: string): Promise<PluginManifest | null> {
    try {
      const content = await fs.readFile(configPath, 'utf-8')
      const result = parsePluginManifest(yaml.load(content))

      if (!result.manifest) {
        for (const manifestIssue of result.issues) {
          logger.warn(`${manifestIssue.path}: ${manifestIssue.message}`)
        }
        return null
      }

      return result.manifest
    } catch (error) {
      logger.error(`读取配置文件失败: ${configPath}`, error)
      return null
    }
  }

  private async loadManifestFromSource(sourcePath: string): Promise<PluginManifest> {
    const configPath = path.join(sourcePath, 'config.yaml')
    const content = await fs.readFile(configPath, 'utf-8')
    const result = parsePluginManifest(yaml.load(content))

    if (!result.manifest) {
      throw new Error(result.issues.map(manifestIssue => `${manifestIssue.path}: ${manifestIssue.message}`).join('\n'))
    }

    return result.manifest
  }

  /**
   * 检查插件依赖
   */
  private checkDependencies(config: PluginManifest): boolean {
    if (!config.dependencies) {
      return true
    }

    // 检查核心版本依赖
    if (config.dependencies.core) {
      // 这里简化处理，实际应该比较版本号
      // 可以使用 semver 库进行版本比较
      const requiredVersion = config.dependencies.core
      logger.debug(`需要核心版本: ${requiredVersion}`)
      // TODO: 实现版本比较逻辑
    }

    return true
  }

  /**
   * 检测项目支持的 AI 类型
   */
  private async detectSupportedAIs(): Promise<{
    claude: boolean
    cursor: boolean
    gemini: boolean
    windsurf: boolean
    roocode: boolean
  }> {
    return {
      claude: await fs.pathExists(this.commandsDirs.claude),
      cursor: await fs.pathExists(this.commandsDirs.cursor),
      gemini: await fs.pathExists(this.commandsDirs.gemini),
      windsurf: await fs.pathExists(this.commandsDirs.windsurf),
      roocode: await fs.pathExists(this.commandsDirs.roocode)
    }
  }

  private async detectSupportedPlatformIds(): Promise<AIPlatformId[]> {
    const platformIds: AIPlatformId[] = []

    for (const platform of AI_PLATFORMS) {
      if (await fs.pathExists(this.getCommandDir(platform.name))) {
        platformIds.push(platform.name)
      }
    }

    return platformIds
  }

  private async createOperation(
    operation: Omit<PluginInstallOperation, 'conflict'>
  ): Promise<PluginInstallOperation> {
    return {
      ...operation,
      conflict: await fs.pathExists(operation.targetPath)
    }
  }

  private async createCommandOperations(
    pluginName: string,
    sourcePath: string,
    commands: PluginCommand[]
  ): Promise<PluginInstallOperation[]> {
    const operations: PluginInstallOperation[] = []
    const supportedPlatformIds = await this.detectSupportedPlatformIds()

    for (const command of commands) {
      const commandSource = path.join(sourcePath, command.file)

      for (const platformId of supportedPlatformIds) {
        if (platformId === 'gemini') {
          const cmdId = path.basename(command.id, path.extname(command.id))
          const tomlSourcePath = path.join(sourcePath, 'commands-gemini', `${cmdId}.toml`)
          operations.push(await this.createOperation({
            kind: 'install-gemini-command',
            sourcePath: await fs.pathExists(tomlSourcePath) ? tomlSourcePath : commandSource,
            targetPath: path.join(this.getCommandDir(platformId), `${cmdId}.toml`),
            platform: platformId,
            id: command.id
          }))
          continue
        }

        operations.push(await this.createOperation({
          kind: 'install-command',
          sourcePath: commandSource,
          targetPath: path.join(this.getCommandDir(platformId), `${command.id}.md`),
          platform: platformId,
          id: command.id
        }))
      }
    }

    return operations
  }

  private async createExpertOperations(
    pluginName: string,
    sourcePath: string,
    experts: PluginExpert[]
  ): Promise<PluginInstallOperation[]> {
    const operations: PluginInstallOperation[] = []

    for (const expert of experts) {
      operations.push(await this.createOperation({
        kind: 'register-expert',
        sourcePath: path.join(sourcePath, expert.file),
        targetPath: path.join(this.expertsDir, 'plugins', pluginName, `${expert.id}.md`),
        id: expert.id
      }))
    }

    return operations
  }

  async planInstallPlugin(pluginName: string, sourcePath: string): Promise<PluginInstallPlan> {
    const manifest = await this.loadManifestFromSource(sourcePath)
    const operations: PluginInstallOperation[] = [
      await this.createOperation({
        kind: 'copy-plugin',
        sourcePath,
        targetPath: path.join(this.pluginsDir, pluginName),
        id: pluginName
      }),
      ...await this.createCommandOperations(pluginName, sourcePath, manifest.commands),
      ...await this.createExpertOperations(pluginName, sourcePath, manifest.experts)
    ]

    return {
      pluginName,
      sourcePath,
      manifest,
      operations,
      conflicts: operations
        .filter(operation => operation.conflict)
        .map(operation => ({
          targetPath: operation.targetPath,
          operation: operation.kind,
          id: operation.id
        }))
    }
  }

  async applyInstallPlan(plan: PluginInstallPlan): Promise<void> {
    for (const operation of plan.operations) {
      if (operation.kind === 'install-gemini-command' && operation.sourcePath.endsWith('.md')) {
        await fs.ensureDir(path.dirname(operation.targetPath))
        const command = plan.manifest.commands.find(item => item.id === operation.id)
        const markdown = await fs.readFile(operation.sourcePath, 'utf-8')
        const tomlContent = this.convertMarkdownToToml(markdown, command)
        if (tomlContent) {
          await fs.writeFile(operation.targetPath, tomlContent)
        }
        continue
      }

      await fs.ensureDir(path.dirname(operation.targetPath))
      await fs.copy(operation.sourcePath, operation.targetPath)
    }
  }

  /**
   * 注入插件命令到对应的 AI 目录
   */
  private async injectCommands(
    pluginName: string,
    commands: PluginCommand[]
  ): Promise<void> {
    if (!commands) return

    // 检测项目支持哪些 AI
    const supportedAIs = await this.detectSupportedAIs()

    for (const cmd of commands) {
      try {
        // 处理 Markdown 格式（Claude、Cursor、Windsurf）
        const sourcePath = path.join(this.pluginsDir, pluginName, cmd.file)

        if (supportedAIs.claude) {
          const destPath = path.join(this.commandsDirs.claude, `${cmd.id}.md`)
          await fs.ensureDir(this.commandsDirs.claude)
          await fs.copy(sourcePath, destPath)
          logger.debug(`注入命令到 Claude: /${cmd.id}`)
        }

        if (supportedAIs.cursor) {
          const destPath = path.join(this.commandsDirs.cursor, `${cmd.id}.md`)
          await fs.ensureDir(this.commandsDirs.cursor)
          await fs.copy(sourcePath, destPath)
          logger.debug(`注入命令到 Cursor: /${cmd.id}`)
        }

        if (supportedAIs.windsurf) {
          const destPath = path.join(this.commandsDirs.windsurf, `${cmd.id}.md`)
          await fs.ensureDir(this.commandsDirs.windsurf)
          await fs.copy(sourcePath, destPath)
          logger.debug(`注入命令到 Windsurf: /${cmd.id}`)
        }

        if (supportedAIs.roocode) {
          const destPath = path.join(this.commandsDirs.roocode, `${cmd.id}.md`)
          await fs.ensureDir(this.commandsDirs.roocode)
          await fs.copy(sourcePath, destPath)
          logger.debug(`注入命令到 Roo Code: /${cmd.id}`)
        }

        // 处理 TOML 格式（Gemini）
        if (supportedAIs.gemini) {
          // 检查是否有预定义的 TOML 版本
          const cmdId = path.basename(cmd.id, path.extname(cmd.id))
          const tomlSourcePath = path.join(this.pluginsDir, pluginName, 'commands-gemini', `${cmdId}.toml`)

          if (await fs.pathExists(tomlSourcePath)) {
            const destPath = path.join(this.commandsDirs.gemini, `${cmdId}.toml`)
            await fs.ensureDir(this.commandsDirs.gemini)
            await fs.copy(tomlSourcePath, destPath)
            logger.debug(`注入命令到 Gemini: /${cmdId} (TOML)`)
          } else {
            // 如果没有预定义的 TOML，尝试从 Markdown 转换
            try {
              const mdContent = await fs.readFile(sourcePath, 'utf-8')
              const tomlContent = this.convertMarkdownToToml(mdContent, cmd)
              if (tomlContent) {
                const destPath = path.join(this.commandsDirs.gemini, `${cmdId}.toml`)
                await fs.ensureDir(this.commandsDirs.gemini)
                await fs.writeFile(destPath, tomlContent)
                logger.debug(`自动转换并注入命令到 Gemini: /${cmdId}`)
              } else {
                logger.debug(`插件 ${pluginName} 命令 ${cmdId} 无法转换为 TOML`)
              }
            } catch (err) {
              logger.debug(`插件 ${pluginName} 命令 ${cmdId} 转换失败: ${err}`)
            }
          }
        }
      } catch (error) {
        logger.error(`注入命令 ${cmd.id} 失败:`, error)
      }
    }
  }

  /**
   * 注册插件专家
   */
  private async registerExperts(
    pluginName: string,
    experts: PluginExpert[]
  ): Promise<void> {
    if (!experts) return

    const pluginExpertsDir = path.join(this.expertsDir, 'plugins', pluginName)
    await fs.ensureDir(pluginExpertsDir)

    for (const expert of experts) {
      try {
        const sourcePath = path.join(this.pluginsDir, pluginName, expert.file)
        const destPath = path.join(pluginExpertsDir, `${expert.id}.md`)

        // 复制专家文件
        await fs.copy(sourcePath, destPath)
        logger.debug(`注册专家: ${expert.title} (${expert.id})`)
      } catch (error) {
        logger.error(`注册专家 ${expert.id} 失败:`, error)
      }
    }
  }

  /**
   * 列出所有已安装的插件
   */
  async listPlugins(): Promise<PluginManifest[]> {
    const plugins = await this.scanPlugins()
    const configs: PluginManifest[] = []

    for (const pluginName of plugins) {
      const configPath = path.join(this.pluginsDir, pluginName, 'config.yaml')
      const config = await this.loadConfig(configPath)
      if (config) {
        configs.push(config)
      }
    }

    return configs
  }

  /**
   * 安装插件（从模板或远程）
   */
  async installPlugin(pluginName: string, source?: string): Promise<void> {
    try {
      logger.info(`安装插件: ${pluginName}`)

      // 如果提供了源路径，从源复制
      if (source) {
        const plan = await this.planInstallPlugin(pluginName, source)
        await this.applyInstallPlan(plan)
        if (plan.manifest.installation?.message) {
          console.log(plan.manifest.installation.message)
        }
      } else {
        // TODO: 实现从远程仓库或注册中心安装
        logger.warn('远程安装功能尚未实现')
        return
      }

      logger.success(`插件 ${pluginName} 安装成功`)
    } catch (error) {
      logger.error(`安装插件 ${pluginName} 失败:`, error)
    }
  }

  /**
   * 移除插件
   */
  async removePlugin(pluginName: string): Promise<void> {
    try {
      logger.info(`移除插件: ${pluginName}`)

      // 删除插件目录
      const pluginPath = path.join(this.pluginsDir, pluginName)
      await fs.remove(pluginPath)

      // 删除注入的命令（从所有 AI 目录）
      const supportedAIs = await this.detectSupportedAIs()

      if (supportedAIs.claude && await fs.pathExists(this.commandsDirs.claude)) {
        const commandFiles = await fs.promises.readdir(this.commandsDirs.claude)
        for (const file of commandFiles) {
          if (file.startsWith(`plugin-${pluginName}-`)) {
            await fs.remove(path.join(this.commandsDirs.claude, file))
            logger.debug(`移除命令文件: ${file}`)
          }
        }
      }

      // 对其他 AI 目录做同样的清理
      for (const [aiType, dir] of Object.entries(this.commandsDirs)) {
        if (aiType !== 'claude' && await fs.pathExists(dir)) {
          const commandFiles = await fs.promises.readdir(dir)
          for (const file of commandFiles) {
            if (file.startsWith(`plugin-${pluginName}-`)) {
              await fs.remove(path.join(dir, file))
              logger.debug(`移除 ${aiType} 命令文件: ${file}`)
            }
          }
        }
      }

      // 删除注册的专家
      const pluginExpertsDir = path.join(this.expertsDir, 'plugins', pluginName)
      if (await fs.pathExists(pluginExpertsDir)) {
        await fs.remove(pluginExpertsDir)
        logger.debug(`移除专家目录: ${pluginExpertsDir}`)
      }

      logger.success(`插件 ${pluginName} 移除成功`)
    } catch (error) {
      logger.error(`移除插件 ${pluginName} 失败:`, error)
    }
  }

  /**
   * 将 Markdown 命令转换为 TOML 格式
   */
  private convertMarkdownToToml(mdContent: string, cmd: any): string | null {
    try {
      // 提取 frontmatter
      const frontmatterMatch = mdContent.match(/^---\n([\s\S]*?)\n---/)
      let description = cmd.description || ''

      if (frontmatterMatch) {
        const yamlContent = frontmatterMatch[1]
        const descMatch = yamlContent.match(/description:\s*(.+)/)
        if (descMatch) {
          description = descMatch[1].trim().replace(/^['"]|['"]$/g, '')
        }
      }

      // 提取内容（去除 frontmatter）
      const content = mdContent.replace(/^---\n[\s\S]*?\n---\n/, '')

      // 构建 TOML 内容
      const tomlContent = `description = "${description}"

prompt = """
${content}

用户输入：{{args}}
"""`

      return tomlContent
    } catch (error) {
      return null
    }
  }

  /**
   * 更新插件
   */
  async updatePlugin(pluginName: string, source?: string): Promise<void> {
    logger.info(`更新插件: ${pluginName}`)

    // 先移除旧版本
    await this.removePlugin(pluginName)

    // 安装新版本
    await this.installPlugin(pluginName, source)
  }
}
