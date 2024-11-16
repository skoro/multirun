import { startProcess } from '../src/processes';
import { getAssetPath } from './helpers';

let testCommand: string;

switch (process.platform.toLowerCase()) {
  case 'win32':
    testCommand = 'test_env.bat';
    break;
  case 'linux':
    testCommand = 'test_env.sh';
    break;
  default:
    throw new Error(`test suite cannot be run under "${process.platform}"`);
}

test('test environment variables', (done) => {
  const procEntry = {
    procName: 'test',
    config: {
      command: getAssetPath(testCommand),
      env: {
        CUSTOM_VAR: 'some-value'
      },
    },
    failedRestarts: 0,
  };

  const childProc = startProcess(procEntry);
  let output = '';

  childProc.stdout?.on('data', (data) => output += String(data));
  childProc.on('close', () => {
    expect(output).toMatch(/CUSTOM_VAR=some-value/);
    done();
  });
  childProc.on('error', (err) => done(err));
});
