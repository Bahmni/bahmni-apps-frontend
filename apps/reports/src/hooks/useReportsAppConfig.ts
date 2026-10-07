import { getConfig } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import appConfigSchema from '../components/ReportList/appConfigSchema.json';
import { QUERY_KEYS } from '../components/ReportList/constants';
import type { ReportsAppConfig } from '../components/ReportList/models';
import { REPORTS_APP_CONFIG_URL } from '../constants/app';

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
