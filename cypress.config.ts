import {config} from "dotenv";
config({path: ".env"});

import {PrismaClient} from "./prisma/generated/prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";
import {defineConfig} from "cypress";

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL});
const prisma = new PrismaClient({adapter});

export default defineConfig({
    e2e: {
        setupNodeEvents(on) {
            on('task', {
                async getUserByUsername(username: string) {
                    return await prisma.user.findUnique({where: {username}});
                },
                async cleanupUsers() {
                    await prisma.$executeRaw`DELETE FROM "User"`;
                    return null;
                },
            })
        },
        baseUrl: process.env.CYPRESS_BASE_URL || `http://localhost:${process.env.TEST_PORT || '4001'}`,
        viewportWidth: 1280,
        viewportHeight: 900,
        defaultCommandTimeout: 30000,
        screenshotOnRunFailure: false,
        video: false,
    },
});
