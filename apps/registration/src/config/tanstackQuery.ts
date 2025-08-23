import { QueryClientConfig } from '@tanstack/react-query';

export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 30,
      refetchOnMount: 'always',
      refetchOnReconnect: 'always',
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 2,
    },
  },
};
