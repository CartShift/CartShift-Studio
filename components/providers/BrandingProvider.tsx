'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
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

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { user, userData } = usePortalAuth();
  const [branding, setBranding] = useState<Organization['branding'] | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cartshift_cached_branding');
        return cached ? JSON.parse(cached) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => !branding);

  useEffect(() => {
    // Early return for SSR - prevent all client-side code from running
    if (typeof window === 'undefined') {
      setLoading(false);
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
          storedRadius as any,
          storedFontHe || undefined
        );
      }
    } catch (e) {
      console.error('Error loading branding from local storage', e);
    }

    // 2. Load theme from Firestore (for authenticated users or guests)
    async function loadTheme() {
      try {
        const db = getFirestoreDb();

        // If no user, we load GLOBAL/PUBLIC branding if it exists (for site visitors)
        // This supports the "all users on the website" requirement.
        if (!user?.uid) {
          try {
            // Fetch global branding
            const globalDoc = await getDoc(doc(db, 'system_settings', 'branding'));
            if (globalDoc.exists()) {
              const data = globalDoc.data() as Organization['branding'];
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
          } catch (e: any) {
            // Silently handle permission errors for global branding (expected if not public)
            if (e?.code !== 'permission-denied' && !e?.message?.includes('permission')) {
              console.log('No global branding found or accessible:', e);
            }
          } finally {
            setLoading(false);
          }
          return;
        }

        try {
          const isAgencyUser = userData?.isAgency || userData?.accountType === 'AGENCY';

          if (isAgencyUser) {
            const agencyDoc = await getDoc(doc(db, 'agencies', user.uid));
            if (agencyDoc.exists()) {
              const data = agencyDoc.data();
              if (data.branding) {
                setBranding(data.branding);
                localStorage.setItem('cartshift_cached_branding', JSON.stringify(data.branding));
                const {
                  primaryColor,
                  accentColor,
                  fontFamily,
                  fontFamilyEn,
                  fontFamilyHe,
                  borderRadius,
                } = data.branding;
                applyTheme(
                  primaryColor,
                  accentColor,
                  fontFamilyEn || fontFamily,
                  borderRadius,
                  fontFamilyHe
                );
              }
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
              const orgDoc = await getDoc(doc(db, 'portal_organizations', targetOrgId));
              if (orgDoc.exists()) {
                const orgData = orgDoc.data();
                const agencyId = orgData.createdBy; // The Agency Owner ID

                if (agencyId) {
                  // Fetch Agency Branding
                  const agencyDoc = await getDoc(doc(db, 'agencies', agencyId));
                  if (agencyDoc.exists()) {
                    const data = agencyDoc.data();
                    if (data.branding) {
                      setBranding(data.branding);
                      localStorage.setItem(
                        'cartshift_cached_branding',
                        JSON.stringify(data.branding)
                      );
                      const {
                        primaryColor,
                        accentColor,
                        fontFamily,
                        fontFamilyEn,
                        fontFamilyHe,
                        borderRadius,
                      } = data.branding;
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
              }
            }
          }
        } catch (error: any) {
          // Handle permission errors gracefully - user might not have access yet
          const isPermissionError =
            error?.code === 'permission-denied' ||
            error?.message?.includes('Missing or insufficient permissions') ||
            error?.message?.includes('permission');

          if (!isPermissionError) {
            console.error('Failed to load portal theme:', error);
          }
          // Permission errors are expected if user doesn't have org membership yet
        } finally {
          setLoading(false);
        }
      } catch (error: any) {
        // Handle Firebase initialization errors (e.g., during build/SSR)
        if (error?.message?.includes('client side')) {
          // Expected during SSR - ignore
          setLoading(false);
          return;
        }
        console.error('Failed to initialize Firestore for branding:', error);
        setLoading(false);
      }
    }

    // Call loadTheme for both authenticated and guest users
    loadTheme();
  }, [user, userData]);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>{children}</BrandingContext.Provider>
  );
}
