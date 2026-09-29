import { getConfig } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, REPORTS_JSON_CONFIG_URL } from '../constants';
import type { ReportsConfig } from '../models';
import schema from '../schema.json';

export const useReportsConfig = () =>
  useQuery({
    queryKey: QUERY_KEYS.reportsConfig,
    queryFn: () => getConfig<ReportsConfig>(REPORTS_JSON_CONFIG_URL, schema),
  });
