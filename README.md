# `@alliage/typescript`

Alliage Framework module allowing to write your code in TypeScript.

## Dependencies

This module requires the following modules to work correctly:

- `@alliage/di`
- `@alliage/lifecycle`
- `@alliage/builder`
- `@alliage/config-loader`
- `@alliage/module-installer`

## Getting started

### Install package

Run the following command to install the package:

```bash
yarn install @alliage/typescript
```

The package should be automatically registered in the `alliage-modules.json` file and a `tsconfig.json` file should be created at the root of your project.

You can update it to fit your needs. If you want to know more about this file, you can read the official TypeScript [documentation](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html).

### Run in dev mode

In dev mode, you'll want your code to be directly interpreted on the fly without having to compile it first.

To do so, update the "alliage:run:dev" script in your `package.json` to make it run the following command:

```bash
alliage-scripts run --use-typescript --env=development
```

### Compile for production

To compile the code for production, you'll need to add the following configuration to your `config/builder.yaml` file.

```yaml
tasks:
  - name: typescript
    description: Compile TypeScript code
    params:
      projectPath: './tsconfig.json'
```

### Service loader

If you're using the `@alliage/service-loader` module, then you'll need to update your `config/services.yaml` in order to make it load services from the right directory depending on the context.

Update the `basePath` configuration variable like so:

```yaml
basePath: '$(ALLIAGE_TS_SERVICES_BASEPATH?dist)'
```

This way in dev mode (and especially when you use the `--use-typescript` option) the `ALLIAGE_TS_SERVICES_BASEPATH` env variable will target the folder where the uncompiled version of your code is located whereas, in production mode, it will fallback on the `dist` folder which, as configured by default in the `tsconfig.json`, will contain the compiled version of your code.

## Advanced usage

### Custom config path

If you want to put your `tsconfig.json` somewhere else or just rename it you just have to add the `--ts-project=/path/to/your/config` option in the `alliage:run:dev` script.

### Custom service base path

If your services are not located under the `src` folder you can add `--ts-services-basepath=/path/to/your/services` in the `alliage:run:dev` script.

