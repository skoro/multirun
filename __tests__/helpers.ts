import path from 'node:path';

export function getAssetPath(assetName: string): string {
  return path.join(__dirname, '..', '__tests__', 'assets', assetName);
}
