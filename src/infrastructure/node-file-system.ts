import fs from 'fs-extra';
import type { ProjectFileStat, ProjectFileSystem } from '../application/project-ports.js';

export const nodeFileSystem: ProjectFileSystem = {
  pathExists: filePath => fs.pathExists(filePath),
  ensureDir: dirPath => fs.ensureDir(dirPath),
  copy: (sourcePath, targetPath, options) => fs.copy(sourcePath, targetPath, options),
  readDir: dirPath => fs.readdir(dirPath),
  readFile: filePath => fs.readFile(filePath, 'utf-8'),
  writeFile: (filePath, content) => fs.writeFile(filePath, content),
  readJson: filePath => fs.readJson(filePath),
  writeJson: (filePath, data, options) => fs.writeJson(filePath, data, options),
  stat: async (filePath): Promise<ProjectFileStat> => fs.stat(filePath),
  chmod: (filePath, mode) => fs.chmod(filePath, mode)
};
