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
import { queryKeys } from '@/lib/utils/query-keys';

const STALE_TIME = 5 * 60 * 1000;

export function useSalesMetrics() {
  const { loading: auth, isAgency } = usePortalAuth();
  const shouldFetch = !auth && isAgency;

  const {
    data: metrics,
    isLoading: metricsLoading,
    error,
    refetch,
  } = useQuery<SalesMetrics>({
    queryKey: queryKeys.sales.metrics,
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

export function useClientRevenueData() {
  const { loading: auth, isAgency } = usePortalAuth();
  const shouldFetch = !auth && isAgency;

  const {
    data: clients = [],
    isLoading: clientsLoading,
    error,
    refetch,
  } = useQuery<ClientRevenueData[]>({
    queryKey: queryKeys.sales.clientRevenue,
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

export function useMonthlyRevenue(months: number = 6) {
  const { loading: auth, isAgency } = usePortalAuth();
  const shouldFetch = !auth && isAgency;

  const {
    data: monthlyData = [],
    isLoading: monthlyLoading,
    error,
    refetch,
  } = useQuery<MonthlyRevenue[]>({
    queryKey: queryKeys.sales.monthlyRevenue(months),
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

export function useTopClients(limit: number = 5) {
  const { loading: auth, isAgency } = usePortalAuth();
  const shouldFetch = !auth && isAgency;

  const {
    data: topClients = [],
    isLoading: topClientsLoading,
    error,
    refetch,
  } = useQuery<TopClient[]>({
    queryKey: queryKeys.sales.topClients(limit),
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

export function useSalesAnalytics(months: number = 6) {
  const { loading: auth, isAgency } = usePortalAuth();

  const metricsQuery = useSalesMetrics();
  const revenueQuery = useClientRevenueData();
  const monthlyQuery = useMonthlyRevenue(months);
  const topClientsQuery = useTopClients(5);

  const loading =
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
    loading,
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
