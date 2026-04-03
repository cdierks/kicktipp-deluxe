import { NextAuthOptions, getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'E-Mail', type: 'email' },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          nickname: user.nickname,
          role: user.role,
          color: user.color,
          favoriteTeam: user.favoriteTeam,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.nickname = (user as { nickname?: string }).nickname ?? ''
        token.role = (user as { role?: string }).role ?? 'USER'
        token.color = (user as { color?: string | null }).color ?? null
        token.favoriteTeam = (user as { favoriteTeam?: string | null }).favoriteTeam ?? null
      }
      if (trigger === 'update') {
        if (session?.email) token.email = session.email
        if (session?.name) token.name = session.name
        if (session?.nickname) token.nickname = session.nickname
        if ('favoriteTeam' in (session ?? {})) token.favoriteTeam = session.favoriteTeam ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = (token.email as string | null | undefined) ?? null
        session.user.name = (token.name as string | null | undefined) ?? null
        session.user.nickname = token.nickname as string
        session.user.role = token.role as string
        session.user.color = token.color as string | null
        session.user.favoriteTeam = (token.favoriteTeam as string | null | undefined) ?? null
      }
      return session
    },
  },
}

export const getSession = () => getServerSession(authOptions)
