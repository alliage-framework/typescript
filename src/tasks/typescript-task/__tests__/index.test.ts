import { EventManager } from '@alliage/lifecycle';
import { ShellTask } from '@alliage/builder';

import { TypeScriptTask } from '..';
import { TASK_EVENTS, BeforeRunEvent, AfterRunEvent } from '../events';
import { getBinaryPath } from '../../../helpers';

jest.mock('../../../helpers');

describe('tasks/typescript', () => {
  describe('TypeScriptTask', () => {
    const eventManager = new EventManager();
    const task = new TypeScriptTask(eventManager);

    describe('#getName', () => {
      it('should return the task name', () => {
        expect(task.getName()).toEqual('typescript');
      });
    });

    describe('#getParamsSchema', () => {
      it('should return the parameters validation schema', () => {
        expect(task.getParamsSchema()).toEqual({
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
            },
          },
        });
      });
    });

    describe('#run', () => {
      const getBinaryPathMock = getBinaryPath as jest.Mock;

      const beforeRunEventHandler = jest.fn();
      const afterRunEventHandler = jest.fn();

      eventManager.on(TASK_EVENTS.BEFORE_RUN, beforeRunEventHandler);
      eventManager.on(TASK_EVENTS.AFTER_RUN, afterRunEventHandler);

      it('should execute the TypeScript compile command', async () => {
        getBinaryPathMock.mockResolvedValueOnce('/path/to/tsc');
        const dummyShellTask = new ShellTask(eventManager);
        const runSpy = jest.spyOn(dummyShellTask, 'run').mockResolvedValueOnce(undefined);

        beforeRunEventHandler.mockImplementationOnce((event: BeforeRunEvent) => {
          expect(event.getTscPath()).toEqual('/path/to/tsc');
          expect(event.getProjectPath()).toEqual('/path/to/project');
          expect(event.getCommand()).toEqual('/path/to/tsc -p /path/to/project');
          expect(event.getShellTask()).toBeInstanceOf(ShellTask);

          event.setCommand('/path/to/tsc -p /path/to/project --new-option');
          event.setShellTask(dummyShellTask);
        });

        afterRunEventHandler.mockImplementationOnce((event: AfterRunEvent) => {
          expect(event.getTscPath()).toEqual('/path/to/tsc');
          expect(event.getProjectPath()).toEqual('/path/to/project');
          expect(event.getCommand()).toEqual('/path/to/tsc -p /path/to/project --new-option');
          expect(event.getShellTask()).toBe(dummyShellTask);
        });

        await task.run({ projectPath: '/path/to/project' });

        expect(getBinaryPathMock).toHaveBeenCalledWith('tsc');
        expect(runSpy).toHaveBeenCalledWith({
          cmd: '/path/to/tsc -p /path/to/project --new-option',
        });
        expect(beforeRunEventHandler).toHaveBeenCalledTimes(1);
        expect(afterRunEventHandler).toHaveBeenCalledTimes(1);
      });
    });
  });
});
