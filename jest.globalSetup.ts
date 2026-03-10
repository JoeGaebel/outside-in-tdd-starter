import dotenv from 'dotenv';

async function globalSetup() {
    dotenv.config({ path: '.env.local' });
}

export default globalSetup;
