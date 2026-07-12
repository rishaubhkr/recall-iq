"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const [convex] = useState(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      // Before running `npx convex dev`, return a stub
      return null;
    }
    return new ConvexReactClient(url);
  });

  if (!convex) {
    // Render children without Convex until env is configured
    return <>{children}</>;
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
