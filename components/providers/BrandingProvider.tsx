'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  const [branding, setBranding] = useState<Organization['branding'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try to load from Local Storage immediately (Fastest) for Colors
    if (typeof window !== 'undefined') {
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
    }

    async function loadTheme() {
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
        } catch (e) {
          console.log('No global branding found or accessible:', e);
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

              // Update cache
              if (primaryColor) localStorage.setItem('agency_branding_primary', primaryColor);
              if (accentColor) localStorage.setItem('agency_branding_accent', accentColor);
              if (fontFamilyEn || fontFamily)
                localStorage.setItem('agency_branding_font_en', (fontFamilyEn || fontFamily)!);
              if (fontFamilyHe) localStorage.setItem('agency_branding_font_he', fontFamilyHe);
              if (borderRadius) localStorage.setItem('agency_branding_radius', borderRadius);
            }
          }
        } else {
          // Client User: Find the Agency they belong to
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
            // Fetch Organization to find the Agency (Creator)
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
                    // Note: We don't cache agency branding in localStorage for clients as aggressively
                    // because they might switch agencies (if they belong to multiple).
                    // But strictly speaking, caching is fine if we keyed it by Agency ID, but simple keys differ.
                    // For now, let's cache it to keep the UI consistent on refresh.
                    if (primaryColor) localStorage.setItem('agency_branding_primary', primaryColor);
                    if (accentColor) localStorage.setItem('agency_branding_accent', accentColor);
                    if (fontFamilyEn || fontFamily)
                      localStorage.setItem(
                        'agency_branding_font_en',
                        (fontFamilyEn || fontFamily)!
                      );
                    if (fontFamilyHe) localStorage.setItem('agency_branding_font_he', fontFamilyHe);
                    if (borderRadius) localStorage.setItem('agency_branding_radius', borderRadius);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load portal theme:', error);
      } finally {
        setLoading(false);
      }
    }

    if (userData) {
      loadTheme();
    } else {
      // Also try to load theme if NOT authenticated (guest)
      loadTheme();
    }
  }, [user, userData]);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>{children}</BrandingContext.Provider>
  );
}
