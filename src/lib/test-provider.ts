import CredentialsProvider, {CredentialsConfig} from "next-auth/providers/credentials";

async function authorize(credentials: Record<"username", string> | undefined) {
    const username = credentials?.username;
    if (!username) {
        return null;
    }
    return {
        id: "test-user-id",
        name: username,
    };
}

export function getTestProvider(): CredentialsConfig {
    const provider = CredentialsProvider({
        id: "test-credentials",
        name: "Test Credentials",
        credentials: {
            username: { label: "Username", type: "text" },
        },
        authorize,
    });
    provider.authorize = authorize as CredentialsConfig["authorize"];
    return provider;
}
