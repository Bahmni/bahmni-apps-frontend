import { QueryClient } from '@tanstack/react-query';
import { queryClientConfig } from './tanstackQuery';

export const queryClient = new QueryClient(queryClientConfig);
