const tsx = require('tsx/cjs/api');
tsx.register();

class StrykerDynamicEnvironment {
  constructor(config, context) {
    let realEnvName =
      config.projectConfig?.testEnvironmentOptions?.strykerRealEnvironment ||
      'jest-environment-node';

    if (realEnvName.includes('<rootDir>')) {
      realEnvName = realEnvName.replace(
        /<rootDir>/g,
        config.projectConfig.rootDir
      );
    }

    const mod = require(realEnvName);
    const RealEnvironment = mod.default || mod;

    return new RealEnvironment(config, context);
  }
}

module.exports = StrykerDynamicEnvironment;
