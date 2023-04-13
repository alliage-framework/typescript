import { AbstractTask, ShellTask } from '@alliage/builder';
import { EventManager } from '@alliage/lifecycle';

import { getBinaryPath } from '../../helpers';
import { BeforeRunEvent, AfterRunEvent } from './events';

export interface Params {
  projectPath: string;
}

export class TypeScriptTask extends AbstractTask {
  private eventManager: EventManager;

  constructor(eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
  }

  getName() {
    return 'typescript';
  }

  getParamsSchema() {
    return {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
        },
      },
    };
  }

  async run({ projectPath }: Params) {
    const tscPath = await getBinaryPath('tsc');
    const beforeRunEvent = new BeforeRunEvent(
      tscPath,
      projectPath,
      new ShellTask(this.eventManager),
      `${tscPath} -p ${projectPath}`,
    );

    await this.eventManager.emit(beforeRunEvent.getType(), beforeRunEvent);
    const shellTask = beforeRunEvent.getShellTask();
    const cmd = beforeRunEvent.getCommand();

    await shellTask.run({ cmd });

    await this.eventManager.emit(...AfterRunEvent.getParams(tscPath, projectPath, shellTask, cmd));
  }
}

export * from './events';
