/**
 * Sales Analytics Hook
 *
 * TanStack Query hook for fetching sales performance data
 * with caching and automatic background updates.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import {
  getSalesMetrics,
  getClientRevenueData,
  getMonthlyRevenueData,
  getTopClients,
} from '@/lib/services/portal-sales';
import { SalesMetrics, ClientRevenueData, MonthlyRevenue, TopClient } from '@/lib/types/portal';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Hook for fetching comprehensive sales metrics
 */
export function useSalesMetrics() {
  const { loading: auth, isAgency } = usePortalAuth();

  const shouldFetch = !auth && isAgency;

  const {
    data: metrics,
    isLoading: metricsLoading,
    error,
    refetch,
  } = useQuery<SalesMetrics>({
    queryKey: ['sales-metrics'],
    queryFn: getSalesMetrics,
    enabled: Boolean(shouldFetch),
    staleTime: STALE_TIME,
  });

  return {
    metrics,
    loading: auth || (shouldFetch && metricsLoading),
    error: error instanceof Error ? error.message : (error as string | null),
    refetch,
  };
}

/**
 * Hook for fetching per-client revenue data
 */
export function useClientRevenueData() {
  const { loading: auth, isAgency } = usePortalAuth();

  const shouldFetch = !auth && isAgency;

  const {
    data: clients = [],
    isLoading: clientsLoading,
    error,
    refetch,
  } = useQuery<ClientRevenueData[]>({
    queryKey: ['client-revenue-data'],
    queryFn: getClientRevenueData,
    enabled: Boolean(shouldFetch),
    staleTime: STALE_TIME,
  });

  return {
    clients,
    loading: auth || (shouldFetch && clientsLoading),
    error: error instanceof Error ? error.message : (error as string | null),
    refetch,
  };
}

/**
 * Hook for fetching monthly revenue trends
 */
export function useMonthlyRevenue(months: number = 6) {
  const { loading: auth, isAgency } = usePortalAuth();

  const shouldFetch = !auth && isAgency;

  const {
    data: monthlyData = [],
    isLoading: monthlyLoading,
    error,
    refetch,
  } = useQuery<MonthlyRevenue[]>({
    queryKey: ['monthly-revenue', months],
    queryFn: () => getMonthlyRevenueData(months),
    enabled: Boolean(shouldFetch),
    staleTime: STALE_TIME,
  });

  return {
    monthlyData,
    loading: auth || (shouldFetch && monthlyLoading),
    error: error instanceof Error ? error.message : (error as string | null),
    refetch,
  };
}

/**
 * Hook for fetching top performing clients
 */
export function useTopClients(limit: number = 5) {
  const { loading: auth, isAgency } = usePortalAuth();

  const shouldFetch = !auth && isAgency;

  const {
    data: topClients = [],
    isLoading: topClientsLoading,
    error,
    refetch,
  } = useQuery<TopClient[]>({
    queryKey: ['top-clients', limit],
    queryFn: () => getTopClients(limit),
    enabled: Boolean(shouldFetch),
    staleTime: STALE_TIME,
  });

  return {
    topClients,
    loading: auth || (shouldFetch && topClientsLoading),
    error: error instanceof Error ? error.message : (error as string | null),
    refetch,
  };
}

/**
 * Combined hook for fetching all sales analytics data
 * Useful for the main dashboard that needs everything
 */
export function useSalesAnalytics(months: number = 6) {
  const { loading: auth, isAgency } = usePortalAuth();

  const metricsQuery = useSalesMetrics();
  const revenueQuery = useClientRevenueData();
  const monthlyQuery = useMonthlyRevenue(months);
  const topClientsQuery = useTopClients(5);

  const is =
    auth ||
    metricsQuery.loading ||
    revenueQuery.loading ||
    monthlyQuery.loading ||
    topClientsQuery.loading;

  const hasError =
    metricsQuery.error || revenueQuery.error || monthlyQuery.error || topClientsQuery.error;

  return {
    metrics: metricsQuery.metrics,
    clientRevenue: revenueQuery.clients,
    monthlyRevenue: monthlyQuery.monthlyData,
    topClients: topClientsQuery.topClients,
    loading: is,
    error: hasError,
    isAgency,
    refetch: () => {
      metricsQuery.refetch();
      revenueQuery.refetch();
      monthlyQuery.refetch();
      topClientsQuery.refetch();
    },
  };
}
