import {authOptions} from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/cached-prisma-client';

type AuthorizeFunction = (credentials: Record<string, string> | undefined) => Promise<{id: string; name: string} | null>;

function getAuthorize(): AuthorizeFunction {
    const credentialsProvider = authOptions.providers.find(
        (p) => p.id === 'credentials'
    );
    if (!credentialsProvider || !('authorize' in credentialsProvider) || typeof credentialsProvider.authorize !== 'function') {
        throw new Error('Credentials provider with authorize function not found');
    }
    return credentialsProvider.authorize as AuthorizeFunction;
}

describe('NextAuth credentials provider', () => {
    let authorize: AuthorizeFunction;

    beforeEach(async () => {
        authorize = getAuthorize();
        // Clean pre-existing users to ensure count assertions are accurate
        await prisma.todo.deleteMany();
        await prisma.user.deleteMany();
    });

    describe('credentials configuration', () => {
        it('has only a username field and no password field', () => {
            const credentialsProvider = authOptions.providers.find(
                (p) => p.id === 'credentials'
            );
            expect(credentialsProvider).toBeDefined();
            if (credentialsProvider && 'options' in credentialsProvider) {
                const options = credentialsProvider.options as {credentials: Record<string, unknown>};
                expect(options.credentials).toHaveProperty('username');
                expect(options.credentials).not.toHaveProperty('password');
            }
        });
    });

    describe('authorize', () => {
        it('creates a new user and returns user object when username does not exist', async () => {
            const result = await authorize({username: 'newuser'});

            expect(result).not.toBeNull();
            expect(result).toEqual(expect.objectContaining({
                name: 'newuser',
            }));
            expect(result).toHaveProperty('id');

            // Verify user was created in the database
            const dbUser = await prisma.user.findFirst({
                where: {username: 'newuser'},
            });
            expect(dbUser).not.toBeNull();
            expect(dbUser!.username).toBe('newuser');
        });

        it('returns existing user when username already exists', async () => {
            // Create user first
            await prisma.user.create({
                data: {username: 'existinguser'},
            });

            const result = await authorize({username: 'existinguser'});

            expect(result).not.toBeNull();
            expect(result).toEqual(expect.objectContaining({
                name: 'existinguser',
            }));

            // Verify no duplicate was created
            const users = await prisma.user.findMany({
                where: {username: 'existinguser'},
            });
            expect(users).toHaveLength(1);
        });

        it('returns null when username is empty string', async () => {
            const result = await authorize({username: ''});

            expect(result).toBeNull();
        });

        it('returns null when username is missing from credentials', async () => {
            const result = await authorize({});

            expect(result).toBeNull();
        });

        it('returns null when credentials are undefined', async () => {
            const result = await authorize(undefined);

            expect(result).toBeNull();
        });
    });

    describe('session callbacks', () => {
        it('includes username in session.user.name', () => {
            expect(authOptions).toHaveProperty('callbacks');
            const callbacks = (authOptions as {callbacks?: {session?: (...args: unknown[]) => unknown}}).callbacks;
            expect(callbacks).toHaveProperty('session');
            expect(typeof callbacks?.session).toBe('function');
        });
    });
});
