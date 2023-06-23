import cp from 'child_process';

import {
  AbstractModule,
  Arguments,
  ArgumentsParser,
  CommandBuilder,
  PrimitiveContainer,
} from '@alliage/framework';
import { ServiceContainer, service } from '@alliage/di';

import { getBinaryPath } from './helpers';
import { TypeScriptTask } from './tasks/typescript-task';

const EMPTY_ARGUMENT = '@__EMPTY_ARGUMENT__@';
export default class TypeScriptModule extends AbstractModule {
  public getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }

  onInit = async (args: Arguments, env: string, container: PrimitiveContainer) => {
    const parsedArgs = ArgumentsParser.parse(
      CommandBuilder.create()
        // As having at least one agument is mandatory even if the initial command
        // does not require it, we create a dummy one that will be re-injected
        // in the new command (see below) if it has a different value than
        // `EMPTY_ARGUMENT`
        .addArgument('first-argument', {
          describe: 'First argument',
          type: 'string',
          default: EMPTY_ARGUMENT,
        })
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
      const tsNodePath = await getBinaryPath(watch ? 'ts-node-dev' : 'ts-node');
      const scriptPath = process.argv[1]; // alliage-script path
      // Re-execute the initial command but through ts-node this time
      const { error } = cp.spawnSync(
        tsNodePath,
        [
          `--project=${parsedArgs.get('ts-project')}`,
          scriptPath,
          args.get('script'),
          ...(parsedArgs.get('first-argument') === EMPTY_ARGUMENT
            ? []
            : [parsedArgs.get('first-argument')]),
          ...parsedArgs.getRemainingArgs(),
          `--env=${env}`,
        ],
        {
          stdio: 'inherit',
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

export * from './tasks';
