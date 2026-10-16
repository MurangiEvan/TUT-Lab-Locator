import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';
import { isValidStudentNumber, studentEmailFromNumber } from '@/lib/student-email';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        studentNumber: { label: 'Student number', type: 'text' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Account type', type: 'text' },
      },
      async authorize(credentials) {
        if (
          !credentials?.studentNumber ||
          !isValidStudentNumber(credentials.studentNumber) ||
          !credentials.password ||
          !['STUDENT', 'ADMIN'].includes(credentials.role ?? '')
        ) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: studentEmailFromNumber(credentials.studentNumber),
          },
        });

        if (!user || user.role !== credentials.role) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? 'STUDENT';
      }

      return session;
    },
  },
};
