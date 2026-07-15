import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      expiresAt?: string | null;
      createdAt?: string | null;
      mfaEnabled?: boolean;
      packageName?: string;
      impersonator?: {
        id: string;
        name: string;
        email: string;
        role: string;
      } | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    expiresAt?: Date | string | null;
    createdAt?: Date | string | null;
    mfaEnabled?: boolean;
    packageName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    expiresAt?: string | null;
    createdAt?: string | null;
    mfaEnabled?: boolean;
    packageName?: string;
    impersonator?: {
      id: string;
      name: string;
      email: string;
      role: string;
    } | null;
  }
}
