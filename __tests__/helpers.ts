import path from 'node:path';
import child_process from 'node:child_process';
import EventEmitter from 'node:events';
import { Readable } from 'node:stream';

export function getAssetPath(assetName: string): string {
  return path.join(__dirname, '..', '__tests__', 'assets', assetName);
}

export function createChildProcessMock(): child_process.ChildProcess {
  const proc = new EventEmitter() as child_process.ChildProcess;

  proc.stdout = new EventEmitter() as Readable;
  proc.stderr = new EventEmitter() as Readable;

  return proc;
}
