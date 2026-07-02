import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { checkRateLimit, recordFailedAttempt, clearAttempts, getRemainingAttempts } from "@/lib/rate-limiter";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours — explicit session expiration
    updateAge: 4 * 60 * 60, // Refresh token representation every 4 hours
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@example.com" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "Código MFA", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const email = credentials.email.toLowerCase();

        // 1. Brute force protection
        const rateCheck = checkRateLimit(email);
        if (rateCheck.blocked) {
          const minutes = Math.ceil((rateCheck.retryAfterMs || 0) / 60000);
          throw new Error(`Cuenta bloqueada temporalmente. Intente de nuevo en ${minutes} minutos.`);
        }

        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user || !user.password) {
          recordFailedAttempt(email);
          const remaining = getRemainingAttempts(email);
          throw new Error(`Credenciales inválidas. ${remaining} intentos restantes.`);
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          const locked = recordFailedAttempt(email);
          if (locked) {
            throw new Error("Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intente en 15 minutos.");
          }
          const remaining = getRemainingAttempts(email);
          throw new Error(`Credenciales inválidas. ${remaining} intentos restantes.`);
        }

        if (user.status !== "APPROVED") {
          throw new Error("Su cuenta está pendiente de aprobación por el administrador.");
        }

        // 2. MFA verification (if enabled)
        if (user.mfaEnabled && user.mfaSecret) {
          const totpCode = credentials.totpCode;
          if (!totpCode) {
            // Signal the frontend that MFA is required
            throw new Error("MFA_REQUIRED");
          }

          const { verify } = await import("otplib");
          const isValid = await verify({ token: totpCode, secret: user.mfaSecret });

          if (!isValid) {
            throw new Error("Código MFA inválido. Verifique su aplicación de autenticación.");
          }
        }

        // 3. Login successful — clear brute force attempts
        clearAttempts(email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    }
  }
};
