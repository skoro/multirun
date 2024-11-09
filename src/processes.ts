import { ChildProcess, spawn, SpawnOptions } from "node:child_process";
import { parseTimeout } from "./utils";
import type { ProcessConfig, ProcessEntries as ProcessEntriesConfig } from "./config"
import { Logger } from "winston";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";

type ProcessEntry = {
  procName: string;
  config: ProcessConfig;
  proc?: ChildProcess | null;
  failedRestarts: number;
}

type OptionalLogger = Logger | Console | null;

const processTable: ProcessEntry[] = [];

const defaultMaxFailedRestarts = 3;

function spawnProcesses(processesConfig: ProcessEntriesConfig, logger: OptionalLogger = null): void {
  logger?.debug('Spawn procecesses');

  for (const procName of Object.keys(processesConfig)) {
    const procConfig = processesConfig[procName];

    const procEntry: ProcessEntry = {
      procName,
      config: procConfig,
      failedRestarts: 0,
    };

    processTable.push(procEntry);

    startProcessTimeout(procEntry, logger);
  }
}

function startProcessTimeout(procEntry: ProcessEntry, logger: OptionalLogger = null): void {
  if (procEntry.config.start_delay) {
    const msDelay = parseTimeout(procEntry.config.start_delay);
    logger?.debug(`"${procEntry.procName}" start delay: ${msDelay} ms`);
    setTimeout(() => startProcess(procEntry, logger), msDelay);
  } else {
    startProcess(procEntry, logger);
  }
}

function startProcess(procEntry: ProcessEntry, logger: OptionalLogger = null): ChildProcess {
  const config = procEntry.config;

  if (!isValidCommand(config?.command)) {
    throw new Error('Process command must be a non empty string.');
  }

  const command = config.command!;
  const args = config.args ?? [];
  const options = getSpawnOptions(config);
  const procName = procEntry.procName;

  logger?.debug({ command, args, options });

  const proc = spawn(command, args, options);

  procEntry.proc = proc;

  proc.on('spawn', () => {
    logger?.info(`"${procName}" started, pid: ${proc.pid}`);
    procEntry.failedRestarts = 0;
  });

  proc.on('error', (err) => {
    logger?.error(`"${procName}": ${err}`);
    procEntry.failedRestarts++;
  });

  proc.on('close', (code: number) => closeOrRestartProcess(procEntry, code, logger));

  if (config.output) {
    setupProcessOutput(procName, config.output, proc);
    if (!proc.stdout) {
      logger?.warn(`"${procName}" stdout is undefined`);
    }
    if (!proc.stderr) {
      logger?.warn(`"${procName}" stderr is undefined`)
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

  if (isNeededShell(config.command!)) {
    options.shell = true;
  }

  if (config.env) {
    options.env = config.env;
  }

  return options;
}

function closeOrRestartProcess(procEntry: ProcessEntry, code: number, logger: OptionalLogger): void {
  const procName = procEntry.procName;

  logger?.warn(`"${procName}" exit, code: ${code}`);


  const maxFailedRestarts = procEntry.config.max_failed_restarts ?? defaultMaxFailedRestarts;
  if (procEntry.failedRestarts >= maxFailedRestarts) {
    logger?.warn(`"${procName}" reached max failed restarts: ${maxFailedRestarts}`);
    return;
  }

  procEntry.proc = null;

  const shouldRestart = procEntry.config.restart || procEntry.failedRestarts > 0;

  if (shouldRestart) {
    logger?.info(`"${procName}" restart attempt: ${procEntry.failedRestarts}`);
    startProcessTimeout(procEntry, logger);
  }
}

function setupProcessOutput(procName: string, file: string, proc: ChildProcess): void {
  if (file === 'console') {
    const output = (prefix: string, data: string, callback: (data: string) => any) => {
      String(data)
        .split('\n')
        .forEach(
          (line) => callback(prefix + ' >>> ' + line.trimEnd())
        );
    }
    proc.stdout?.on('data', (data) => output(procName, data, console.log));
    proc.stderr?.on('data', (data) => output(procName, data, console.error));
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

function isNeededShell(command: string): boolean {
  const cmd = command.toLocaleLowerCase();
  return cmd.endsWith('.bat') || cmd.endsWith('.cmd');
}

export { spawnProcesses, startProcess, startProcessTimeout };
