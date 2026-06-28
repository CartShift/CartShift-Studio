'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useOrg } from '@/lib/context/OrgContext';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { getPortalPath } from '@/lib/utils/portal-paths';

export const REQUEST_PREVIEW_PARAM = 'requestPreview';

interface RequestPreviewContextValue {
  previewRequestId: string | null;
  openRequestPreview: (requestId: string, orgId?: string) => void;
  closeRequestPreview: () => void;
  expandRequestPreview: () => void;
}

const RequestPreviewContext = createContext<RequestPreviewContextValue | null>(null);

function buildPreviewUrl(
  pathname: string,
  searchParams: URLSearchParams,
  requestId: string | null
): string {
  const params = new URLSearchParams(searchParams.toString());
  if (requestId) {
    params.set(REQUEST_PREVIEW_PARAM, requestId);
  } else {
    params.delete(REQUEST_PREVIEW_PARAM);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

interface RequestPreviewProviderProps {
  children: ReactNode;
}

export function RequestPreviewProvider({ children }: RequestPreviewProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { switchOrg } = useOrg();
  const { isAgency } = usePortalAuth();

  const previewRequestId = searchParams.get(REQUEST_PREVIEW_PARAM);

  const openRequestPreview = useCallback(
    (requestId: string, orgId?: string) => {
      if (isAgency && orgId) {
        switchOrg(orgId);
      }
      router.push(buildPreviewUrl(pathname, searchParams, requestId));
    },
    [isAgency, switchOrg, router, pathname, searchParams]
  );

  const closeRequestPreview = useCallback(() => {
    router.push(buildPreviewUrl(pathname, searchParams, null));
  }, [router, pathname, searchParams]);

  const expandRequestPreview = useCallback(() => {
    if (!previewRequestId) return;
    router.push(getPortalPath(`/requests/${previewRequestId}/`));
  }, [router, previewRequestId]);

  const value = useMemo<RequestPreviewContextValue>(
    () => ({
      previewRequestId,
      openRequestPreview,
      closeRequestPreview,
      expandRequestPreview,
    }),
    [previewRequestId, openRequestPreview, closeRequestPreview, expandRequestPreview]
  );

  return (
    <RequestPreviewContext.Provider value={value}>{children}</RequestPreviewContext.Provider>
  );
}

export function useRequestPreview(): RequestPreviewContextValue {
  const context = useContext(RequestPreviewContext);

  if (!context) {
    throw new Error('useRequestPreview must be used within a RequestPreviewProvider');
  }

  return context;
}
