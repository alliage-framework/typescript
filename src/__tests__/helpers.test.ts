import path from 'path';
import fs, { NoParamCallback, PathLike } from 'fs';
import { getBinaryPath } from '../helpers';

jest.mock('fs', () => ({
  ...(jest.requireActual('fs') as object),
  access: jest.fn(),
}));

describe('helpers', () => {
  describe('#getBinaryPath', () => {
    const accessMock = (fs.access as unknown) as jest.Mock;
    const originalPlatform = process.platform;

    beforeEach(() => {
      // Reset platform to the original value before each test
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should return the absolute bin path if it exists on Unix', async () => {
      accessMock.mockImplementationOnce(((
        binPath: PathLike,
        mode: number | undefined,
        callback: NoParamCallback,
      ) => {
        expect(binPath).toEqual(path.resolve('./node_modules/.bin/test-bin'));
        expect(mode).toEqual(fs.constants.F_OK);
        callback(null);
      }) as any);

      const binPath = await getBinaryPath('test-bin');

      expect(binPath).toEqual(path.resolve('./node_modules/.bin/test-bin'));
      expect(accessMock).toHaveBeenCalledTimes(1);
    });

    it('should try different extensions on Windows and return the first match', async () => {
      // Mock platform as Windows
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      // Mock the base path to fail
      accessMock.mockImplementationOnce(((
        _binPath: PathLike,
        _mode: number | undefined,
        callback: NoParamCallback,
      ) => {
        callback(new Error('not found'));
      }) as any);

      // Mock .exe to succeed and others to fail
      const mockCallback = (
        binPath: PathLike,
        mode: number | undefined,
        callback: NoParamCallback,
      ) => {
        if (binPath.toString().endsWith('.exe')) {
          expect(binPath).toEqual(path.resolve('./node_modules/.bin/test-bin.exe'));
          expect(mode).toEqual(fs.constants.F_OK);
          callback(null);
        } else {
          callback(new Error('not found'));
        }
      };

      // Add mocks for all extensions
      accessMock.mockImplementationOnce(mockCallback as any); // .exe
      accessMock.mockImplementationOnce(mockCallback as any); // .cmd
      accessMock.mockImplementationOnce(mockCallback as any); // .bat

      const binPath = await getBinaryPath('test-bin');

      expect(binPath).toEqual(path.resolve('./node_modules/.bin/test-bin.exe'));
      expect(accessMock).toHaveBeenCalledTimes(4); // Updated: base path + all 3 extensions
    });

    it('should try all extensions on Windows before failing', async () => {
      // Mock platform as Windows
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      // Mock all attempts to fail
      accessMock.mockImplementation(((
        _binPath: PathLike,
        _mode: number | undefined,
        callback: NoParamCallback,
      ) => {
        callback(new Error('not found'));
      }) as any);

      let error;
      try {
        await getBinaryPath('test-bin');
      } catch (e) {
        error = e;
      }

      expect(accessMock).toHaveBeenCalledTimes(4); // base + 3 extensions
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toEqual(
        'Can\'t access "test-bin" binary. Please check it has been properly installed',
      );
    });

    it('should throw an error if the bin does not exist on Unix', async () => {
      accessMock.mockImplementationOnce(((
        binPath: PathLike,
        mode: number | undefined,
        callback: NoParamCallback,
      ) => {
        expect(binPath).toEqual(path.resolve('./node_modules/.bin/test-bin'));
        expect(mode).toEqual(fs.constants.F_OK);
        callback(new Error('test_error'));
      }) as any);

      let error;
      try {
        await getBinaryPath('test-bin');
      } catch (e) {
        error = e;
      }

      expect(accessMock).toHaveBeenCalledTimes(1);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toEqual(
        'Can\'t access "test-bin" binary. Please check it has been properly installed',
      );
    });
  });
});
