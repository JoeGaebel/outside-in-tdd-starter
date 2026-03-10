import { cpus } from "os";

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  concurrency: Math.max(1, Math.floor(cpus().length / 2)),
  testRunner: "jest",
  jest: {
    configFile: "jest.stryker.config.ts",
    projectType: "custom",
  },
  checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",
  mutate: [
    "src/**/*.ts",
    "src/**/*.tsx",
    "!src/styles/**",
    "!src/pages/_app.tsx",
    "!src/pages/_document.tsx",
    "!src/types/**",
    "!src/lib/cached-prisma-client.ts",
    "!src/lib/test-provider.ts",
    "!src/lib/api-client.ts",
    "!src/lib/api-error-handler.ts",
  ],
  incremental: true,
  incrementalFile: ".stryker-incremental.json",
  reporters: ["html", "clear-text", "json"],
  htmlReporter: {
    fileName: "reports/mutation/mutation-report.html",
  },
  jsonReporter: {
    fileName: "reports/mutation/mutation-report.json",
  },
  coverageAnalysis: "perTest",
  thresholds: {
    high: 80,
    low: 60,
    break: 60,
  },
};
