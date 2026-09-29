import { getConfig } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import appConfigSchema from '../appConfigSchema.json';
import { QUERY_KEYS, REPORTS_APP_CONFIG_URL } from '../constants';
import type { ReportsAppConfig } from '../models';

export const useReportsAppConfig = () =>
  useQuery({
    queryKey: QUERY_KEYS.reportsAppConfig,
    queryFn: async () => {
      try {
        return await getConfig<ReportsAppConfig>(
          REPORTS_APP_CONFIG_URL,
          appConfigSchema,
        );
      } catch {
        // Non-fatal: fall back to empty config (all formats enabled by default)
        return {};
      }
    },
  });
