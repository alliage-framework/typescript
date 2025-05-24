import * as cp from 'child_process';
import type { SpawnSyncReturns } from 'child_process';

import { Arguments, PrimitiveContainer } from '@alliage/framework';
import { ServiceContainer, service } from '@alliage/di';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { MockedFunction } from 'vitest';

import TypeScriptModule from '..';
import { getBinaryPath } from '../helpers';
import { TypeScriptTask } from '../tasks/typescript-task';

vi.mock('../helpers');
vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof cp>();
  return {
    ...actual,
    spawnSync: vi.fn(),
  };
});

describe('typescript-module', () => {
  describe('TypeScriptModule', () => {
    const module = new TypeScriptModule();

    describe('#getKernelEventHandlers', () => {
      it('should listen to the "init" kernel event', () => {
        expect(module.getKernelEventHandlers()).toEqual({
          init: module.onInit,
        });
      });
    });

    describe('#onInit', () => {
      const primitiveContainer = new PrimitiveContainer({});
      const serviceContainer = new ServiceContainer();

      primitiveContainer.set('service_container', serviceContainer);

      const exitSpy = vi.spyOn(process, 'exit');
      const spawnMock = cp.spawnSync as unknown as MockedFunction<typeof cp.spawnSync>;
      const registerServiceSpy = vi.spyOn(serviceContainer, 'registerService');
      const getBinaryPathMock = getBinaryPath as MockedFunction<typeof getBinaryPath>;

      process.argv[1] = '/path/to/alliage-script';

      beforeEach(() => {
        exitSpy.mockImplementation(() => undefined as never);
        spawnMock.mockReturnValue({ error: undefined } as SpawnSyncReturns<Buffer>);
        registerServiceSpy.mockImplementation(() => undefined as never);
        getBinaryPathMock.mockResolvedValue('/path/to/ts-runtime');
      });

      afterEach(() => {
        vi.resetAllMocks();
      });

      it('should run the current script through TypeScript if the --use-typescript option is used', async () => {
        const args = Arguments.create({ script: 'run' }, [
          'test-arg',
          'other-arg',
          '--use-typescript',
        ]);
        await module.onInit(args, 'test', primitiveContainer);

        expect(spawnMock).toHaveBeenCalledWith(
          '/path/to/ts-runtime',
          [
            '--tsconfig=tsconfig.json',
            '/path/to/alliage-script',
            'run',
            'test-arg',
            'other-arg',
            '--env=test',
          ],
          expect.objectContaining({
            env: expect.objectContaining({
              ALLIAGE_TS_SERVICES_BASEPATH: 'src',
            }),
          }),
        );
        expect(process.exit).toHaveBeenCalledWith(0);
      });

      it('should work correctly if no argument is provided', async () => {
        const args = Arguments.create({ script: 'run' }, ['--use-typescript']);
        await module.onInit(args, 'test', primitiveContainer);

        expect(spawnMock).toHaveBeenCalledWith(
          '/path/to/ts-runtime',
          ['--tsconfig=tsconfig.json', '/path/to/alliage-script', 'run', '--env=test'],
          expect.objectContaining({
            env: expect.objectContaining({
              ALLIAGE_TS_SERVICES_BASEPATH: 'src',
            }),
          }),
        );
        expect(process.exit).toHaveBeenCalledWith(0);
      });

      it('should allow to choose a custom services base path', async () => {
        const args = Arguments.create({ script: 'run' }, [
          '--use-typescript',
          '--ts-services-basepath=/path/to/services',
        ]);
        await module.onInit(args, 'test', primitiveContainer);

        expect(spawnMock).toHaveBeenCalledWith(
          '/path/to/ts-runtime',
          ['--tsconfig=tsconfig.json', '/path/to/alliage-script', 'run', '--env=test'],
          expect.objectContaining({
            env: expect.objectContaining({
              ALLIAGE_TS_SERVICES_BASEPATH: '/path/to/services',
            }),
          }),
        );
        expect(process.exit).toHaveBeenCalledWith(0);
      });

      it('should allow to choose a custom TypeScript project', async () => {
        const args = Arguments.create({ script: 'run' }, [
          '--use-typescript',
          '--ts-project=/path/to/tsconfig.json',
        ]);
        await module.onInit(args, 'test', primitiveContainer);

        expect(spawnMock).toHaveBeenCalledWith(
          '/path/to/ts-runtime',
          ['--tsconfig=/path/to/tsconfig.json', '/path/to/alliage-script', 'run', '--env=test'],
          expect.objectContaining({
            env: expect.objectContaining({
              ALLIAGE_TS_SERVICES_BASEPATH: 'src',
            }),
          }),
        );
        expect(process.exit).toHaveBeenCalledWith(0);
      });

      it('should exit with an error if the command failed', async () => {
        spawnMock.mockReturnValue({ error: new Error() } as SpawnSyncReturns<Buffer>);

        const args = Arguments.create({ script: 'run' }, ['--use-typescript']);
        await module.onInit(args, 'test', primitiveContainer);

        expect(spawnMock).toHaveBeenCalledWith(
          '/path/to/ts-runtime',
          ['--tsconfig=tsconfig.json', '/path/to/alliage-script', 'run', '--env=test'],
          expect.objectContaining({
            env: expect.objectContaining({
              ALLIAGE_TS_SERVICES_BASEPATH: 'src',
            }),
          }),
        );
        expect(process.exit).toHaveBeenCalledWith(1);
      });

      it('should just register the typescript_task service if the --use-typescript option is not used', async () => {
        const args = Arguments.create({ script: 'run' }, []);
        await module.onInit(args, 'test', primitiveContainer);

        expect(spawnMock).not.toHaveBeenCalled();
        expect(registerServiceSpy).toHaveBeenCalledWith('typescript_task', TypeScriptTask, [
          service('event_manager'),
        ]);
      });

      it('should use "tsx" by default', async () => {
        const args = Arguments.create({ script: 'run' }, ['--use-typescript']);
        await module.onInit(args, 'test', primitiveContainer);

        expect(getBinaryPathMock).toHaveBeenCalledWith('tsx');
        expect(spawnMock).toHaveBeenCalledWith(
          '/path/to/ts-runtime',
          ['--tsconfig=tsconfig.json', '/path/to/alliage-script', 'run', '--env=test'],
          expect.anything(),
        );
      });

      it('should use "tsx watch" when the --watch options is used', async () => {
        const args = Arguments.create({ script: 'run' }, ['--use-typescript', '--watch']);
        await module.onInit(args, 'test', primitiveContainer);

        expect(getBinaryPathMock).toHaveBeenCalledWith('tsx');
        expect(spawnMock).toHaveBeenCalledWith(
          '/path/to/ts-runtime',
          ['watch', '--tsconfig=tsconfig.json', '/path/to/alliage-script', 'run', '--env=test'],
          expect.anything(),
        );
      });
    });
  });
});
