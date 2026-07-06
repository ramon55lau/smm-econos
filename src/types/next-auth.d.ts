import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      expiresAt?: string | null;
      mfaEnabled?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    expiresAt?: Date | string | null;
    mfaEnabled?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    expiresAt?: string | null;
    mfaEnabled?: boolean;
  }
}
