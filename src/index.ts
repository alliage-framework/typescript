import * as cp from 'child_process';

import {
  AbstractModule,
  Arguments,
  ArgumentsParser,
  CommandBuilder,
  PrimitiveContainer,
} from '@alliage/framework';
import { ServiceContainer, service } from '@alliage/di';

import { getBinaryPath } from './helpers.js';
import { TypeScriptTask } from './tasks/typescript-task/index.js';

const TYPESCRIPT_RUNTIME = 'tsx';
export default class TypeScriptModule extends AbstractModule {
  public getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }

  onInit = async (args: Arguments, env: string, container: PrimitiveContainer) => {
    const parsedArgs = await ArgumentsParser.parse(
      CommandBuilder.create()
        .addOption('use-typescript', {
          describe: 'Runs command through TypeScript interpreter',
          type: 'boolean',
        })
        .addOption('ts-services-basepath', {
          describe:
            'Base path used for service loading when running through TypeScript interpreter',
          type: 'string',
          default: 'src',
        })
        .addOption('ts-project', {
          describe: 'Configuration file used when running through TypeScript interpreter',
          type: 'string',
          default: 'tsconfig.json',
        })
        .addOption('watch', {
          describe: 'Whether or not the process should be restarted if a change occurs',
          type: 'boolean',
        }),
      args,
    );

    const useTS = parsedArgs.get<boolean>('use-typescript');
    const watch = parsedArgs.get<boolean>('watch');
    // if the --use-typescript option has been used
    if (useTS) {
      const typescriptRuntimePath = await getBinaryPath(TYPESCRIPT_RUNTIME);
      const scriptPath = process.argv[1]; // alliage-script path
      const scriptArgs = [
        ...(watch ? ['watch'] : []),
        `--tsconfig=${parsedArgs.get('ts-project')}`,
        scriptPath,
        args.get('script'),
        ...parsedArgs.getRemainingArgs(),
        `--env=${env}`,
      ];
      // Re-execute the initial command but through NODE_RUNTIME this time
      const { error } = cp.spawnSync(
        typescriptRuntimePath,
        scriptArgs,
        {
          stdio: 'inherit',
          shell: process.platform === 'win32',
          env: {
            ...process.env,
            // This env variable is meant to be used in the config/services.yaml file
            // in order to load services from the 'src' folder instead of the 'dist' folder
            // in dev mode
            ALLIAGE_TS_SERVICES_BASEPATH: parsedArgs.get('ts-services-basepath'),
          },
        },
      );
      process.exit(error ? 1 : 0);
    }
    container
      .get<ServiceContainer>('service_container')
      .registerService('typescript_task', TypeScriptTask, [service('event_manager')]);
  };
}

export * from './tasks/index.js';
