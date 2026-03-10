import {getTestProvider} from '@/lib/test-provider';

type AuthorizeFunction = (credentials: Record<string, string> | undefined) => Promise<{id: string; name: string} | null>;

function getAuthorize(): AuthorizeFunction {
    const provider = getTestProvider();
    if (!provider.authorize || typeof provider.authorize !== 'function') {
        throw new Error('Test provider authorize function not found');
    }
    return provider.authorize as AuthorizeFunction;
}

describe('test-provider', () => {
    let authorize: AuthorizeFunction;

    beforeEach(() => {
        authorize = getAuthorize();
    });

    describe('credentials configuration', () => {
        it('has only a username field and no password field', () => {
            const provider = getTestProvider();
            const options = provider.options as {credentials: Record<string, unknown>};
            expect(options.credentials).toHaveProperty('username');
            expect(options.credentials).not.toHaveProperty('password');
        });
    });

    describe('authorize', () => {
        it('returns a user object with username when given a valid username', async () => {
            const result = await authorize({username: 'testuser'});

            expect(result).not.toBeNull();
            expect(result).toEqual(expect.objectContaining({
                name: 'testuser',
            }));
            expect(result).toHaveProperty('id');
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
});
