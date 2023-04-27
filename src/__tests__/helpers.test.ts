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

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should return the absolute bin path if it exists', async () => {
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

    it('should throw an error if the bin does not exist', async () => {
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
