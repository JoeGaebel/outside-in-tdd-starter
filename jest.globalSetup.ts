import dotenv from 'dotenv';

async function globalSetup() {
    dotenv.config({ path: '.env' });
}

export default globalSetup;
