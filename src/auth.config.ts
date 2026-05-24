import type { NextAuthConfig } from "next-auth";
import { resolveAuthRedirect } from "@/lib/auth-redirect";

/**
 * Edge-safe auth config shared by middleware and the full NextAuth instance.
 * Keep this file free of Node-only imports (db, bcrypt, node:crypto, etc.).
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [],
  callbacks: {
    redirect({ url, baseUrl }) {
      return resolveAuthRedirect(url, baseUrl);
    },
    jwt({ token, user }) {
      if (user) {
        token.businessId = user.businessId;
        token.role = user.role;
        token.impersonatedBy = user.impersonatedBy;
        token.readOnlyImpersonation = user.readOnlyImpersonation;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.sub ?? "";
        session.user.businessId =
          typeof token.businessId === "string" ? token.businessId : "";
        session.user.role = token.role === "owner" ? "owner" : "staff";
        session.user.impersonatedBy =
          typeof token.impersonatedBy === "string" ? token.impersonatedBy : undefined;
        session.user.readOnlyImpersonation = Boolean(token.readOnlyImpersonation);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
