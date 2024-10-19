import fs from 'node:fs/promises';
import YAML from 'yaml';

type TimeoutConfig = string | number;

export type ProcessConfig = {
  cwd?: string,
  command?: string,
  args?: string[],
  restart?: boolean,
  timeout?: TimeoutConfig,
}

export type ProcessEntries = {
  [name: string]: ProcessConfig;
}

export type Config = {
  log_dir?: string;
  spawn?: ProcessEntries;
}

async function loadConfig(cfgFile: string): Promise<Config> {
  const data = await fs.readFile(cfgFile, 'utf8');
  return YAML.parse(data) as Config;
}

function hasSpawnConfig(config: Config): boolean {
  if (typeof config?.spawn !== 'object') {
    return false;
  }
  return Object.keys(config.spawn).length > 0;
}

export { loadConfig, hasSpawnConfig }