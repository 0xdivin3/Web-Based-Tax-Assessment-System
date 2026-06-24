import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      tin?: string | null;
    } & DefaultSession["user"];
  }
}
