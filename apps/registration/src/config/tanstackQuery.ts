import { QueryClientConfig } from '@tanstack/react-query';

export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: false,
    },
  },
};
