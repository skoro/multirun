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

function spawnProcesses(processesConfig: ProcessEntriesConfig, logger: Logger): void {
  logger.debug('Spawn procecesses');

  processTable = {};

  for (const procName of Object.keys(processesConfig)) {
    const procConfig = processesConfig[procName];

    startProcess(procName, procConfig, logger);
  }
}

function startProcess(procName: string, procConfig: ProcessConfig, logger: Logger): ChildProcess {
  logger.debug(procConfig);

  if (!isValidCommand(procConfig?.command)) {
    throw new Error('Process command must be a non empty string.');
  }

  const command = procConfig.command!;
  const args = procConfig.args ?? [];
  const options = getSpawnOptions(procConfig);

  const proc = spawn(command, args, options);

  proc.on('spawn', () => {
    addProcessEntry(procName, procConfig, proc);
    logger.info(`"${procName}" started, pid: ${proc.pid}`);
  });

  proc.on('error', (err) => {
    logger.error(`"${procName}": ${err}`);
  });

  proc.on('close', (code: number) => closeOrRestartProcess(procName, code, proc.pid!, logger));

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

function addProcessEntry(procName: string, procConfig: ProcessConfig, proc: ChildProcess): void {
  if (!processTable[procName]) {
    processTable[procName] = {}
  }

  if (proc.pid) {
    processTable[procName][proc.pid] = {
      config: procConfig,
      proc,
    }
  }
}

function deleteProcessEntryByPid(procName: string, pid: number): boolean {
  if (hasProcessEntry(procName, pid)) {
    delete processTable[procName][pid];
    return true;
  }

  return false;
}

function getProcessEntryByPid(procName: string, pid: number): ProcessEntry | null {
  if (hasProcessEntry(procName, pid)) {
    return processTable[procName][pid];
  }

  return null;
}

function hasProcessEntry(procName: string, pid: number): boolean {
  return processTable[procName]
    && (pid.toString() in processTable[procName]);
}

function hasMoreProcesses(): boolean {
  return Object.keys(processTable).length > 0;
}

function closeOrRestartProcess(procName: string, code: number, pid: number, logger: Logger): void {
  logger.warn(`"${procName}" exit, code: ${code}`);

  const procEntry = getProcessEntryByPid(procName, pid);

  if (!deleteProcessEntryByPid(procName, pid)) {
    logger.debug(`deleteProcessEntry("${procName}", ${pid}) failed`);
  }

  if (procEntry?.config.restart) {
    logger.info(`"${procName}" restart`);
    startProcess(procName, procEntry.config, logger);
  }
}

export { spawnProcesses, startProcess }
