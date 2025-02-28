/** @type {import('jest').Config} */
const config = {
  roots: [
    '<rootDir>',
  ],
  transform: {
    '^.+\\.ts?$': [
      'ts-jest',
      {
        tsConfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  testMatch: [
    '<rootDir>/**/__tests__/**/*.test.ts',
  ],
  moduleFileExtensions: [
    'ts',
    'js', 
    'json',
    'node',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/__tests__/**',
  ],
  setupFilesAfterEnv: [
    'jest-extended',
  ],
};

export default config;