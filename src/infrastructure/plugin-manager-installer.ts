import { PluginManager } from '../plugins/manager.js';
import type { PluginInstaller } from '../application/project-ports.js';

export const pluginManagerInstaller: PluginInstaller = {
  install: async (projectPath, pluginName, sourcePath) => {
    const pluginManager = new PluginManager(projectPath);
    await pluginManager.installPlugin(pluginName, sourcePath);
  }
};
