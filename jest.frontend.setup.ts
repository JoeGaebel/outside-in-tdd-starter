import '@testing-library/jest-dom'
import { configure } from '@testing-library/react';
import { setupServer } from 'msw/node';
import dotenv from 'dotenv';

configure({ asyncUtilTimeout: 5000 });

dotenv.config({ path: '.env.local' });

global.mswServer = setupServer();

beforeAll(() => {
  global.mswServer.listen();
});

afterEach(() => {
  global.mswServer.resetHandlers();
});

afterAll(() => {
  global.mswServer.close();
});

// Fail tests that trigger console.error
const originalConsoleError = console.error;
let consoleErrors: string[] = [];

beforeEach(() => {
  consoleErrors = [];
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    originalConsoleError(...args);
    consoleErrors.push(args.map(String).join(' '));
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  if (consoleErrors.length > 0) {
    throw new Error(`Test produced ${consoleErrors.length} console.error(s):\n${consoleErrors.join('\n')}`);
  }
});
