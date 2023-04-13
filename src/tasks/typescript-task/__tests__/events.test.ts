import { EventManager } from '@alliage/lifecycle';
import { ShellTask } from '@alliage/builder';

import { BeforeRunEvent, AfterRunEvent, TASK_EVENTS } from '../events';

describe('tasks/typescript/events', () => {
  describe('BeforeRunEvent', () => {
    const eventManager = new EventManager();
    const shellTask = new ShellTask(eventManager);
    const event = new BeforeRunEvent('/path/to/tsc', '/path/to/project', shellTask, 'test_cmd');

    describe('#getTscPath', () => {
      it('should return the TypeScript compilator path', () => {
        expect(event.getTscPath()).toEqual('/path/to/tsc');
      });
    });

    describe('#getProjectPath', () => {
      it('should return the project path', () => {
        expect(event.getProjectPath()).toEqual('/path/to/project');
      });
    });

    describe('#getShellTask', () => {
      it('should return the shell task', () => {
        expect(event.getShellTask()).toBe(shellTask);
      });
    });

    describe('#getCommand', () => {
      it('should return the command', () => {
        expect(event.getCommand()).toEqual('test_cmd');
      });
    });

    describe('#setShellTask', () => {
      it('should allow to update the shellTask', () => {
        const newShellTask = new ShellTask(eventManager);
        event.setShellTask(newShellTask);
        expect(event.getShellTask()).toBe(newShellTask);
      });
    });

    describe('#setCommand', () => {
      it('should allow to update the command', () => {
        event.setCommand('new_test_command');
        expect(event.getCommand()).toEqual('new_test_command');
      });
    });
  });

  describe('AfterRunEvent', () => {
    const eventManager = new EventManager();
    const shellTask = new ShellTask(eventManager);
    const event = new AfterRunEvent('/path/to/tsc', '/path/to/project', shellTask, 'test_cmd');

    describe('#getTscPath', () => {
      it('should return the TypeScript compilator path', () => {
        expect(event.getTscPath()).toEqual('/path/to/tsc');
      });
    });

    describe('#getProjectPath', () => {
      it('should return the project path', () => {
        expect(event.getProjectPath()).toEqual('/path/to/project');
      });
    });

    describe('#getShellTask', () => {
      it('should return the shell task', () => {
        expect(event.getShellTask()).toBe(shellTask);
      });
    });

    describe('#getCommand', () => {
      it('should return the command', () => {
        expect(event.getCommand()).toEqual('test_cmd');
      });
    });

    describe('#getParams', () => {
      it('should return the parameters ready to be sent to the emit method of the EventManager', () => {
        const [type, eventInstance] = AfterRunEvent.getParams(
          '/path/to/tsc',
          '/path/to/project',
          shellTask,
          'test_cmd',
        ) as [TASK_EVENTS, AfterRunEvent];

        expect(type).toEqual(TASK_EVENTS.AFTER_RUN);
        expect(eventInstance).toBeInstanceOf(AfterRunEvent);
        expect(eventInstance.getTscPath()).toEqual('/path/to/tsc');
        expect(eventInstance.getProjectPath()).toEqual('/path/to/project');
        expect(eventInstance.getShellTask()).toBe(shellTask);
        expect(eventInstance.getCommand()).toEqual('test_cmd');
      });
    });
  });
});
