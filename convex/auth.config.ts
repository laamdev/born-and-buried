// Tells the Convex backend to trust JWTs issued by Clerk. CLERK_JWT_ISSUER_DOMAIN
// must be set in the Convex deployment environment (npx convex env set ...),
// because this file runs on Convex, not in Next.js.
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
