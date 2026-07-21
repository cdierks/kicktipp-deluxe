import { NextAuthOptions, getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { consumeRateLimit, normalizeRequestIp } from '@/lib/rate-limit'
import { serverEnv } from '@/lib/env'

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().max(191).email(),
  password: z.string().min(1).max(1024),
})

// A missing account still performs one bcrypt comparison, reducing the timing
// difference between unknown e-mail addresses and wrong passwords.
const DUMMY_PASSWORD_HASH = '$2b$12$ei5GxMp8ATYKo/3EKAuIDe8XmGZ0MKPDPCHHMS/J7eQNZHF1dUko.'

export const authOptions: NextAuthOptions = {
  secret: serverEnv.NEXTAUTH_SECRET,
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
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const realIp = request.headers?.['x-real-ip']
        const forwardedFor = request.headers?.['x-forwarded-for']
        const requestIp = normalizeRequestIp(realIp ?? forwardedFor)
        if (!consumeRateLimit(`login-ip:${requestIp}`, 50, 15 * 60_000)) return null
        if (!consumeRateLimit(`login-account:${parsed.data.email}`, 30, 15 * 60_000)) return null
        if (!consumeRateLimit(`login:${requestIp}:${parsed.data.email}`, 10, 15 * 60_000)) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user) {
          await bcrypt.compare(parsed.data.password, DUMMY_PASSWORD_HASH)
          return null
        }

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
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
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.nickname = (user as { nickname?: string }).nickname ?? ''
        token.role = (user as { role?: string }).role ?? 'USER'
        token.color = (user as { color?: string | null }).color ?? null
        token.favoriteTeam = (user as { favoriteTeam?: string | null }).favoriteTeam ?? null
      }
      if (trigger === 'update' && token.id) {
        // Session updates are client-triggerable. Reload canonical claims instead
        // of copying arbitrary values supplied by the browser into the JWT.
        const currentUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            email: true,
            name: true,
            nickname: true,
            role: true,
            color: true,
            favoriteTeam: true,
          },
        })

        if (currentUser) {
          token.email = currentUser.email
          token.name = currentUser.name
          token.nickname = currentUser.nickname
          token.role = currentUser.role
          token.color = currentUser.color
          token.favoriteTeam = currentUser.favoriteTeam
        }
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
