import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email'; // For OTP/Magic Link

import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
    // We will manually handle user creation in callbacks to ensure
    // our custom Mongoose models are respected, rather than using a rigid Adapter
    // which sometimes conflicts with custom schemas in simple setups.
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        AzureADProvider({
            clientId: process.env.MICROSOFT_CLIENT_ID || '',
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
            tenantId: 'common', // Supports personal Microsoft accounts
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
                otp: { label: 'OTP', type: 'text' }, // For Email OTP
                twoFactorCode: { label: '2FA Code', type: 'text' } // For TOTP
            },
            async authorize(credentials) {
                if (!credentials?.email) {
                    throw new Error('Please enter an email or username');
                }

                await connectDB();

                // Find user by email OR username
                // Note: The credential field is named 'email' from the form, but it can contain a username.
                const user = await User.findOne({
                    $or: [
                        { email: credentials.email },
                        { username: credentials.email }
                    ]
                }).select('+passwordHash +otpCode +otpExpires +twoFactorSecret +is2FAEnabled');

                if (!user) {
                    throw new Error('No user found');
                }

                // CASE 1: OTP Login
                if (credentials.otp) {
                    if (!user.otpCode || !user.otpExpires || new Date() > user.otpExpires) {
                        throw new Error('Invalid or expired OTP');
                    }
                    // Ideally check hash if we hashed OTP, but for MVP plain check (sensitive fields selected above)
                    const isValidOtp = credentials.otp === user.otpCode;
                    if (!isValidOtp) throw new Error('Invalid OTP');

                    // Clear OTP after use
                    await User.findByIdAndUpdate(user._id, { $unset: { otpCode: 1, otpExpires: 1 } });
                }
                // CASE 2: Password Login
                if (credentials.password) {
                    if (!user.passwordHash) {
                        throw new Error('This account uses a different sign-in method');
                    }
                    const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
                    if (!isValid) throw new Error('Invalid password');

                    // 2FA CHECK
                    if (user.is2FAEnabled) {
                        if (!credentials.twoFactorCode) {
                            throw new Error('2FA_REQUIRED');
                        }

                        const { TOTP } = await import('otpauth');
                        const totp = new TOTP({
                            issuer: "SecureVault",
                            label: user.email,
                            algorithm: "SHA1",
                            digits: 6,
                            period: 30,
                            secret: user.twoFactorSecret
                        });

                        const delta = totp.validate({ token: credentials.twoFactorCode, window: 1 });
                        if (delta === null) {
                            throw new Error('Invalid 2FA code');
                        }
                    }
                } else if (!credentials.otp) {
                    throw new Error('Please provide password or OTP');
                }

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    isAdmin: !!user.isAdmin,
                    isEmailVerified: !!user.isEmailVerified,
                    hasSecurityQuestions: !!(user.securityQuestions && user.securityQuestions.length > 0),
                };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google' || account?.provider === 'azure-ad') {
                try {
                    await connectDB();
                    const existingUser = await User.findOne({ email: user.email });

                    if (!existingUser) {
                        await User.create({
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            provider: account.provider,
                            isEmailVerified: true,
                        });
                    }
                    return true;
                } catch (error) {
                    console.error('Error in SignIn Callback', error);
                    return false;
                }
            }
            return true;
        },
        async session({ session, token }) {
            if (token && session.user) {
                // @ts-ignore
                session.user.id = token.sub;
                // @ts-ignore
                session.user.isAdmin = token.isAdmin;
                // @ts-ignore
                session.user.isEmailVerified = token.isEmailVerified;
                // @ts-ignore
                session.user.hasSecurityQuestions = token.hasSecurityQuestions;
                // @ts-ignore
                session.user.provider = token.provider;
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                // For social logins, user.id might be a provider ID. 
                // We always want the MongoDB _id for our database queries.
                await connectDB();
                const dbUser = await User.findOne({ email: user.email });

                if (dbUser) {
                    token.sub = dbUser._id.toString();
                    // @ts-ignore
                    token.provider = dbUser.provider;
                    // @ts-ignore
                    token.isAdmin = !!dbUser.isAdmin;
                    // @ts-ignore
                    token.isEmailVerified = !!dbUser.isEmailVerified;
                    // @ts-ignore
                    token.hasSecurityQuestions = !!(dbUser.securityQuestions && dbUser.securityQuestions.length > 0);
                } else {
                    // Fallback to provider ID if for some reason DB user not found (shouldn't happen due to signIn callback)
                    token.sub = user.id;
                }
            }

            // Handle Session Update
            if (trigger === "update") {
                try {
                    await connectDB();
                    const dbUser = await User.findById(token.sub);
                    if (dbUser) {
                        // @ts-ignore
                        token.hasSecurityQuestions = !!(dbUser.securityQuestions && dbUser.securityQuestions.length > 0);
                        // @ts-ignore
                        token.isEmailVerified = !!dbUser.isEmailVerified;
                    }
                } catch (e) {
                    console.error("Failed to refresh token user data", e);
                }
            }
            return token;
        }
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
};
