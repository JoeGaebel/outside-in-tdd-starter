import { config as dotenvConfig } from 'dotenv'
dotenvConfig({ path: '.env' })
import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        url: env("DATABASE_URL_DIRECT")
    }
});
