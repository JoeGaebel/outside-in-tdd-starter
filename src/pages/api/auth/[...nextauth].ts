import NextAuth, {NextAuthOptions} from "next-auth"
import CredentialsProvider, {CredentialsConfig} from "next-auth/providers/credentials";
import {Provider} from "next-auth/providers/index";
import {getTestProvider} from "@/lib/test-provider";
import prisma from "@/lib/cached-prisma-client";

async function authorize(credentials: Record<"username", string> | undefined) {
    const username = credentials?.username;
    if (!username) {
        return null;
    }

    let user = await prisma.user.findUnique({
        where: { username },
    });

    if (!user) {
        user = await prisma.user.create({
            data: { username },
        });
    }

    return { id: String(user.id), name: user.username };
}

const credentialsProvider = CredentialsProvider({
    id: "credentials",
    name: "Credentials",
    credentials: {
        username: { label: "Username", type: "text" },
    },
    authorize,
});
credentialsProvider.authorize = authorize as CredentialsConfig["authorize"];

const providers: Provider[] = [credentialsProvider];

if (process.env.NODE_ENV === "development") {
    providers.push(getTestProvider());
}

export const authOptions: NextAuthOptions = {
    providers,
    callbacks: {
        session({ session, token }) {
            if (session.user && token.name) {
                session.user.name = token.name;
            }
            return session;
        },
    },
}

export default NextAuth(authOptions)
