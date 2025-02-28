import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const accessAsync = promisify(fs.access);

export async function getBinaryPath(bin: string) {
  const binPath = path.resolve(`./node_modules/.bin/${bin}`);
  // Check for the base path first
  try {
    const exts = process.platform === 'win32' ? ['.exe', '.cmd', '.bat'] : [''];
    const existenceChecks = exts.map((ext) =>
      accessAsync(binPath + ext, fs.constants.F_OK).then(() => binPath + ext),
    );

    const validPath = await Promise.any(existenceChecks);
    return validPath;
  } catch {
    throw new Error(`Can't access "${bin}" binary. Please check it has been properly installed`);
  }
}
