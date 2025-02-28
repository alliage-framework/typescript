import path from 'path';
import fs, { NoParamCallback, PathLike } from 'fs';
import { getBinaryPath } from '../helpers';

jest.mock('fs', () => ({
  ...(jest.requireActual('fs') as Record<string, unknown>),
  access: jest.fn(),
}));

describe('helpers', () => {
  describe('#getBinaryPath', () => {
    const accessMock = fs.access as unknown as jest.MockedFunction<
      (filePath: PathLike, mode: number | undefined, callback: NoParamCallback) => void
    >;
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
      accessMock.mockImplementation(
        (filePath: PathLike, _mode: number | undefined, callback: NoParamCallback) => {
          expect(filePath).toEqual(path.resolve('./node_modules/.bin/test-bin'));
          callback(null);
        },
      );

      const binPath = await getBinaryPath('test-bin');

      expect(binPath).toEqual(path.resolve('./node_modules/.bin/test-bin'));
      expect(accessMock).toHaveBeenCalledTimes(1);
    });

    it('should try different extensions on Windows and return the first match', async () => {
      // Mock platform as Windows
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      // Mock .exe to succeed and others to fail
      const mockCallback = (
        filePath: PathLike,
        _mode: number | undefined,
        callback: NoParamCallback,
      ) => {
        if (filePath.toString().endsWith('.exe')) {
          expect(filePath).toEqual(path.resolve('./node_modules/.bin/test-bin.exe'));
          callback(null);
        } else {
          callback(new Error('not found'));
        }
      };

      // Add mocks for all extensions
      accessMock.mockImplementationOnce(mockCallback); // .exe
      accessMock.mockImplementationOnce(mockCallback); // .cmd
      accessMock.mockImplementationOnce(mockCallback); // .bat

      const binPath = await getBinaryPath('test-bin');

      expect(binPath).toEqual(path.resolve('./node_modules/.bin/test-bin.exe'));
      expect(accessMock).toHaveBeenCalledTimes(3); // all 3 extensions
    });

    it('should try all extensions on Windows before failing', async () => {
      // Mock platform as Windows
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });

      // Mock all attempts to fail
      accessMock.mockImplementation(
        (_filePath: PathLike, _mode: number | undefined, callback: NoParamCallback) => {
          callback(new Error('not found'));
        },
      );

      let error: Error | undefined;
      try {
        await getBinaryPath('test-bin');
      } catch (e) {
        error = e as Error;
      }

      expect(accessMock).toHaveBeenCalledTimes(3); // 3 extensions
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toEqual(
        'Can\'t access "test-bin" binary. Please check it has been properly installed',
      );
    });

    it('should throw an error if the bin does not exist on Unix', async () => {
      accessMock.mockImplementation(
        (filePath: PathLike, _mode: number | undefined, callback: NoParamCallback) => {
          expect(filePath).toEqual(path.resolve('./node_modules/.bin/test-bin'));
          callback(new Error('test_error'));
        },
      );

      let error: Error | undefined;
      try {
        await getBinaryPath('test-bin');
      } catch (e) {
        error = e as Error;
      }

      expect(accessMock).toHaveBeenCalledTimes(1);
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toEqual(
        'Can\'t access "test-bin" binary. Please check it has been properly installed',
      );
    });
  });
});
