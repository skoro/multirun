// Compile to single executable application.
import { promisify } from 'node:util';
import child_process from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import pkg from '../package.json' assert { type: 'json' };

const exec = promisify(child_process.exec);

const rootDir = path.join(import.meta.dirname, '..');
const distDir = path.join(rootDir, 'dist');

/**
 * @param {string} command
 * @returns {void}
 */
async function execCommand(command, options) {
  console.log(`exec: ${command}`);
  const { stdout, stderr } = await exec(command, options);
  console.log(stdout);
  console.error(stderr);
}

/**
 * @param {string} command
 * @returns {void}
 */
function logStep(message) {
  console.log(`>>> ${message}`);
}

try {
  console.log(`platform: ${process.platform}`);
  console.log(`dist dir: ${distDir}`);
  console.log('=========================================================\n');
  await execCommand('npm run bundle', { cwd: rootDir });
  await execCommand('node --experimental-sea-config ../sea-config.json', { cwd: distDir });
  switch (process.platform) {
    case 'win32':
      const binName = `${pkg.name}.exe`;
      logStep('Copy node executable');
      await fs.copyFile(process.execPath, path.join(distDir, binName));
      logStep('Remove signature');
      await execCommand(`${path.join(rootDir, 'tools', 'signtool.exe')} remove /s ${path.join(distDir, binName)}`);
      logStep(`Build executable`);
      await execCommand([
        path.join(rootDir, 'node_modules', '.bin', 'postject.cmd'),
        binName,
        'NODE_SEA_BLOB',
        'sea-prep.blob',
        '--sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
      ].join(' '), { cwd: distDir });
      logStep('Done !');
      console.log(`binary: ${path.join(distDir, binName)}`);
      break;
    case 'linux':
      break;
    default:
      throw new Error(`cannot build application for platform: ${process.platform}`);
  }
} catch (e) {
  console.error(e);
}