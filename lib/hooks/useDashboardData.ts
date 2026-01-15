'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { getRequestsByOrg } from '@/lib/services/portal-requests';
import { getOrgActivities } from '@/lib/services/portal-activities';
import { getMemberByUserId, ensureMembership } from '@/lib/services/portal-organizations';
import { useToast } from '@/components/portal/ui';

export function useDashboardData() {
  const orgId = useResolvedOrgId();
  const { userData, loading: authLoading, isAuthenticated } = usePortalAuth();
  const router = useRouter();
  const toast = useToast();
  const mountedRef = useRef(false);

  // State to track if we've verified/ensured membership for clients
  const [membershipChecked, setMembershipChecked] = useState(false);
  const [membershipError, setMembershipError] = useState<string | null>(null);

  const isAgency = userData?.isAgency || false;
  const shouldFetchData = isAuthenticated && orgId && (isAgency || membershipChecked);

  // Effect to handle membership verification for clients
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (
      !orgId ||
      typeof orgId !== 'string' ||
      authLoading ||
      !userData ||
      isAgency ||
      membershipChecked ||
      !mountedRef.current
    ) {
      return;
    }

    const verifyMembership = async () => {
      try {
        let member = await getMemberByUserId(orgId, userData.id);

        if (!member) {
          // Attempt to fix membership if missing
          try {
            member = await ensureMembership(orgId, userData.id, userData.email, userData.name);
          } catch (err) {
            console.error('Failed to ensure membership:', err);
          }
        }

        // Check mounted state before updating
        if (!mountedRef.current) return;

        if (member) {
          setMembershipChecked(true);
          setMembershipError(null);
        } else {
          console.warn(`Access denied - No membership found for orgId: ${orgId}`);
          setMembershipError('access_denied');
        }
      } catch (err) {
        if (mountedRef.current) {
          console.error('Error checking membership:', err);
          setMembershipError('membership_check_failed');
        }
      }
    };

    verifyMembership();
  }, [orgId, userData, authLoading, isAgency, membershipChecked]);

  // 1. Requests Query
  const {
    data: requests = [],
    isLoading: requestsLoading,
    error: requestsError,
  } = useQuery({
    queryKey: ['org-requests', orgId],
    queryFn: () => getRequestsByOrg(orgId as string),
    enabled: Boolean(shouldFetchData),
    staleTime: 60000, // Consider data fresh for 60 seconds
    refetchInterval: 120000, // Refresh every 2 minutes
    retry: (failureCount, error) => {
      // Show user feedback on permission errors and redirect
      if (error instanceof Error && error.message.includes('Permission denied')) {
        toast.error('Access Denied', 'You do not have permission to view this organization');
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/portal/dashboard');
        }, 2000);
        return false;
      }
      // Limit retries for other errors
      return failureCount < 2;
    },
  });

  // 2. Activities Query
  const {
    data: activities = [],
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useQuery({
    queryKey: ['org-activities', orgId],
    queryFn: () => getOrgActivities(orgId as string),
    enabled: Boolean(shouldFetchData),
    staleTime: 60000, // Consider data fresh for 60 seconds
    refetchInterval: 120000, // Refresh every 2 minutes
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('Permission denied')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const loading =
    authLoading ||
    (shouldFetchData && (requestsLoading || activitiesLoading)) ||
    (!isAgency && !membershipChecked && !membershipError);

  const error =
    membershipError ||
    (requestsError instanceof Error ? requestsError.message : null) ||
    (activitiesError instanceof Error ? activitiesError.message : null);

  return {
    requests,
    activities,
    loading,
    error,
    userData,
    orgId,
  };
}
