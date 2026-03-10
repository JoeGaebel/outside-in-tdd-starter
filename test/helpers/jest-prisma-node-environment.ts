import NodeEnvironment from 'jest-environment-node';
import {PrismaEnvironmentDelegate} from '@quramy/jest-prisma-core';
import {PrismaClient} from '@prisma-generated';
import {PrismaPg} from '@prisma/adapter-pg';
import type {EnvironmentContext, JestEnvironmentConfig} from '@jest/environment';
import type {Circus} from '@jest/types';

class PrismaNodeEnvironment extends NodeEnvironment {
    private delegate: PrismaEnvironmentDelegate;

    constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
        super(config, context);
        this.delegate = new PrismaEnvironmentDelegate(config, context);
    }

    async setup() {
        const jestPrisma = await this.delegate.preSetup();
        await super.setup();

        const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 });
        const client = new PrismaClient({ adapter, log: [{ level: 'query', emit: 'event' }] });
        jestPrisma.initializeClient(client);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.global as any).jestPrisma = jestPrisma;
    }

    async handleTestEvent(event: Circus.Event) {
        return this.delegate.handleTestEvent(event);
    }

    async teardown() {
        await this.delegate.teardown();
        await super.teardown();
    }
}

let exportedClass: typeof PrismaNodeEnvironment = PrismaNodeEnvironment;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mixinJestEnvironment } = require('@stryker-mutator/jest-runner');
    exportedClass = mixinJestEnvironment(PrismaNodeEnvironment);
} catch {
    // @stryker-mutator/jest-runner not installed — use the plain environment
}
export default exportedClass;
