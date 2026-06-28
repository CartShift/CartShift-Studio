import { isServer, QueryClient } from '@tanstack/react-query';

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getAppQueryClient() {
  if (isServer) {
    return createAppQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = createAppQueryClient();
  }

  return browserQueryClient;
}
