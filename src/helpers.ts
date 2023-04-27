import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const accessAsync = promisify(fs.access);

export async function getBinaryPath(bin: string) {
  const binPath = path.resolve(`./node_modules/.bin/${bin}`);
  try {
    await accessAsync(binPath, fs.constants.F_OK);
  } catch (e) {
    throw new Error(`Can't access "${bin}" binary. Please check it has been properly installed`);
  }
  return binPath;
}
