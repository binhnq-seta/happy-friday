import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from '@/app/database/mongodb';
import User from '@/app/models/User';
import bcrypt from "bcryptjs";

const handler = NextAuth({
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
            return session;
        },
        async jwt({ token, user, trigger, session }) {
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
});

export { handler as GET, handler as POST };