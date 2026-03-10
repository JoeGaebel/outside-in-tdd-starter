import nextJest from "next/jest";

const createJestConfig = nextJest({
  dir: './',
})

const baseConfig = {
  clearMocks: true,
};

export default async function getConfig() {
  const nextifiedConfig = await createJestConfig(baseConfig)();
  return {
    globalSetup: '<rootDir>/jest.globalSetup.ts',
    projects: [
      {
        ...nextifiedConfig,
        displayName: 'backend',
        modulePathIgnorePatterns: ['<rootDir>/.stryker-tmp/'],
        setupFilesAfterEnv: ['<rootDir>/jest.backend.setup.ts'],
        testMatch: ['<rootDir>/test/**/*.test.ts'],
        testEnvironment: '<rootDir>/test/helpers/jest-prisma-node-environment.ts',
        transformIgnorePatterns: [
          '/node_modules/(?!.pnpm)(?!(until-async)/)',
          '/node_modules/.pnpm/(?!(until-async)@)',
        ],
        moduleNameMapper: {
          '^@test/(.*)$': '<rootDir>/test/$1',
          '^@/(.*)$': '<rootDir>/src/$1',
        },
      },
      {
        ...nextifiedConfig,
        displayName: 'frontend',
        modulePathIgnorePatterns: ['<rootDir>/.stryker-tmp/'],
        setupFilesAfterEnv: ['<rootDir>/jest.frontend.setup.ts'],
        testMatch: ['<rootDir>/test/**/*.test.tsx'],
        testEnvironment: 'jest-fixed-jsdom',
        transformIgnorePatterns: [
          '/node_modules/(?!.pnpm)(?!(geist|until-async)/)',
          '/node_modules/.pnpm/(?!(geist|until-async)@)',
          '^.+\\.module\\.(css|sass|scss)$',
        ],
        moduleNameMapper: {
          '^@test/(.*)$': '<rootDir>/test/$1',
          '^@/(.*)$': '<rootDir>/src/$1',
        },
      },
    ],
  }
};
