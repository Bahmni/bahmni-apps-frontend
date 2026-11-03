import { getConfig } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../components/ReportList/constants';
import type { ReportsConfig } from '../components/ReportList/models';
import schema from '../components/ReportList/schema.json';
import { REPORTS_JSON_CONFIG_URL } from '../constants/app';

export const useReportsConfig = () =>
  useQuery({
    queryKey: QUERY_KEYS.reportsConfig,
    queryFn: () => getConfig<ReportsConfig>(REPORTS_JSON_CONFIG_URL, schema),
    retry: false,
  });
