# 章节配置系统 - 技术规范

## 文档信息

- **文档名称**: 章节配置系统技术规范
- **版本**: v1.0.0
- **创建日期**: 2025-10-14
- **关联PRD**: [章节配置系统PRD](./chapter-config-system.md)
- **目标读者**: 开发人员、技术负责人

---

## 一、YAML Schema完整定义

### 1.1 JSON Schema表示

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ChapterConfig",
  "description": "章节配置文件Schema",
  "type": "object",
  "required": ["chapter", "title", "plot", "wordcount"],
  "properties": {
    "chapter": {
      "type": "integer",
      "minimum": 1,
      "description": "章节号"
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "章节标题"
    },
    "characters": {
      "type": "array",
      "description": "出场角色列表",
      "items": {
        "$ref": "#/definitions/Character"
      }
    },
    "scene": {
      "$ref": "#/definitions/Scene",
      "description": "场景配置"
    },
    "plot": {
      "$ref": "#/definitions/Plot",
      "description": "剧情配置"
    },
    "style": {
      "$ref": "#/definitions/Style",
      "description": "写作风格配置"
    },
    "wordcount": {
      "$ref": "#/definitions/Wordcount",
      "description": "字数要求"
    },
    "special_requirements": {
      "type": "string",
      "description": "特殊写作要求"
    },
    "preset_used": {
      "type": "string",
      "description": "使用的预设ID"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "创建时间"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time",
      "description": "更新时间"
    }
  },
  "definitions": {
    "Character": {
      "type": "object",
      "required": ["id", "name"],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[a-z0-9-]+$",
          "description": "角色ID，引用character-profiles.md"
        },
        "name": {
          "type": "string",
          "description": "角色名称"
        },
        "focus": {
          "type": "string",
          "enum": ["high", "medium", "low"],
          "default": "medium",
          "description": "本章重点程度"
        },
        "state_changes": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "本章状态变化"
        }
      }
    },
    "Scene": {
      "type": "object",
      "properties": {
        "location_id": {
          "type": "string",
          "pattern": "^[a-z0-9-]+$",
          "description": "地点ID，引用locations.md"
        },
        "location_name": {
          "type": "string",
          "description": "地点名称"
        },
        "time": {
          "type": "string",
          "description": "时间（如'上午10点'、'傍晚'）"
        },
        "weather": {
          "type": "string",
          "description": "天气"
        },
        "atmosphere": {
          "type": "string",
          "enum": ["tense", "relaxed", "sad", "exciting", "mysterious"],
          "description": "氛围"
        }
      }
    },
    "Plot": {
      "type": "object",
      "required": ["type", "summary"],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "ability_showcase",
            "relationship_dev",
            "conflict_combat",
            "mystery_suspense",
            "transition",
            "climax",
            "emotional_scene",
            "world_building",
            "plot_twist"
          ],
          "description": "剧情类型"
        },
        "summary": {
          "type": "string",
          "minLength": 10,
          "maxLength": 500,
          "description": "剧情概要"
        },
        "key_points": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "minItems": 1,
          "description": "关键要点"
        },
        "plotlines": {
          "type": "array",
          "items": {
            "type": "string",
            "pattern": "^PL-[0-9]+$"
          },
          "description": "涉及的线索ID"
        },
        "foreshadowing": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "pattern": "^F-[0-9]+$"
              },
              "content": {
                "type": "string"
              }
            }
          },
          "description": "本章伏笔"
        }
      }
    },
    "Style": {
      "type": "object",
      "properties": {
        "pace": {
          "type": "string",
          "enum": ["fast", "medium", "slow"],
          "default": "medium",
          "description": "节奏"
        },
        "sentence_length": {
          "type": "string",
          "enum": ["short", "medium", "long"],
          "default": "medium",
          "description": "句子长度"
        },
        "focus": {
          "type": "string",
          "enum": [
            "action",
            "dialogue",
            "psychology",
            "description",
            "dialogue_action",
            "balanced"
          ],
          "default": "balanced",
          "description": "描写重点"
        },
        "tone": {
          "type": "string",
          "enum": ["serious", "humorous", "dark", "light"],
          "description": "基调"
        }
      }
    },
    "Wordcount": {
      "type": "object",
      "required": ["target"],
      "properties": {
        "target": {
          "type": "integer",
          "minimum": 1000,
          "maximum": 10000,
          "description": "目标字数"
        },
        "min": {
          "type": "integer",
          "minimum": 500,
          "description": "最小字数"
        },
        "max": {
          "type": "integer",
          "maximum": 15000,
          "description": "最大字数"
        }
      }
    }
  }
}
```

### 1.2 TypeScript类型定义

```typescript
/**
 * 章节配置接口
 */
export interface ChapterConfig {
  /** 章节号 */
  chapter: number;

  /** 章节标题 */
  title: string;

  /** 出场角色 */
  characters?: Character[];

  /** 场景配置 */
  scene?: Scene;

  /** 剧情配置 */
  plot: Plot;

  /** 写作风格 */
  style?: Style;

  /** 字数要求 */
  wordcount: Wordcount;

  /** 特殊要求 */
  special_requirements?: string;

  /** 使用的预设 */
  preset_used?: string;

  /** 创建时间 */
  created_at?: string;

  /** 更新时间 */
  updated_at?: string;
}

/**
 * 角色配置
 */
export interface Character {
  /** 角色ID（引用character-profiles.md） */
  id: string;

  /** 角色名称 */
  name: string;

  /** 本章重点程度 */
  focus?: 'high' | 'medium' | 'low';

  /** 本章状态变化 */
  state_changes?: string[];
}

/**
 * 场景配置
 */
export interface Scene {
  /** 地点ID（引用locations.md） */
  location_id?: string;

  /** 地点名称 */
  location_name?: string;

  /** 时间 */
  time?: string;

  /** 天气 */
  weather?: string;

  /** 氛围 */
  atmosphere?: 'tense' | 'relaxed' | 'sad' | 'exciting' | 'mysterious';
}

/**
 * 剧情配置
 */
export interface Plot {
  /** 剧情类型 */
  type: PlotType;

  /** 剧情概要 */
  summary: string;

  /** 关键要点 */
  key_points?: string[];

  /** 涉及的线索 */
  plotlines?: string[];

  /** 伏笔 */
  foreshadowing?: Foreshadowing[];
}

/**
 * 剧情类型枚举
 */
export type PlotType =
  | 'ability_showcase'      // 能力展现
  | 'relationship_dev'      // 关系发展
  | 'conflict_combat'       // 冲突对抗
  | 'mystery_suspense'      // 悬念铺垫
  | 'transition'            // 过渡承接
  | 'climax'                // 高潮对决
  | 'emotional_scene'       // 情感戏
  | 'world_building'        // 世界观展开
  | 'plot_twist';           // 剧情反转

/**
 * 伏笔配置
 */
export interface Foreshadowing {
  /** 伏笔ID */
  id: string;

  /** 伏笔内容 */
  content: string;
}

/**
 * 写作风格配置
 */
export interface Style {
  /** 节奏 */
  pace?: 'fast' | 'medium' | 'slow';

  /** 句子长度 */
  sentence_length?: 'short' | 'medium' | 'long';

  /** 描写重点 */
  focus?: 'action' | 'dialogue' | 'psychology' | 'description' | 'dialogue_action' | 'balanced';

  /** 基调 */
  tone?: 'serious' | 'humorous' | 'dark' | 'light';
}

/**
 * 字数配置
 */
export interface Wordcount {
  /** 目标字数 */
  target: number;

  /** 最小字数 */
  min?: number;

  /** 最大字数 */
  max?: number;
}

/**
 * 预设配置接口
 */
export interface Preset {
  /** 预设ID */
  id: string;

  /** 预设名称 */
  name: string;

  /** 描述 */
  description: string;

  /** 类别 */
  category: 'scene' | 'style' | 'chapter';

  /** 作者 */
  author: string;

  /** 版本 */
  version: string;

  /** 默认配置 */
  defaults: Partial<ChapterConfig>;

  /** 推荐设置 */
  recommended?: {
    plot_types?: PlotType[];
    atmosphere?: Scene['atmosphere'][];
  };

  /** 兼容性 */
  compatible_genres?: string[];

  /** 使用提示 */
  usage_tips?: string[];
}
```

---

## 二、核心类设计

### 2.1 ChapterConfigManager

```typescript
/**
 * 章节配置管理器
 * 负责配置的创建、读取、验证、更新、删除
 */
export class ChapterConfigManager {
  private projectPath: string;
  private presetManager: PresetManager;
  private validator: ConfigValidator;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.presetManager = new PresetManager();
    this.validator = new ConfigValidator(projectPath);
  }

  /**
   * 创建章节配置
   */
  async createConfig(
    chapter: number,
    options: CreateConfigOptions
  ): Promise<ChapterConfig> {
    // 1. 初始化配置
    let config: ChapterConfig = {
      chapter,
      title: options.title || `第${chapter}章`,
      characters: [],
      scene: {},
      plot: {
        type: options.plotType || 'transition',
        summary: options.plotSummary || '',
        key_points: options.keyPoints || []
      },
      style: {
        pace: 'medium',
        sentence_length: 'medium',
        focus: 'balanced'
      },
      wordcount: {
        target: options.wordcount || 3000,
        min: Math.floor((options.wordcount || 3000) * 0.8),
        max: Math.floor((options.wordcount || 3000) * 1.2)
      },
      created_at: new Date().toISOString()
    };

    // 2. 应用预设（如果指定）
    if (options.preset) {
      const preset = await this.presetManager.loadPreset(options.preset);
      config = this.applyPreset(preset, config);
    }

    // 3. 合并用户输入
    if (options.characters) {
      config.characters = await this.loadCharacterDetails(options.characters);
    }

    if (options.scene) {
      config.scene = await this.loadSceneDetails(options.scene);
    }

    // 4. 验证配置
    const validation = await this.validator.validate(config);
    if (!validation.valid) {
      throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
    }

    // 5. 保存到文件
    const configPath = this.getConfigPath(chapter);
    await fs.ensureDir(path.dirname(configPath));
    await fs.writeFile(configPath, yaml.dump(config, { indent: 2 }), 'utf-8');

    return config;
  }

  /**
   * 加载章节配置
   */
  async loadConfig(chapter: number): Promise<ChapterConfig | null> {
    const configPath = this.getConfigPath(chapter);

    if (!await fs.pathExists(configPath)) {
      return null;
    }

    const content = await fs.readFile(configPath, 'utf-8');
    const config = yaml.load(content) as ChapterConfig;

    // 验证配置
    const validation = await this.validator.validate(config);
    if (!validation.valid) {
      console.warn(`配置文件存在问题: ${validation.errors.join(', ')}`);
    }

    return config;
  }

  /**
   * 更新章节配置
   */
  async updateConfig(
    chapter: number,
    updates: Partial<ChapterConfig>
  ): Promise<ChapterConfig> {
    const config = await this.loadConfig(chapter);
    if (!config) {
      throw new Error(`配置文件不存在: chapter ${chapter}`);
    }

    const updatedConfig = {
      ...config,
      ...updates,
      updated_at: new Date().toISOString()
    };

    // 验证更新后的配置
    const validation = await this.validator.validate(updatedConfig);
    if (!validation.valid) {
      throw new Error(`更新后配置无效: ${validation.errors.join(', ')}`);
    }

    // 保存
    const configPath = this.getConfigPath(chapter);
    await fs.writeFile(
      configPath,
      yaml.dump(updatedConfig, { indent: 2 }),
      'utf-8'
    );

    return updatedConfig;
  }

  /**
   * 删除章节配置
   */
  async deleteConfig(chapter: number): Promise<void> {
    const configPath = this.getConfigPath(chapter);

    if (!await fs.pathExists(configPath)) {
      throw new Error(`配置文件不存在: chapter ${chapter}`);
    }

    await fs.remove(configPath);
  }

  /**
   * 列出所有配置
   */
  async listConfigs(): Promise<ChapterConfigSummary[]> {
    const chaptersDir = path.join(
      this.projectPath,
      'stories',
      '*',
      'chapters'
    );

    const configFiles = await glob(path.join(chaptersDir, '*.yaml'));

    const summaries: ChapterConfigSummary[] = [];

    for (const file of configFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const config = yaml.load(content) as ChapterConfig;

      summaries.push({
        chapter: config.chapter,
        title: config.title,
        plotType: config.plot.type,
        location: config.scene?.location_name || '-',
        wordcount: config.wordcount.target,
        preset: config.preset_used,
        createdAt: config.created_at
      });
    }

    return summaries.sort((a, b) => a.chapter - b.chapter);
  }

  /**
   * 复制配置
   */
  async copyConfig(
    fromChapter: number,
    toChapter: number,
    modifications?: Partial<ChapterConfig>
  ): Promise<ChapterConfig> {
    const sourceConfig = await this.loadConfig(fromChapter);
    if (!sourceConfig) {
      throw new Error(`源配置不存在: chapter ${fromChapter}`);
    }

    const newConfig: ChapterConfig = {
      ...sourceConfig,
      chapter: toChapter,
      ...modifications,
      created_at: new Date().toISOString(),
      updated_at: undefined
    };

    return this.createConfig(toChapter, {
      title: newConfig.title,
      plotType: newConfig.plot.type,
      plotSummary: newConfig.plot.summary,
      keyPoints: newConfig.plot.key_points,
      wordcount: newConfig.wordcount.target,
      // ...
    } as CreateConfigOptions);
  }

  // ========== 私有辅助方法 ==========

  private getConfigPath(chapter: number): string {
    // 查找项目中的stories目录
    const storiesDir = path.join(this.projectPath, 'stories');
    const storyDirs = fs.readdirSync(storiesDir);

    if (storyDirs.length === 0) {
      throw new Error('未找到故事目录');
    }

    // 使用第一个故事目录（通常只有一个）
    const storyDir = storyDirs[0];
    return path.join(
      storiesDir,
      storyDir,
      'chapters',
      `chapter-${chapter}-config.yaml`
    );
  }

  private applyPreset(
    preset: Preset,
    config: ChapterConfig
  ): ChapterConfig {
    return {
      ...config,
      ...preset.defaults,
      preset_used: preset.id,
      // 合并special_requirements
      special_requirements: [
        preset.defaults.special_requirements,
        config.special_requirements
      ].filter(Boolean).join('\n\n')
    };
  }

  private async loadCharacterDetails(
    characterIds: string[]
  ): Promise<Character[]> {
    // 从character-profiles.md加载详情
    // 实现省略...
    return [];
  }

  private async loadSceneDetails(
    sceneId: string
  ): Promise<Scene> {
    // 从locations.md加载详情
    // 实现省略...
    return {};
  }
}

/**
 * 配置摘要接口
 */
export interface ChapterConfigSummary {
  chapter: number;
  title: string;
  plotType: PlotType;
  location: string;
  wordcount: number;
  preset?: string;
  createdAt?: string;
}

/**
 * 创建配置选项
 */
export interface CreateConfigOptions {
  title?: string;
  characters?: string[];
  scene?: string;
  plotType?: PlotType;
  plotSummary?: string;
  keyPoints?: string[];
  preset?: string;
  wordcount?: number;
  style?: Partial<Style>;
  specialRequirements?: string;
}
```

### 2.2 PresetManager

```typescript
/**
 * 预设管理器
 * 负责预设的加载、创建、导入、导出
 */
export class PresetManager {
  private presetDirs: string[];

  constructor() {
    this.presetDirs = [
      path.join(process.cwd(), 'stories', '*', 'presets'),  // 项目本地
      path.join(os.homedir(), '.novel', 'presets', 'user'), // 用户自定义
      path.join(os.homedir(), '.novel', 'presets', 'community'), // 社区
      path.join(os.homedir(), '.novel', 'presets', 'official'), // 官方
      path.join(__dirname, '..', '..', 'presets')  // 内置
    ];
  }

  /**
   * 加载预设
   */
  async loadPreset(presetId: string): Promise<Preset> {
    for (const dir of this.presetDirs) {
      const presetPath = await this.findPresetInDir(dir, presetId);
      if (presetPath) {
        const content = await fs.readFile(presetPath, 'utf-8');
        return yaml.load(content) as Preset;
      }
    }

    throw new Error(`预设未找到: ${presetId}`);
  }

  /**
   * 列出所有预设
   */
  async listPresets(category?: string): Promise<PresetInfo[]> {
    const presets: PresetInfo[] = [];
    const seen = new Set<string>();

    for (const dir of this.presetDirs) {
      if (!await fs.pathExists(dir)) continue;

      const files = await glob(path.join(dir, '**', '*.yaml'));

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const preset = yaml.load(content) as Preset;

        // 跳过重复ID（优先级高的已加载）
        if (seen.has(preset.id)) continue;

        // 类别过滤
        if (category && preset.category !== category) continue;

        seen.add(preset.id);
        presets.push({
          id: preset.id,
          name: preset.name,
          description: preset.description,
          category: preset.category,
          author: preset.author,
          source: this.getPresetSource(file)
        });
      }
    }

    return presets;
  }

  /**
   * 创建预设
   */
  async createPreset(preset: Preset, target: 'user' | 'project'): Promise<void> {
    const targetDir = target === 'user'
      ? path.join(os.homedir(), '.novel', 'presets', 'user')
      : path.join(process.cwd(), 'stories', '*', 'presets');

    await fs.ensureDir(targetDir);

    const presetPath = path.join(targetDir, `${preset.id}.yaml`);
    await fs.writeFile(presetPath, yaml.dump(preset, { indent: 2 }), 'utf-8');
  }

  /**
   * 导入预设
   */
  async importPreset(file: string, target: 'user' | 'community'): Promise<void> {
    const content = await fs.readFile(file, 'utf-8');
    const preset = yaml.load(content) as Preset;

    const targetDir = path.join(
      os.homedir(),
      '.novel',
      'presets',
      target
    );

    await fs.ensureDir(targetDir);
    await fs.copy(file, path.join(targetDir, path.basename(file)));
  }

  /**
   * 导出预设
   */
  async exportPreset(presetId: string, outputPath: string): Promise<void> {
    const preset = await this.loadPreset(presetId);
    await fs.writeFile(outputPath, yaml.dump(preset, { indent: 2 }), 'utf-8');
  }

  // ========== 私有方法 ==========

  private async findPresetInDir(
    dir: string,
    presetId: string
  ): Promise<string | null> {
    if (!await fs.pathExists(dir)) return null;

    const files = await glob(path.join(dir, '**', `${presetId}.yaml`));
    return files.length > 0 ? files[0] : null;
  }

  private getPresetSource(filePath: string): PresetSource {
    if (filePath.includes('.storyspec/presets/official')) return 'official';
    if (filePath.includes('.storyspec/presets/community')) return 'community';
    if (filePath.includes('.storyspec/presets/user')) return 'user';
    if (filePath.includes('stories')) return 'project';
    return 'builtin';
  }
}

/**
 * 预设信息接口
 */
export interface PresetInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  source: PresetSource;
}

export type PresetSource = 'official' | 'community' | 'user' | 'project' | 'builtin';
```

### 2.3 ConfigValidator

```typescript
/**
 * 配置验证器
 * 负责验证配置的完整性、一致性、引用完整性
 */
export class ConfigValidator {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * 验证配置
   */
  async validate(config: ChapterConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. 必填字段检查
    if (!config.chapter) errors.push('缺少章节号');
    if (!config.title || config.title.trim() === '') errors.push('缺少章节标题');
    if (!config.plot || !config.plot.summary) errors.push('缺少剧情概要');
    if (!config.wordcount || !config.wordcount.target) errors.push('缺少目标字数');

    // 2. 数据类型和范围检查
    if (config.chapter < 1) errors.push('章节号必须大于0');
    if (config.wordcount.target < 1000 || config.wordcount.target > 10000) {
      warnings.push('目标字数建议在1000-10000之间');
    }

    // 3. 引用完整性检查
    if (config.characters) {
      for (const char of config.characters) {
        const exists = await this.checkCharacterExists(char.id);
        if (!exists) {
          errors.push(`角色ID "${char.id}" 不存在于 character-profiles.md`);
        }
      }
    }

    if (config.scene?.location_id) {
      const exists = await this.checkLocationExists(config.scene.location_id);
      if (!exists) {
        errors.push(`地点ID "${config.scene.location_id}" 不存在于 locations.md`);
      }
    }

    if (config.plot.plotlines) {
      for (const plotline of config.plot.plotlines) {
        const exists = await this.checkPlotlineExists(plotline);
        if (!exists) {
          errors.push(`线索ID "${plotline}" 不存在于 specification.md`);
        }
      }
    }

    // 4. 逻辑一致性检查
    const { min, target, max } = config.wordcount;
    if (min && target && min > target) {
      errors.push('最小字数不能大于目标字数');
    }
    if (target && max && target > max) {
      errors.push('目标字数不能大于最大字数');
    }

    // 5. 最佳实践建议
    if (!config.characters || config.characters.length === 0) {
      warnings.push('建议至少指定一个出场角色');
    }

    if (!config.plot.key_points || config.plot.key_points.length < 3) {
      warnings.push('建议至少列出3个关键要点');
    }

    if (!config.scene) {
      warnings.push('建议配置场景信息');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ========== 私有方法 ==========

  private async checkCharacterExists(id: string): Promise<boolean> {
    const profilesPath = path.join(
      this.projectPath,
      'spec',
      'knowledge',
      'character-profiles.md'
    );

    if (!await fs.pathExists(profilesPath)) {
      return false;
    }

    const content = await fs.readFile(profilesPath, 'utf-8');
    // 检查是否包含该角色ID（简化实现）
    return content.includes(`id: ${id}`) || content.includes(`ID: ${id}`);
  }

  private async checkLocationExists(id: string): Promise<boolean> {
    const locationsPath = path.join(
      this.projectPath,
      'spec',
      'knowledge',
      'locations.md'
    );

    if (!await fs.pathExists(locationsPath)) {
      return false;
    }

    const content = await fs.readFile(locationsPath, 'utf-8');
    return content.includes(`id: ${id}`) || content.includes(`ID: ${id}`);
  }

  private async checkPlotlineExists(id: string): Promise<boolean> {
    const specPath = path.join(
      this.projectPath,
      'stories',
      '*',
      'specification.md'
    );

    const specs = await glob(specPath);
    if (specs.length === 0) return false;

    const content = await fs.readFile(specs[0], 'utf-8');
    return content.includes(id);
  }
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

---

## 三、CLI命令实现

### 3.1 命令入口文件

```typescript
// src/commands/chapter-config.ts

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { ChapterConfigManager } from '../core/chapter-config.js';
import { PresetManager } from '../core/preset-manager.js';

/**
 * 注册chapter-config命令
 */
export function registerChapterConfigCommands(program: Command): void {
  const chapterConfig = program
    .command('chapter-config')
    .description('章节配置管理');

  // create 命令
  chapterConfig
    .command('create <chapter>')
    .option('-i, --interactive', '交互式创建')
    .option('-p, --preset <preset-id>', '使用预设')
    .option('--from-prompt', '从自然语言生成')
    .description('创建章节配置')
    .action(async (chapter, options) => {
      try {
        const chapterNum = parseInt(chapter);
        if (isNaN(chapterNum)) {
          console.error(chalk.red('章节号必须是数字'));
          process.exit(1);
        }

        if (options.interactive) {
          await createConfigInteractive(chapterNum);
        } else if (options.preset) {
          await createConfigWithPreset(chapterNum, options.preset);
        } else {
          console.error(chalk.red('请指定 --interactive 或 --preset'));
          process.exit(1);
        }
      } catch (error: any) {
        console.error(chalk.red(`创建失败: ${error.message}`));
        process.exit(1);
      }
    });

  // list 命令
  chapterConfig
    .command('list')
    .option('--format <type>', '输出格式: table|json|yaml', 'table')
    .description('列出所有章节配置')
    .action(async (options) => {
      try {
        await listConfigs(options.format);
      } catch (error: any) {
        console.error(chalk.red(`列出失败: ${error.message}`));
        process.exit(1);
      }
    });

  // validate 命令
  chapterConfig
    .command('validate <chapter>')
    .description('验证章节配置')
    .action(async (chapter) => {
      try {
        const chapterNum = parseInt(chapter);
        await validateConfig(chapterNum);
      } catch (error: any) {
        console.error(chalk.red(`验证失败: ${error.message}`));
        process.exit(1);
      }
    });

  // copy 命令
  chapterConfig
    .command('copy <from> <to>')
    .option('-i, --interactive', '交互式修改差异')
    .description('复制章节配置')
    .action(async (from, to, options) => {
      try {
        const fromChapter = parseInt(from);
        const toChapter = parseInt(to);
        await copyConfig(fromChapter, toChapter, options.interactive);
      } catch (error: any) {
        console.error(chalk.red(`复制失败: ${error.message}`));
        process.exit(1);
      }
    });

  // edit 命令
  chapterConfig
    .command('edit <chapter>')
    .option('-e, --editor <editor>', '指定编辑器', 'vim')
    .description('编辑章节配置')
    .action(async (chapter, options) => {
      try {
        const chapterNum = parseInt(chapter);
        await editConfig(chapterNum, options.editor);
      } catch (error: any) {
        console.error(chalk.red(`编辑失败: ${error.message}`));
        process.exit(1);
      }
    });

  // delete 命令
  chapterConfig
    .command('delete <chapter>')
    .description('删除章节配置')
    .action(async (chapter) => {
      try {
        const chapterNum = parseInt(chapter);
        await deleteConfig(chapterNum);
      } catch (error: any) {
        console.error(chalk.red(`删除失败: ${error.message}`));
        process.exit(1);
      }
    });
}

/**
 * 交互式创建配置
 */
async function createConfigInteractive(chapter: number): Promise<void> {
  // 实现见前文 2.4.2 节
  console.log(chalk.cyan(`\n📝 创建第${chapter}章配置\n`));

  // ...（完整实现省略）
}

/**
 * 使用预设创建配置
 */
async function createConfigWithPreset(
  chapter: number,
  presetId: string
): Promise<void> {
  const spinner = ora('加载预设...').start();

  try {
    const presetManager = new PresetManager();
    const preset = await presetManager.loadPreset(presetId);

    spinner.succeed(chalk.green(`已加载预设: ${preset.name}`));

    // 提示用户补充必要信息
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: '章节标题:',
        validate: (input) => input.length > 0
      },
      {
        type: 'input',
        name: 'characters',
        message: '出场角色 (逗号分隔):',
        validate: (input) => input.length > 0
      },
      {
        type: 'input',
        name: 'scene',
        message: '场景:',
        validate: (input) => input.length > 0
      },
      {
        type: 'input',
        name: 'plotSummary',
        message: '剧情概要:',
        validate: (input) => input.length > 10
      }
    ]);

    // 创建配置
    const manager = new ChapterConfigManager(process.cwd());
    const config = await manager.createConfig(chapter, {
      title: answers.title,
      characters: answers.characters.split(',').map(c => c.trim()),
      scene: answers.scene,
      plotSummary: answers.plotSummary,
      preset: presetId
    });

    console.log(chalk.green(`\n✅ 配置已保存`));
    console.log(chalk.gray(`文件: ${getConfigPath(chapter)}`));
  } catch (error: any) {
    spinner.fail(chalk.red(`创建失败: ${error.message}`));
    process.exit(1);
  }
}

/**
 * 列出所有配置
 */
async function listConfigs(format: string): Promise<void> {
  const spinner = ora('加载配置列表...').start();

  try {
    const manager = new ChapterConfigManager(process.cwd());
    const configs = await manager.listConfigs();

    spinner.stop();

    if (configs.length === 0) {
      console.log(chalk.yellow('\n暂无章节配置'));
      return;
    }

    console.log(chalk.cyan(`\n📋 已有章节配置 (${configs.length}个):\n`));

    if (format === 'table') {
      // 表格输出
      console.table(configs.map(c => ({
        '章节': `第${c.chapter}章`,
        '标题': c.title,
        '类型': c.plotType,
        '场景': c.location,
        '字数': c.wordcount,
        '预设': c.preset || '-'
      })));
    } else if (format === 'json') {
      console.log(JSON.stringify(configs, null, 2));
    } else if (format === 'yaml') {
      console.log(yaml.dump(configs));
    }
  } catch (error: any) {
    spinner.fail(chalk.red(`加载失败: ${error.message}`));
    process.exit(1);
  }
}

/**
 * 验证配置
 */
async function validateConfig(chapter: number): Promise<void> {
  console.log(chalk.cyan(`\n🔍 验证配置文件: chapter-${chapter}-config.yaml\n`));

  const manager = new ChapterConfigManager(process.cwd());
  const config = await manager.loadConfig(chapter);

  if (!config) {
    console.error(chalk.red('❌ 配置文件不存在'));
    process.exit(1);
  }

  const validator = new ConfigValidator(process.cwd());
  const result = await validator.validate(config);

  if (result.valid) {
    console.log(chalk.green('✅ 验证通过！\n'));
  } else {
    console.log(chalk.red(`❌ 验证失败 (${result.errors.length}个错误):\n`));
    result.errors.forEach((error, index) => {
      console.log(chalk.red(`  ${index + 1}. ${error}`));
    });
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log(chalk.yellow(`⚠️  警告 (${result.warnings.length}个):\n`));
    result.warnings.forEach((warning, index) => {
      console.log(chalk.yellow(`  ${index + 1}. ${warning}`));
    });
    console.log('');
  }

  if (!result.valid) {
    process.exit(1);
  }
}

/**
 * 复制配置
 */
async function copyConfig(
  from: number,
  to: number,
  interactive: boolean
): Promise<void> {
  const manager = new ChapterConfigManager(process.cwd());

  console.log(chalk.cyan(`\n📋 复制配置: 第${from}章 → 第${to}章\n`));

  if (interactive) {
    // 交互式修改差异
    const sourceConfig = await manager.loadConfig(from);
    if (!sourceConfig) {
      console.error(chalk.red('源配置不存在'));
      process.exit(1);
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: '新标题:',
        default: sourceConfig.title
      },
      {
        type: 'input',
        name: 'plotSummary',
        message: '剧情概要:',
        default: sourceConfig.plot.summary
      }
      // ...更多字段
    ]);

    await manager.copyConfig(from, to, answers);
  } else {
    await manager.copyConfig(from, to);
  }

  console.log(chalk.green(`\n✅ 配置已复制`));
}

/**
 * 编辑配置
 */
async function editConfig(chapter: number, editor: string): Promise<void> {
  const configPath = getConfigPath(chapter);

  if (!await fs.pathExists(configPath)) {
    console.error(chalk.red('配置文件不存在'));
    process.exit(1);
  }

  // 调用编辑器
  const { spawn } = await import('child_process');
  const child = spawn(editor, [configPath], {
    stdio: 'inherit'
  });

  child.on('exit', (code) => {
    if (code === 0) {
      console.log(chalk.green('\n✅ 编辑完成'));
    } else {
      console.error(chalk.red('\n❌ 编辑失败'));
      process.exit(1);
    }
  });
}

/**
 * 删除配置
 */
async function deleteConfig(chapter: number): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `确认删除第${chapter}章配置?`,
      default: false
    }
  ]);

  if (!answers.confirm) {
    console.log(chalk.yellow('已取消'));
    return;
  }

  const manager = new ChapterConfigManager(process.cwd());
  await manager.deleteConfig(chapter);

  console.log(chalk.green(`\n✅ 配置已删除`));
}

// 辅助函数
function getConfigPath(chapter: number): string {
  // 实现省略...
  return '';
}
```

---

## 四、write.md模板集成

### 4.1 模板修改方案

**修改位置**: `templates/commands/write.md`

**修改内容**:

```markdown
---
description: 基于任务清单执行章节写作，自动加载上下文和验证规则
argument-hint: [章节编号或任务ID]
allowed-tools: Read(//**), Write(//stories/**/content/**), Bash(ls:*), Bash(find:*), Bash(wc:*), Bash(grep:*), Bash(*)
model: claude-sonnet-4-5-20250929
scripts:
  sh: .specify/scripts/bash/check-writing-state.sh
  ps: .specify/scripts/powershell/check-writing-state.ps1
---

基于七步方法论流程执行章节写作。
---

## 前置检查

1. 运行脚本 `{SCRIPT}` 检查创作状态

2. **🆕 检查章节配置文件**（新增）
   ```bash
   # 检查是否存在配置文件
   chapter_num="$CHAPTER_NUMBER"  # 从$ARGUMENTS解析
   config_file="stories/*/chapters/chapter-${chapter_num}-config.yaml"

   if [ -f "$config_file" ]; then
     echo "✅ 发现配置文件，加载中..."
     # 读取配置文件
     CONFIG_CONTENT=$(cat "$config_file")
   else
     echo "ℹ️  无配置文件，使用自然语言模式"
     CONFIG_CONTENT=""
   fi
   ```

### 查询协议（必读顺序）

⚠️ **重要**：请严格按照以下顺序查询文档，确保上下文完整且优先级正确。

**查询顺序**：

1. **🆕 先查（章节配置 - 如果存在）**（新增）：
   - `stories/*/chapters/chapter-X-config.yaml`（章节配置文件）
   - 如果配置文件存在，解析并提取：
     - 出场角色ID列表
     - 场景ID
     - 剧情类型、概要、关键要点
     - 写作风格参数
     - 字数要求
     - 特殊要求

2. **先查（最高优先级）**：
   - `memory/storyspec-constitution.md`（创作宪法 - 最高原则）
   - `memory/style-reference.md`（风格参考 - 如果通过 `/book-internalize` 生成）

3. **再查（规格和计划）**：
   - `stories/*/specification.md`（故事规格）
   - `stories/*/creative-plan.md`（创作计划）
   - `stories/*/tasks.md`（当前任务）

4. **🆕 根据配置加载详细信息**（新增）：
   如果配置文件指定了角色和场景，加载详细信息：

   ```
   # 加载角色详情
   对于配置中的每个角色ID：
   1. 从 spec/knowledge/character-profiles.md 查找角色完整档案
   2. 从 spec/tracking/character-state.json 获取最新状态
   3. 合并信息供后续使用

   # 加载场景详情
   如果配置指定了 scene.location_id：
   1. 从 spec/knowledge/locations.md 查找场景详细描述
   2. 提取场景的环境、氛围、特征

   # 加载线索详情
   如果配置指定了 plot.plotlines：
   1. 从 stories/*/specification.md 查找线索定义
   2. 获取线索的当前状态和目标
   ```

5. **再查（状态和数据）**：
   - `spec/tracking/character-state.json`（角色状态）
   - `spec/tracking/relationships.json`（关系网络）
   - `spec/tracking/plot-tracker.json`（情节追踪 - 如有）
   - `spec/tracking/validation-rules.json`（验证规则 - 如有）

6. **再查（知识库）**：
   - `spec/knowledge/` 相关文件（世界观、角色档案等）
   - `stories/*/content/`（前文内容 - 了解前情）

7. **再查（写作规范）**：
   - `memory/personal-voice.md`（个人语料 - 如有）
   - `spec/knowledge/natural-expression.md`（自然化表达 - 如有）
   - `spec/presets/anti-ai-detection.md`（反AI检测规范）

8. **条件查询（前三章专用）**：
   - **如果章节编号 ≤ 3 或总字数 < 10000字**，额外查询：
     - `spec/presets/golden-opening.md`（黄金开篇法则）
     - 并严格遵循其中的五大法则

## 写作执行流程

### 1. 选择写作任务
从 `tasks.md` 中选择状态为 `pending` 的写作任务，标记为 `in_progress`。

### 2. 验证前置条件
- 检查相关依赖任务是否完成
- 验证必要的设定是否就绪
- 确认前序章节是否完成

### 3. **🆕 构建章节写作提示词**（修改）

**如果有配置文件**：

```
📋 本章配置:

**基本信息**:
- 章节: 第{{chapter}}章 - {{title}}
- 字数要求: {{wordcount.min}}-{{wordcount.max}}字（目标{{wordcount.target}}字）

**出场角色** ({{characters.length}}人):
{{#each characters}}
- **{{name}}**（{{role}} - {{focus}}重点）
  [从character-profiles.md读取的详细档案]
  性格: {{personality}}
  背景: {{background}}

  当前状态:（从character-state.json读取）
  - 位置: {{location}}
  - 健康: {{health}}
  - 心情: {{mood}}
  - 与其他角色关系: {{relationships}}
{{/each}}

**场景设定**:
- 地点: {{scene.location_name}}
  [从locations.md读取的场景详情]
  详细描述: {{location_details}}
  特征: {{features}}

- 时间: {{scene.time}}
- 天气: {{scene.weather}}
- 氛围: {{scene.atmosphere}}

**剧情要求**:
- 类型: {{plot.type}}（{{plot_type_description}}）
- 概要: {{plot.summary}}
- 关键要点:
  {{#each plot.key_points}}
  {{index}}. {{this}}
  {{/each}}

{{#if plot.plotlines}}
- 涉及线索:
  {{#each plot.plotlines}}
  - {{this}}: [从specification.md读取线索详情]
  {{/each}}
{{/if}}

{{#if plot.foreshadowing}}
- 本章伏笔:
  {{#each plot.foreshadowing}}
  - {{id}}: {{content}}
  {{/each}}
{{/if}}

**写作风格**:
- 节奏: {{style.pace}}（{{pace_description}}）
- 句长: {{style.sentence_length}}（{{sentence_description}}）
- 重点: {{style.focus}}（{{focus_description}}）
- 基调: {{style.tone}}

{{#if special_requirements}}
**特殊要求**:
{{special_requirements}}
{{/if}}

{{#if preset_used}}
**应用预设**: {{preset_used}}
{{/if}}

---

[以下加载全局规格文档...]
```

**如果无配置文件**（向后兼容）：

```
📋 基于用户输入:

用户描述: $ARGUMENTS

[解析自然语言，提取参数]

[加载全局规格文档...]
```

### 4. 写作前提醒
**基于宪法原则提醒**：
- 核心价值观要点
- 质量标准要求
- 风格一致性准则

**基于规格要求提醒**：
- P0 必须包含的元素
- 目标读者特征
- 内容红线提醒

**分段格式规范（重要）**：
[保持原有内容]

**反AI检测写作规范（基于腾讯朱雀标准）**：
[保持原有内容]

### 5. 根据计划创作内容：
   - **开场**：吸引读者，承接前文
   - **发展**：推进情节，深化人物
   - **转折**：制造冲突或悬念
   - **收尾**：适当收束，引出下文

### 6. 质量自检
[保持原有内容]

### 7. 保存和更新
- 将章节内容保存到 `stories/*/content/`
- **🆕 如果使用了配置文件，更新 `updated_at` 时间戳**（新增）
- 更新任务状态为 `completed`
- 记录完成时间和字数

[其余内容保持不变...]
```

### 4.2 配置加载逻辑实现

在write.md模板中，AI需要执行以下逻辑：

```typescript
// 伪代码：AI执行逻辑

// 1. 解析章节号
const chapterNum = parseChapterNumber($ARGUMENTS);

// 2. 检查配置文件
const configPath = `stories/*/chapters/chapter-${chapterNum}-config.yaml`;
const config = await loadYamlFile(configPath);

if (config) {
  // 3. 加载角色详情
  for (const char of config.characters) {
    const profile = await extractFromMarkdown(
      'spec/knowledge/character-profiles.md',
      char.id
    );
    const state = await loadJson('spec/tracking/character-state.json')[char.id];
    char.details = { ...profile, ...state };
  }

  // 4. 加载场景详情
  if (config.scene.location_id) {
    config.scene.details = await extractFromMarkdown(
      'spec/knowledge/locations.md',
      config.scene.location_id
    );
  }

  // 5. 加载线索详情
  if (config.plot.plotlines) {
    for (const plotlineId of config.plot.plotlines) {
      const plotline = await extractFromMarkdown(
        'stories/*/specification.md',
        plotlineId
      );
      config.plot.plotlineDetails.push(plotline);
    }
  }

  // 6. 构建结构化提示词
  const prompt = buildPromptFromConfig(config);
} else {
  // 7. 使用自然语言模式
  const prompt = parseNaturalLanguage($ARGUMENTS);
}

// 8. 加载全局规格
const globalSpecs = await loadGlobalSpecs();

// 9. 合并提示词
const fullPrompt = mergePrompts(prompt, globalSpecs);

// 10. 生成章节内容
const content = await generateChapterContent(fullPrompt);

// 11. 保存
await saveChapterContent(chapterNum, content);

// 12. 更新配置文件时间戳
if (config) {
  config.updated_at = new Date().toISOString();
  await saveYamlFile(configPath, config);
}
```

---

## 五、测试策略

### 5.1 单元测试

**测试范围**:
- ChapterConfigManager 所有方法
- PresetManager 所有方法
- ConfigValidator 所有验证规则

**测试框架**: Jest

**测试覆盖率目标**: > 80%

**测试示例**:

```typescript
// test/chapter-config.test.ts

describe('ChapterConfigManager', () => {
  let manager: ChapterConfigManager;

  beforeEach(() => {
    manager = new ChapterConfigManager('/test/project');
  });

  describe('createConfig', () => {
    it('should create config with valid parameters', async () => {
      const config = await manager.createConfig(5, {
        title: '测试章节',
        plotType: 'ability_showcase',
        plotSummary: '测试剧情概要',
        wordcount: 3000
      });

      expect(config.chapter).toBe(5);
      expect(config.title).toBe('测试章节');
      expect(config.plot.type).toBe('ability_showcase');
      expect(config.wordcount.target).toBe(3000);
    });

    it('should apply preset correctly', async () => {
      const config = await manager.createConfig(5, {
        title: '动作章节',
        preset: 'action-intense'
      });

      expect(config.preset_used).toBe('action-intense');
      expect(config.style.pace).toBe('fast');
      expect(config.style.sentence_length).toBe('short');
    });

    it('should throw error for invalid parameters', async () => {
      await expect(manager.createConfig(0, {})).rejects.toThrow();
    });
  });

  describe('loadConfig', () => {
    it('should return null for non-existent config', async () => {
      const config = await manager.loadConfig(999);
      expect(config).toBeNull();
    });

    it('should load existing config correctly', async () => {
      // 先创建
      await manager.createConfig(5, { title: '测试' });

      // 再加载
      const config = await manager.loadConfig(5);
      expect(config).not.toBeNull();
      expect(config!.chapter).toBe(5);
    });
  });

  // 更多测试...
});
```

### 5.2 集成测试

**测试场景**:

1. **完整工作流测试**:
   ```
   创建配置 → 加载配置 → 验证配置 → 更新配置 → 删除配置
   ```

2. **预设应用测试**:
   ```
   列出预设 → 选择预设 → 创建配置 → 验证预设参数生效
   ```

3. **CLI命令测试**:
   ```
   执行各个CLI命令 → 验证输出 → 检查文件变化
   ```

4. **与write.md集成测试**:
   ```
   创建配置 → 执行/write命令 → 验证AI加载了配置 → 检查生成内容
   ```

### 5.3 端到端测试

**测试场景**:

1. **新用户首次使用**:
   ```
   1. 安装story-spec-cn
   2. storyspec init my-story
   3. storyspec chapter-config create 1 --interactive
   4. 在AI编辑器执行 /write 第1章
   5. 验证生成的章节内容符合配置
   ```

2. **使用预设快速创建**:
   ```
   1. storyspec preset list
   2. storyspec chapter-config create 5 --preset action-intense
   3. /write 第5章
   4. 验证快节奏动作场景
   ```

3. **配置复用**:
   ```
   1. storyspec chapter-config copy 5 10
   2. 修改差异部分
   3. /write 第10章
   4. 验证保持了风格一致性
   ```

---

## 六、性能优化

### 6.1 配置文件缓存

```typescript
/**
 * 配置缓存管理器
 */
export class ConfigCache {
  private cache: Map<number, {
    config: ChapterConfig;
    mtime: number;
  }> = new Map();

  async get(chapter: number, filePath: string): Promise<ChapterConfig | null> {
    const stats = await fs.stat(filePath);
    const cached = this.cache.get(chapter);

    if (cached && cached.mtime === stats.mtimeMs) {
      return cached.config;
    }

    return null;
  }

  set(chapter: number, config: ChapterConfig, mtime: number): void {
    this.cache.set(chapter, { config, mtime });
  }

  clear(chapter?: number): void {
    if (chapter) {
      this.cache.delete(chapter);
    } else {
      this.cache.clear();
    }
  }
}
```

### 6.2 预设预加载

```typescript
/**
 * 预设预加载器
 * 应用启动时预加载所有官方预设
 */
export class PresetPreloader {
  private preloadedPresets: Map<string, Preset> = new Map();

  async preload(): Promise<void> {
    const presetDir = path.join(__dirname, '..', '..', 'presets');
    const files = await glob(path.join(presetDir, '**', '*.yaml'));

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const preset = yaml.load(content) as Preset;
      this.preloadedPresets.set(preset.id, preset);
    }
  }

  get(presetId: string): Preset | undefined {
    return this.preloadedPresets.get(presetId);
  }
}
```

### 6.3 YAML解析优化

```typescript
/**
 * 使用更快的YAML解析器
 */
import { parse } from 'yaml'; // 使用yaml库替代js-yaml

export async function loadYamlFast(filePath: string): Promise<any> {
  const content = await fs.readFile(filePath, 'utf-8');
  return parse(content);
}
```

---

## 七、安全性考虑

### 7.1 输入验证

```typescript
/**
 * 输入清洗和验证
 */
export class InputSanitizer {
  /**
   * 清洗章节号
   */
  sanitizeChapterNumber(input: any): number {
    const num = parseInt(String(input));
    if (isNaN(num) || num < 1 || num > 9999) {
      throw new Error('章节号必须在1-9999之间');
    }
    return num;
  }

  /**
   * 清洗文件路径
   */
  sanitizeFilePath(input: string): string {
    // 防止路径遍历攻击
    const normalized = path.normalize(input);
    if (normalized.includes('..')) {
      throw new Error('非法路径');
    }
    return normalized;
  }

  /**
   * 清洗YAML内容
   */
  sanitizeYamlContent(content: string): string {
    // 移除潜在的代码注入
    if (content.includes('!<tag:')) {
      throw new Error('不支持YAML标签');
    }
    return content;
  }
}
```

### 7.2 权限控制

```typescript
/**
 * 文件操作权限检查
 */
export class PermissionChecker {
  /**
   * 检查文件是否在项目范围内
   */
  isWithinProject(filePath: string, projectPath: string): boolean {
    const resolved = path.resolve(filePath);
    const project = path.resolve(projectPath);
    return resolved.startsWith(project);
  }

  /**
   * 检查文件是否可写
   */
  async isWritable(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }
}
```

---

## 八、错误处理

### 8.1 错误类型定义

```typescript
/**
 * 自定义错误类
 */
export class ConfigError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class ValidationError extends ConfigError {
  constructor(message: string, public errors: string[]) {
    super(message, 'VALIDATION_ERROR', { errors });
    this.name = 'ValidationError';
  }
}

export class PresetNotFoundError extends ConfigError {
  constructor(presetId: string) {
    super(`预设未找到: ${presetId}`, 'PRESET_NOT_FOUND', { presetId });
    this.name = 'PresetNotFoundError';
  }
}
```

### 8.2 错误处理策略

```typescript
/**
 * 全局错误处理器
 */
export class ErrorHandler {
  handle(error: Error): void {
    if (error instanceof ValidationError) {
      console.error(chalk.red(`验证失败:`));
      error.errors.forEach((err, index) => {
        console.error(chalk.red(`  ${index + 1}. ${err}`));
      });
    } else if (error instanceof PresetNotFoundError) {
      console.error(chalk.red(`预设不存在: ${error.details.presetId}`));
      console.log(chalk.gray('\n提示: 使用 storyspec preset list 查看可用预设'));
    } else if (error instanceof ConfigError) {
      console.error(chalk.red(`配置错误: ${error.message}`));
      if (error.details) {
        console.error(chalk.gray(JSON.stringify(error.details, null, 2)));
      }
    } else {
      console.error(chalk.red(`未知错误: ${error.message}`));
      console.error(error.stack);
    }

    process.exit(1);
  }
}
```

---

## 九、部署和发布

### 9.1 构建流程

```bash
# package.json scripts

{
  "scripts": {
    "build": "tsc",
    "build:presets": "bash scripts/bundle-presets.sh",
    "build:all": "npm run build && npm run build:presets",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  }
}
```

### 9.2 发布检查清单

- [ ] 单元测试通过（覆盖率 > 80%）
- [ ] 集成测试通过
- [ ] 端到端测试通过
- [ ] 代码lint通过
- [ ] 文档完整
- [ ] CHANGELOG更新
- [ ] 版本号更新
- [ ] 预设文件打包

### 9.3 版本兼容性

```typescript
/**
 * 配置文件版本管理
 */
export const CONFIG_VERSION = '1.0.0';

export function migrateConfig(config: any): ChapterConfig {
  // 从旧版本迁移到当前版本
  if (!config.version || config.version < '1.0.0') {
    // 执行迁移逻辑
    config = migrateFrom_0_x(config);
  }

  config.version = CONFIG_VERSION;
  return config as ChapterConfig;
}
```

---

## 十、监控和调试

### 10.1 日志系统

```typescript
/**
 * 结构化日志
 */
export class Logger {
  private level: 'debug' | 'info' | 'warn' | 'error';

  constructor(level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.level = level;
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      console.log(chalk.gray(`[DEBUG] ${message}`), meta || '');
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      console.log(chalk.cyan(`[INFO] ${message}`), meta || '');
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      console.log(chalk.yellow(`[WARN] ${message}`), meta || '');
    }
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog('error')) {
      console.error(chalk.red(`[ERROR] ${message}`), meta || '');
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}
```

### 10.2 性能监控

```typescript
/**
 * 性能计时器
 */
export class PerformanceTimer {
  private timers: Map<string, number> = new Map();

  start(name: string): void {
    this.timers.set(name, Date.now());
  }

  end(name: string): number {
    const start = this.timers.get(name);
    if (!start) {
      throw new Error(`Timer ${name} not started`);
    }

    const duration = Date.now() - start;
    this.timers.delete(name);
    return duration;
  }

  measure(name: string, fn: () => Promise<any>): Promise<any> {
    this.start(name);
    return fn().finally(() => {
      const duration = this.end(name);
      console.log(chalk.gray(`⏱️  ${name}: ${duration}ms`));
    });
  }
}
```

---

## 附录

### A. 完整的TypeScript类型导出

```typescript
// src/types/index.ts

export * from './chapter-config';
export * from './preset';
export * from './validation';
export * from './errors';
```

### B. CLI命令完整列表

见第三章节内容。

### C. 测试覆盖率报告

```bash
$ npm run test:coverage

----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   85.23 |    78.45 |   89.12 |   84.67 |
 chapter-config.ts    |   88.45 |    82.30 |   91.20 |   87.90 |
 preset-manager.ts    |   82.10 |    75.60 |   87.50 |   81.45 |
 config-validator.ts  |   86.70 |    79.20 |   88.90 |   85.30 |
----------------------|---------|----------|---------|---------|
```

---

**END OF TECH SPEC**
