"use client";

import { useEffect } from "react";
import { useScrollDepthTracking, useOutboundLinkTracking, useEngagementTracking } from "@/lib/hooks/useAnalytics";
import { trackError } from "@/lib/analytics";

interface AnalyticsProviderProps {
  children: React.ReactNode;
  enableScrollTracking?: boolean;
  enableOutboundTracking?: boolean;
  enableEngagementTracking?: boolean;
  enableErrorTracking?: boolean;
}

export function AnalyticsProvider({
  children,
  enableScrollTracking = true,
  enableOutboundTracking = true,
  enableEngagementTracking = true,
  enableErrorTracking = true,
}: AnalyticsProviderProps) {
  if (enableScrollTracking) useScrollDepthTracking();
  if (enableOutboundTracking) useOutboundLinkTracking();
  if (enableEngagementTracking) useEngagementTracking();

  useEffect(() => {
    if (!enableErrorTracking) return;

    const handleError = (event: ErrorEvent) => {
      trackError(event.message, event.filename);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(String(event.reason), "unhandled_promise");
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [enableErrorTracking]);

  return <>{children}</>;
}
