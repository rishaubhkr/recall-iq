import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/upgrade(.*)",
  "/api/webhooks/(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth();

  // Auto-redirect authenticated users away from home/auth pages into the app
  if (userId && (
      request.nextUrl.pathname === "/" || 
      request.nextUrl.pathname.startsWith("/sign-in") || 
      request.nextUrl.pathname.startsWith("/sign-up")
  )) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow all public routes through
  if (isPublicRoute(request)) return NextResponse.next();

  // Unauthenticated → sign-in
  if (!userId) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  if (isAdminRoute(request)) {
    /**
     * Clerk stores Public Metadata in the JWT under the key `publicMetadata`
     * (not `metadata`). Also works if you set a session template with
     * `{ "role": "{{user.public_metadata.role}}" }` at the top level.
     *
     * We check both paths so it works regardless of whether a custom
     * session token template is configured in the Clerk dashboard.
     */
    interface CustomSessionClaims {
      publicMetadata?: { role?: string };
      role?: string;
      metadata?: { role?: string };
      [key: string]: unknown;
    }
    const claims = sessionClaims as CustomSessionClaims | null;

    const role =
      claims?.publicMetadata?.role ??   // default Clerk JWT shape
      claims?.role ??                    // custom session template (top-level)
      claims?.metadata?.role;            // legacy / alternative template

    if (role !== "admin") {
      // Redirect non-admins away from admin routes
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
