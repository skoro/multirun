import { ChildProcess, spawn, SpawnOptions } from "child_process";
import { parseTimeout } from "./utils";
import type { ProcessConfig, ProcessEntries as ProcessEntriesConfig } from "./config"
import { Logger } from "winston";
import fs from "node:fs";
import { pipeline } from "stream/promises";

type ProcessEntry = {
  procName: string;
  config: ProcessConfig;
  proc?: ChildProcess | null;
  failedRestarts: number;
}

const processTable: ProcessEntry[] = [];

const defaultMaxFailedRestarts = 3;

function spawnProcesses(processesConfig: ProcessEntriesConfig, logger: Logger): void {
  logger.debug('Spawn procecesses');

  for (const procName of Object.keys(processesConfig)) {
    const procConfig = processesConfig[procName];

    const procEntry: ProcessEntry = {
      procName,
      config: procConfig,
      failedRestarts: 0,
    };

    processTable.push(procEntry);

    startProcess(procEntry, logger);
  }
}

function startProcess(procEntry: ProcessEntry, logger: Logger): ChildProcess {
  const config = procEntry.config;

  logger.debug(config);

  if (!isValidCommand(config?.command)) {
    throw new Error('Process command must be a non empty string.');
  }

  const command = config.command!;
  const args = config.args ?? [];
  const options = getSpawnOptions(config);
  const procName = procEntry.procName;

  const proc = spawn(command, args, options);

  procEntry.proc = proc;

  proc.on('spawn', () => {
    logger.info(`"${procName}" started, pid: ${proc.pid}`);
    procEntry.failedRestarts = 0;
  });

  proc.on('error', (err) => {
    logger.error(`"${procName}": ${err}`);
    procEntry.failedRestarts++;
  });

  proc.on('close', (code: number) => closeOrRestartProcess(procEntry, code, logger));

  if (config.output) {
    setupProcessOutput(config.output, proc);
    if (!proc.stdout) {
      logger.warn(`"${procName}" stdout is undefined`);
    }
    if (!proc.stderr) {
      logger.warn(`"${procName}" stderr is undefined`)
    }
  }

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

  if (config.cwd) {
    options.cwd = config.cwd;
  }

  return options;
}

function closeOrRestartProcess(procEntry: ProcessEntry, code: number, logger: Logger): void {
  const procName = procEntry.procName;

  logger.warn(`"${procName}" exit, code: ${code}`);


  const maxFailedRestarts = procEntry.config.max_failed_restarts ?? defaultMaxFailedRestarts;
  if (procEntry.failedRestarts >= maxFailedRestarts) {
    logger.warn(`"${procName}" reached max failed restarts: ${maxFailedRestarts}`);
    return;
  }

  procEntry.proc = null;

  const shouldRestart = procEntry.config.restart || procEntry.failedRestarts > 0;

  if (shouldRestart) {
    logger.info(`"${procName}" restart attempt: ${procEntry.failedRestarts}`);
    startProcess(procEntry, logger);
  }
}

function setupProcessOutput(file: string, proc: ChildProcess): void {
  if (file === 'console') {
    proc.stdout?.on('data', (data) => console.log(`${data}`));
    proc.stderr?.on('data', (data) => console.error(`${data}`));
    return;
  }

  const stream = fs.createWriteStream(file, { flags: 'a' });
  if (proc.stdout) {
    pipeline(proc.stdout!, stream);
  }
  if (proc.stderr) {
    pipeline(proc.stderr!, stream);
  }
}

export { spawnProcesses, startProcess }
