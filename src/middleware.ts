import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (
      (pathname.startsWith("/dashboard") ||
        pathname.startsWith("/file-return") ||
        pathname.startsWith("/calculator") ||
        pathname.startsWith("/payment") ||
        pathname.startsWith("/certificate") ||
        pathname.startsWith("/history")) &&
      role === "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        const publicPaths = ["/", "/login", "/register"];
        if (publicPaths.includes(pathname)) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};