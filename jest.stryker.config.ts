import path from "path";
import getConfig from "./jest.config";

const DYNAMIC_ENV = path.resolve(
  __dirname,
  "test/helpers/jest-stryker-dynamic-environment.cjs"
);

const STRYKER_TRANSFORMER = path.resolve(
  __dirname,
  "test/helpers/jest-stryker-transformer.cjs"
);

export default async function getStrykerConfig() {
  const config = await getConfig();
  return {
    ...config,
    testEnvironment: DYNAMIC_ENV,
    projects: config.projects
      ?.map((project: any) => {
        const transform = { ...project.transform };
        for (const [pattern, value] of Object.entries(transform)) {
          if (
            Array.isArray(value) &&
            typeof value[0] === "string" &&
            value[0].includes("jest-transformer")
          ) {
            transform[pattern] = [STRYKER_TRANSFORMER, value[1]];
          }
        }

        return {
          ...project,
          transform,
          testEnvironmentOptions: {
            ...project.testEnvironmentOptions,
            strykerRealEnvironment: project.testEnvironment,
          },
        };
      }),
  };
}
