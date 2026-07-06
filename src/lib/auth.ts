import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { checkRateLimit, recordFailedAttempt, clearAttempts, getRemainingAttempts } from "@/lib/rate-limiter";

const SESSION_MAX_AGE = process.env.SESSION_MAX_AGE
  ? parseInt(process.env.SESSION_MAX_AGE, 10)
  : 24 * 60 * 60; // default 24 hours

const SESSION_UPDATE_AGE = process.env.SESSION_UPDATE_AGE
  ? parseInt(process.env.SESSION_UPDATE_AGE, 10)
  : 4 * 60 * 60; // default 4 hours

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
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

        // Check if user is expired (except for admins)
        const isExempt = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
        if (!isExempt && (user as any).expiresAt && new Date((user as any).expiresAt) < new Date()) {
          throw new Error("Su membresía ha caducado. Por favor, contacte al administrador.");
        }

        // 2. MFA verification (if enabled)
        if (user.mfaEnabled && user.mfaSecret) {
          const totpCode = credentials.totpCode;
          if (!totpCode) {
            // Signal the frontend that MFA is required
            throw new Error("MFA_REQUIRED");
          }

          const trimmedCode = totpCode.trim().toLowerCase();

          // Check if it's a backup code (8-character alphanumeric)
          if (trimmedCode.length === 8 && /^[a-z0-9]+$/.test(trimmedCode)) {
            let backupCodesList: string[] = [];

            if ((user as any).mfaBackupCodes) {
              try {
                backupCodesList = JSON.parse((user as any).mfaBackupCodes);
              } catch {
                backupCodesList = [];
              }
            }

            if (backupCodesList.includes(trimmedCode)) {
              // Valid backup code! Disable 2FA for the user so they can access their account and reset it.
              await (prisma.user as any).update({
                where: { id: user.id },
                data: {
                  mfaEnabled: false,
                  mfaSecret: null,
                  mfaBackupCodes: null
                }
              });

              // bypass standard TOTP verification and continue login
            } else {
              throw new Error("Código de recuperación inválido o ya utilizado.");
            }
          } else {
            // Standard 6-digit TOTP verification
            const { verify } = await import("otplib");
            const isValid = await verify({ token: trimmedCode, secret: user.mfaSecret });

            if (!isValid) {
              throw new Error("Código MFA inválido. Verifique su aplicación de autenticación.");
            }
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
          expiresAt: (user as any).expiresAt,
          mfaEnabled: user.mfaEnabled ?? false,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.expiresAt = (user as any).expiresAt ? new Date((user as any).expiresAt).toISOString() : null;
        token.mfaEnabled = (user as any).mfaEnabled ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.expiresAt = token.expiresAt as string | null;
        session.user.mfaEnabled = token.mfaEnabled as boolean ?? false;
      }
      return session;
    }
  }
};
