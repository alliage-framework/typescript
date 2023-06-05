import cp, { SpawnSyncReturns } from 'child_process';

import { Arguments, PrimitiveContainer } from '@alliage/framework';
import { ServiceContainer, service } from '@alliage/di';

import TypeScriptModule from '..';
import { getBinaryPath } from '../helpers';
import { TypeScriptTask } from '../tasks/typescript-task';

jest.mock('../helpers');

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

      const exitSpy = jest.spyOn(process, 'exit');
      const spawnSpy = jest.spyOn(cp, 'spawnSync');
      const registerServiceSpy = jest.spyOn(serviceContainer, 'registerService');
      const getBinaryPathMock = getBinaryPath as jest.Mock;

      process.argv[1] = '/path/to/alliage-script';

      beforeEach(() => {
        exitSpy.mockImplementation((() => {}) as any);
        spawnSpy.mockReturnValue({ error: undefined } as SpawnSyncReturns<Buffer>);
        registerServiceSpy.mockImplementation((() => {}) as any);
        getBinaryPathMock.mockResolvedValue('/path/to/ts-node');
      });

      afterEach(() => {
        jest.resetAllMocks();
      });

      it('should run the current script through TypeScript if the --use-typescript option is used', async () => {
        const args = Arguments.create({ script: 'run' }, [
          'test-arg',
          'other-arg',
          '--use-typescript',
        ]);
        await module.onInit(args, 'test', primitiveContainer);

        expect(spawnSpy).toHaveBeenCalledWith(
          '/path/to/ts-node',
          [
            '--project=tsconfig.json',
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

        expect(spawnSpy).toHaveBeenCalledWith(
          '/path/to/ts-node',
          ['--project=tsconfig.json', '/path/to/alliage-script', 'run', '--env=test'],
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

        expect(spawnSpy).toHaveBeenCalledWith(
          '/path/to/ts-node',
          ['--project=tsconfig.json', '/path/to/alliage-script', 'run', '--env=test'],
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

        expect(spawnSpy).toHaveBeenCalledWith(
          '/path/to/ts-node',
          ['--project=/path/to/tsconfig.json', '/path/to/alliage-script', 'run', '--env=test'],
          expect.objectContaining({
            env: expect.objectContaining({
              ALLIAGE_TS_SERVICES_BASEPATH: 'src',
            }),
          }),
        );
        expect(process.exit).toHaveBeenCalledWith(0);
      });

      it('should exit with an error if the command failed', async () => {
        spawnSpy.mockReturnValue({ error: new Error() } as SpawnSyncReturns<Buffer>);

        const args = Arguments.create({ script: 'run' }, ['--use-typescript']);
        await module.onInit(args, 'test', primitiveContainer);

        expect(spawnSpy).toHaveBeenCalledWith(
          '/path/to/ts-node',
          ['--project=tsconfig.json', '/path/to/alliage-script', 'run', '--env=test'],
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

        expect(spawnSpy).not.toHaveBeenCalled();
        expect(registerServiceSpy).toHaveBeenCalledWith('typescript_task', TypeScriptTask, [
          service('event_manager'),
        ]);
      });
    });
  });
});
