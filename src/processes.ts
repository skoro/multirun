import { ChildProcess, spawn, SpawnOptions } from "child_process";
import { parseTimeout } from "./utils";
import type { ProcessConfig, ProcessEntries as ProcessEntriesConfig } from "./config"
import { Logger } from "winston";

type ProcessTable = {
  [name: string]: ProcessEntries;
}

type ProcessEntries = {
  [pid: number]: ProcessEntry;
}

type ProcessEntry = {
  config: ProcessConfig;
  proc: ChildProcess;
}

let processTable: ProcessTable = {}

function spawnProcesses(processesConfig: ProcessEntriesConfig, logger: Logger) {
  logger.debug('Spawn procecesses');

  processTable = {};

  for (const name of Object.keys(processesConfig)) {
    startProcess(name, processesConfig[name]);
  }

  if (! hasMoreProcesses()) {
    throw new Error('');
  }
}

function startProcess(name: string, config: ProcessConfig): ChildProcess {
  if (!isValidCommand(config?.command)) {
    throw new Error('Process command must be a non empty string.');
  }

  const command = config.command!;
  const args = config.args ?? [];
  const options = getSpawnOptions(config);

  const proc = spawn(command, args, options);

  addProcessEntry(name, config, proc);

  return proc;
}

function isValidCommand(command: any): boolean {
  return typeof command === 'string' && Boolean(command);
}

function getSpawnOptions(config: ProcessConfig): SpawnOptions {
  const options: SpawnOptions = {}

  if (config.timeout) {
    options.timeout = parseTimeout(config.timeout);
  }

  return options;
}

function addProcessEntry(name: string, config: ProcessConfig, proc: ChildProcess): void {
  if (!processTable[name]) {
    processTable[name] = {}
  }

  processTable[name][proc.pid!] = { config, proc }
}

function hasMoreProcesses(): boolean {
  return Object.keys(processTable).length > 0;
}

export { spawnProcesses, startProcess }
