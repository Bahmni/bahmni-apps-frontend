import { QueryClientConfig } from '@tanstack/react-query';

export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 30,
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: 'always',
      refetchInterval: 1000 * 30,
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 2,
    },
  },
};
