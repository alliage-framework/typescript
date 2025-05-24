import { AbstractTask, ShellTask } from '@alliage/builder';
import { EventManager } from '@alliage/lifecycle';

import { getBinaryPath } from '../../helpers.js';
import { BeforeRunEvent, AfterRunEvent } from './events.js';
import { FromSchema } from 'json-schema-to-ts';

const schema = {
  type: 'object',
  properties: {
    projectPath: {
      type: 'string'
    },
  },
  required: ['projectPath'],
} as const;

export type Params = FromSchema<typeof schema>;
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
    return schema;
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

export * from './events.js';
