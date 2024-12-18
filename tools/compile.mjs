// Compile to single executable application.
import { promisify } from 'node:util';
import child_process from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import pkg from '../package.json' assert { type: 'json' };

const exec = promisify(child_process.exec);

const rootDir = path.join(import.meta.dirname, '..');
const distDir = path.join(rootDir, 'dist');
const toolsDir = path.join(rootDir, 'tools');
const resourcesDir = path.join(rootDir, 'resources');

/**
 * @param {string} command
 * @param {ExecOptions} options=undefined
 * @returns {void}
 */
async function execCommand(command, options) {
  console.log(`exec: ${command}`);
  const { stdout, stderr } = await exec(command, options);
  console.log(stdout);
  console.error(stderr);
}

/**
 * @param {string} message
 * @returns {void}
 */
function logStep(message) {
  console.log(`>>> ${message}`);
}

/**
 * @param {string} destBin
 * @returns {void}
 */
async function copyNodeBin(destBin) {
  logStep('Copy node executable');
  await fs.copyFile(process.execPath, path.join(distDir, destBin));
}

try {
  console.log(`platform: ${process.platform}`);
  console.log(`dist dir: ${distDir}`);
  console.log('=========================================================\n');

  await execCommand('npm run build', { cwd: rootDir });
  await execCommand('npm run bundle', { cwd: rootDir });
  await execCommand('node --experimental-sea-config ../sea-config.json', { cwd: distDir });

  let binName = `${pkg.name}-${process.platform}-${process.arch}`;
  let postjectCmd = 'postject';

  switch (process.platform) {
    case 'win32':
      binName += '.exe';
      postjectCmd = 'postject.cmd';
      await copyNodeBin(binName);
      logStep('Remove signature');
      await execCommand([
        path.join(toolsDir, 'signtool.exe'), 'remove', '/s', path.join(distDir, binName),
      ].join(' '));
      logStep('Update .exe details');
      await execCommand([
        path.join(toolsDir, 'rcedit-x64.exe'), path.join(distDir, binName),
        '--set-product-version', pkg.version,
        '--set-file-version', pkg.version,
        '--set-icon', path.join(resourcesDir, 'app.ico'),
        '--set-version-string', 'FileDescription', `"${pkg.description}"`,
        '--set-version-string', 'ProductName', `"${pkg.name}"`,
        '--set-version-string', 'CompanyName', `"${pkg.author.name}"`,
        '--set-version-string', 'LegalCopyright', `"${pkg.license}"`,
        '--set-version-string', 'OriginalFilename', binName,
      ].join(' '));
      break;
    case 'linux':
      await copyNodeBin(binName);
      break;
    default:
      throw new Error(`cannot build application for platform: ${process.platform}`);
  }

  logStep(`Build executable`);
  await execCommand([
    path.join(rootDir, 'node_modules', '.bin', postjectCmd),
    binName,
    'NODE_SEA_BLOB',
    'sea-prep.blob',
    '--sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
  ].join(' '), { cwd: distDir });

  logStep('Done !');
  console.log(`binary: ${path.join(distDir, binName)}`);
} catch (e) {
  console.error(e);
}
