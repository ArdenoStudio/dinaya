import type { DefaultSession } from "next-auth";
import type { roleEnum } from "@/db/schema";

type UserRole = (typeof roleEnum.enumValues)[number];

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      businessId: string;
      role: UserRole;
      impersonatedBy?: string;
      readOnlyImpersonation?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    businessId: string;
    role: UserRole;
    impersonatedBy?: string;
    readOnlyImpersonation?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    businessId?: string;
    role?: UserRole;
    impersonatedBy?: string;
    readOnlyImpersonation?: boolean;
  }
}
