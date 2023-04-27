import { ShellTask } from '@alliage/builder';
import { AbstractWritableEvent, AbstractEvent } from '@alliage/lifecycle';

export enum TASK_EVENTS {
  BEFORE_RUN = '@typescript/TASK_EVENTS/BEFORE_RUN',
  AFTER_RUN = '@typescript/TASK_EVENTS/AFTER_RUN',
}

export interface RunEventPayload {
  tscPath: string;
  projectPath: string;
  shellTask: ShellTask;
  command: string;
}

export class BeforeRunEvent extends AbstractWritableEvent<TASK_EVENTS, RunEventPayload> {
  constructor(tscPath: string, projectPath: string, shellTask: ShellTask, command: string) {
    super(TASK_EVENTS.BEFORE_RUN, { tscPath, projectPath, shellTask, command });
  }

  getTscPath() {
    return this.getPayload().tscPath;
  }

  getProjectPath() {
    return this.getPayload().projectPath;
  }

  getShellTask() {
    return this.getWritablePayload().shellTask;
  }

  getCommand() {
    return this.getWritablePayload().command;
  }

  setShellTask(shellTask: ShellTask) {
    this.getWritablePayload().shellTask = shellTask;
    return this;
  }

  setCommand(command: string) {
    this.getWritablePayload().command = command;
    return this;
  }
}

export class AfterRunEvent extends AbstractEvent<TASK_EVENTS, RunEventPayload> {
  constructor(tscPath: string, projectPath: string, shellTask: ShellTask, command: string) {
    super(TASK_EVENTS.AFTER_RUN, { tscPath, projectPath, shellTask, command });
  }

  getTscPath() {
    return this.getPayload().tscPath;
  }

  getProjectPath() {
    return this.getPayload().projectPath;
  }

  getShellTask() {
    return this.getPayload().shellTask;
  }

  getCommand() {
    return this.getPayload().command;
  }

  static getParams(tscPath: string, projectPath: string, shellTask: ShellTask, command: string) {
    return super.getParams(tscPath, projectPath, shellTask, command);
  }
}
