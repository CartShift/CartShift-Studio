'use client';

import { useEffect, useRef } from 'react';
import { useOrganization } from '@/lib/hooks/useOrganization';
import { useWorkspaceSettingsMutations } from '@/lib/hooks/useWorkspaceSettingsMutations';
import { validateStorageRules } from '@/lib/services/portal-uploads';
import type { OrganizationFormData } from '@/components/portal/settings/workspace/GeneralSettingsTab';

function orgToFormData(org: NonNullable<ReturnType<typeof useOrganization>['organization']>): OrganizationFormData {
  return {
    name: org.name || '',
    website: org.website || '',
    industry: org.industry || '',
    bio: org.bio || '',
    billingName: org.billingName || '',
    billingEmail: org.billingEmail || '',
    billingTaxId: org.billingTaxId || '',
    billingAddressLine1: org.billingAddressLine1 || '',
    billingAddressLine2: org.billingAddressLine2 || '',
    billingCity: org.billingCity || '',
    billingCountry: org.billingCountry || '',
    billingPostalCode: org.billingPostalCode || '',
  };
}

export function useWorkspaceSettings(orgId: string | undefined) {
  const safeOrgId = typeof orgId === 'string' ? orgId : '';
  const { organization, loading, error, refetch } = useOrganization(safeOrgId, {
    enabled: Boolean(safeOrgId),
  });
  const mutations = useWorkspaceSettingsMutations(safeOrgId);
  const { regenerateLogo } = mutations;
  const logoFixedRef = useRef<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    validateStorageRules().then(valid => {
      if (!valid) console.warn('[settings] Storage rules validation failed');
    });
  }, []);

  useEffect(() => {
    if (!organization?.logoUrl || !safeOrgId || logoFixedRef.current === organization.logoUrl) {
      return;
    }

    try {
      const urlObj = new URL(organization.logoUrl);
      const isPublicUrl = urlObj.searchParams.has('alt') && !urlObj.searchParams.has('token');
      const isBrokenUrl = urlObj.hostname === 'firebasestorage.googleapis.com' && isPublicUrl;

      if (isBrokenUrl) {
        logoFixedRef.current = organization.logoUrl;
        regenerateLogo({ orgId: safeOrgId, logoUrl: organization.logoUrl, updateFirestore: true }).catch(
          err => console.warn('Failed to regenerate logo URL:', err)
        );
      }
    } catch {
      // ignore invalid URLs
    }
  }, [organization?.logoUrl, safeOrgId, regenerateLogo]);

  return {
    organization,
    loading: !safeOrgId ? false : loading,
    error,
    orgToFormData,
    refetchOrganization: refetch,
    ...mutations,
  };
}
