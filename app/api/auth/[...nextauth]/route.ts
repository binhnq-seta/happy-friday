import NextAuth, { type AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from '@/app/database/mongodb';
import User from '@/app/models/User';
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                await connectDB();
                const normalizedEmail = credentials?.email?.toLowerCase();
                const user = await User.findOne({ email: normalizedEmail });

                if (!user) throw new Error("No user found");

                const inputPassword = credentials!.password;
                const storedPassword = user.password;
                if (!storedPassword) {
                    throw new Error("This account uses Google Login. Please sign in with Google.");
                }
                const isHashed = storedPassword.startsWith('$2');
                let isValid = false;

                if (isHashed) {
                    isValid = await bcrypt.compare(inputPassword, storedPassword);
                } else {
                    isValid = (inputPassword === storedPassword);

                    if (isValid) {
                        const hashedPassword = await bcrypt.hash(inputPassword, 10);
                        user.password = hashedPassword;
                        await user.save();
                        console.log(`User ${user.email} migrated to hashed password.`);
                    }
                }

                if (!isValid) throw new Error("Invalid password");

                return { id: user._id, name: user.Name, email: user.email };
            }
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                await connectDB();
                const normalizedEmail = user.email?.toLowerCase();
                const existingUser = await User.findOne({ email: normalizedEmail });

                if (!existingUser) {
                    await User.create({
                        email: normalizedEmail,
                        Name: user.name,
                        image: user.image,
                        provider: "google",
                        isActive: true
                    });
                }
            }
            return true;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = (token as any).id || token.sub;
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user?.email) {
                await connectDB();
                const dbUser = await User.findOne({ email: user.email.toLowerCase() });
                if (dbUser?._id) {
                    (token as any).id = dbUser._id.toString();
                }
            } else if (user) {
                (token as any).id = (user as any).id;
            }

            if (trigger === "update" && session) {
                token.name = session.name;
                token.email = session.email;
            }
            return token;
        }
    },
    pages: {
        signIn: '/pages/authen/login',
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };