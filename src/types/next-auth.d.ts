import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string;
            isAdmin: boolean;
            isEmailVerified: boolean;
            hasSecurityQuestions: boolean;
        } & DefaultSession["user"]
    }

    interface User {
        id: string;
        isAdmin: boolean;
        isEmailVerified: boolean;
        hasSecurityQuestions: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        sub: string;
        isAdmin: boolean;
        isEmailVerified: boolean;
        hasSecurityQuestions: boolean;
    }
}
