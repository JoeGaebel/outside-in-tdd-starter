import { server } from './test/mocks/server'
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Mock the cached-prisma-client to use jestPrisma's transactional client
jest.mock('@/lib/cached-prisma-client', () => ({
  __esModule: true,
  get default() {
    return jestPrisma.client;
  },
}));

// Set up MSW server for mocking external API calls
beforeAll(() => {
  server.listen()
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

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
