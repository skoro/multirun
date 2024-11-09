import { getSpawnOptions } from "../src/processes";
import { ProcessConfig } from "./config";

let config: ProcessConfig;

beforeEach(() => {
  config = {
    command: 'not-exist-command'
  } as ProcessConfig;
});

test('timeout spawn option is converted to milliseconds', () => {
  config.timeout = '3s';
  expect(getSpawnOptions(config).timeout).toBe(3000);
});

test('set user identity', () => {
  config.uid = 1001;
  expect(getSpawnOptions(config).uid).toBe(1001);
});

test('set user group identity', () => {
  config.gid = 1001;
  expect(getSpawnOptions(config).gid).toBe(1001);
});

test('no shell option by default', () => {
  config.command = 'run-me.exe';
  expect(getSpawnOptions(config).shell).toBeUndefined();
});

test('add shell for .bat command', () => {
  config.command = 'run-me.bat';
  expect(getSpawnOptions(config).shell).toBeTruthy();
});

test('add shell for .cmd command', () => {
  config.command = 'run-me.cmd';
  expect(getSpawnOptions(config).shell).toBeTruthy();
});
