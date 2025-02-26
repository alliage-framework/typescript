import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const accessAsync = promisify(fs.access);

export async function getBinaryPath(bin: string) {
  const binPath = path.resolve(`./node_modules/.bin/${bin}`);

  // Check for the base path first
  try {
    await accessAsync(binPath, fs.constants.F_OK);
    return binPath;
  } catch (error) {
    // On Windows, try common executable extensions
    if (process.platform === 'win32') {
      const exts = ['.exe', '.cmd', '.bat'];
      const existenceChecks = exts.map((ext) =>
        accessAsync(binPath + ext, fs.constants.F_OK).then(() => binPath + ext),
      );

      try {
        const validPath = await Promise.race(existenceChecks);
        return validPath;
      } catch (innerError) {
        // If no valid path is found, fall through to the error
      }
    }
    throw new Error(`Can't access "${bin}" binary. Please check it has been properly installed`);
  }
}
