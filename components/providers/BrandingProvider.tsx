'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import {
  getGlobalBranding,
  getAgencyBranding,
  getOrganizationAgencyBranding,
} from '@/lib/services/portal-branding';
import { applyTheme } from '@/lib/utils/theme-generator';
import { Organization } from '@/lib/types/portal';

interface BrandingContextType {
  branding: Organization['branding'] | null;
  loading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: null,
  loading: true,
});

export const useBranding = () => useContext(BrandingContext);

const BRANDING_RADIUS_VALUES = ['0px', '0.5rem', '1rem'] as const;
type BrandingRadius = (typeof BRANDING_RADIUS_VALUES)[number];

function parseStoredRadius(value: string | null): BrandingRadius | undefined {
  if (value && (BRANDING_RADIUS_VALUES as readonly string[]).includes(value)) {
    return value as BrandingRadius;
  }
  return undefined;
}

function isPermissionDeniedError(error: unknown): boolean {
  if (error instanceof FirebaseError) {
    return error.code === 'permission-denied';
  }
  if (error instanceof Error) {
    return (
      error.message.includes('permission') ||
      error.message.includes('Missing or insufficient permissions')
    );
  }
  return false;
}

function isClientSideInitError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('client side');
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { user, userData } = usePortalAuth();
  const [branding, setBranding] = useState<Organization['branding'] | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cartshift_cached_branding');
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, set] = useState(() => !branding);

  useEffect(() => {
    // Early return for SSR - prevent all client-side code from running
    if (typeof window === 'undefined') {
      set(false);
      return;
    }

    // 1. Try to load from Local Storage immediately (Fastest) for Colors
    try {
      const storedPrimary = localStorage.getItem('agency_branding_primary');
      const storedAccent = localStorage.getItem('agency_branding_accent');
      const storedFontEn = localStorage.getItem('agency_branding_font_en');
      const storedFontHe = localStorage.getItem('agency_branding_font_he');
      const storedRadius = localStorage.getItem('agency_branding_radius');

      if (storedPrimary || storedAccent || storedFontEn || storedFontHe || storedRadius) {
        applyTheme(
          storedPrimary || undefined,
          storedAccent || undefined,
          storedFontEn || undefined,
          storedRadius ? parseStoredRadius(storedRadius) : undefined,
          storedFontHe || undefined
        );
      }
    } catch (e) {
      console.error('Error loading branding from local storage', e);
    }

    // 2. Load theme from Services (for authenticated users or guests)
    async function loadTheme() {
      try {
        // If no user, we load GLOBAL/PUBLIC branding if it exists (for site visitors)
        // This supports the "all users on the website" requirement.
        if (!user?.uid) {
          try {
            // Fetch global branding
            const data = await getGlobalBranding();
            if (data) {
              setBranding(data);
              localStorage.setItem('cartshift_cached_branding', JSON.stringify(data));
              const {
                primaryColor,
                accentColor,
                fontFamily,
                fontFamilyEn,
                fontFamilyHe,
                borderRadius,
              } = data;
              applyTheme(
                primaryColor,
                accentColor,
                fontFamilyEn || fontFamily,
                borderRadius,
                fontFamilyHe
              );
            }
          } catch (e: unknown) {
            if (!isPermissionDeniedError(e)) {
              console.log('No global branding found or accessible:', e);
            }
          } finally {
            set(false);
          }
          return;
        }

        try {
          const isAgencyUser = userData?.isAgency || userData?.accountType === 'AGENCY';

          if (isAgencyUser) {
            const data = await getAgencyBranding(user.uid);
            if (data) {
              setBranding(data);
              localStorage.setItem('cartshift_cached_branding', JSON.stringify(data));
              const {
                primaryColor,
                accentColor,
                fontFamily,
                fontFamilyEn,
                fontFamilyHe,
                borderRadius,
              } = data;
              applyTheme(
                primaryColor,
                accentColor,
                fontFamilyEn || fontFamily,
                borderRadius,
                fontFamilyHe
              );
            }
          } else {
            // Client User: Find Agency they belong to
            // 1. Try to get active org from session
            let targetOrgId =
              typeof window !== 'undefined'
                ? sessionStorage.getItem('cartshift_current_org_id')
                : null;

            // 2. Fallback to first org if no active org
            if (!targetOrgId && (userData?.organizations?.length ?? 0) > 0) {
              targetOrgId = userData!.organizations![0];
            }

            if (targetOrgId) {
              // Fetch Organization to find Agency (Creator)
              const data = await getOrganizationAgencyBranding(targetOrgId);
              if (data) {
                setBranding(data);
                localStorage.setItem('cartshift_cached_branding', JSON.stringify(data));
                const {
                  primaryColor,
                  accentColor,
                  fontFamily,
                  fontFamilyEn,
                  fontFamilyHe,
                  borderRadius,
                } = data;
                applyTheme(
                  primaryColor,
                  accentColor,
                  fontFamilyEn || fontFamily,
                  borderRadius,
                  fontFamilyHe
                );
              }
            }
          }
        } catch (error: unknown) {
          if (!isPermissionDeniedError(error)) {
            console.error('Failed to load portal theme:', error);
          }
        } finally {
          set(false);
        }
      } catch (error: unknown) {
        if (isClientSideInitError(error)) {
          set(false);
          return;
        }
        console.error('Failed to initialize Firestore for branding:', error);
        set(false);
      }
    }

    // Call loadTheme for both authenticated and guest users
    loadTheme();
  }, [user, userData]);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>{children}</BrandingContext.Provider>
  );
}
