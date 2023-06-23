import fs from 'fs';
import { Sandbox } from '@alliage/sandbox';

describe('Main scenario', () => {
  const sandbox = new Sandbox({
    scenarioPath: __dirname,
  });

  beforeAll(async () => {
    await sandbox.init();
    await sandbox.install(['@alliage/core', '--env=development']).waitCompletion();
  });

  afterAll(async () => {
    await sandbox.clear();
  });

  it('should install correctly and create the tsconfig.json file', async () => {
    const { waitCompletion } = await sandbox.install(['@alliage/typescript', '--env=development']);

    await waitCompletion();

    const tsConfigFile = `${sandbox.getPath()}/tsconfig.json`;
    expect(fs.existsSync(tsConfigFile)).toBe(true);
    expect(fs.readFileSync(tsConfigFile).toString()).toMatchSnapshot();

    expect(
      JSON.parse(fs.readFileSync(`${sandbox.getPath()}/alliage-modules.json`).toString()),
    ).toEqual(
      expect.objectContaining({
        '@alliage/typescript': expect.objectContaining({
          deps: [
            '@alliage/lifecycle',
            '@alliage/di',
            '@alliage/config-loader',
            '@alliage/module-installer',
            '@alliage/builder',
          ],
          envs: ['development'],

          module: '@alliage/typescript',
        }),
      }),
    );
  });

  it('should allow to execute the command with ts-node', async () => {
    const { waitCompletion, process: childProcess } = sandbox.run([
      'dummy-process',
      'test',
      '--use-typescript',
      '--ts-services-basepath=src',
      '--ts-project=./tsconfig.json',
      '--env=development',
    ]);

    let output = '';
    childProcess.stdout!.on('data', (chunk) => {
      output += chunk;
    });
    await waitCompletion();
    expect(output).toContain(
      'Hello Alliage TypeScript ! - test - development\nabout to shut down...\nshutting down with signal: @process-manager/SIGNAL/SUCCESS_SHUTDOWN\n',
    );
  });

  it('should compile the TypeScript code and run the compiled version', async () => {
    const { waitCompletion: waitBuildCompletion, process: buildProcess } = sandbox.build([
      '--env=development',
    ]);
    buildProcess.stderr!.pipe(process.stderr);
    buildProcess.stdout!.pipe(process.stdout);

    await waitBuildCompletion();

    // Removing the source directory should ensure that it's the compiled version that is actually executed
    fs.rmdirSync(`${sandbox.getPath()}/src`, { recursive: true });

    const { waitCompletion: waitRunCompletion, process: runProcess } = sandbox.run([
      'dummy-process',
      'test',
    ]);
    runProcess.stderr!.pipe(process.stderr);

    let output = '';
    runProcess.stdout!.on('data', (chunk) => {
      output += chunk;
    });

    await waitRunCompletion();
    expect(output).toEqual(
      'Hello Alliage TypeScript ! - test - production\nabout to shut down...\nshutting down with signal: @process-manager/SIGNAL/SUCCESS_SHUTDOWN\n',
    );
  });
});
