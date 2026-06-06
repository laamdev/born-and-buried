import { clerkMiddleware } from "@clerk/nextjs/server";

// Guest play is allowed, so this only *enables* Clerk on every request — it does
// not protect any route. Auth gating happens server-side in Convex mutations.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
