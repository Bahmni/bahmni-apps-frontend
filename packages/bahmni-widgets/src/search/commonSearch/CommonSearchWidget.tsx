import { CodeSnippetSkeleton, InlineNotification } from '@bahmni/design-system';
import {
  getCurrentUserPrivileges,
  getConfig,
  getUserLoginLocation,
  hasPrivilege,
  useTranslation,
  UserLocation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNotification } from '../../notification';
import { SearchWidgetProps } from '../models';
import {
  CommonSearchWidgetConfig,
  CriterionConfig,
  CriterionRow,
} from './models';
import schema from './schema.json';
import SearchForm from './SearchForm';
import styles from './styles/CommonSearchWidget.module.scss';
import { validateRows } from './utils';

const CommonSearchWidget = ({ extensionParams }: SearchWidgetProps) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const configUrl = extensionParams?.configUrl as string | undefined;
  const [location] = useState<UserLocation | null>(() => {
    try {
      return getUserLoginLocation();
    } catch {
      return null;
    }
  });

  const {
    isLoading: isConfigLoading,
    error: configError,
    data: config,
  } = useQuery({
    queryKey: ['commonSearchWidgetConfig', configUrl],
    queryFn: () => getConfig<CommonSearchWidgetConfig>(configUrl!, schema),
    enabled: !!configUrl,
  });

  const {
    isLoading: isPrivilegesLoading,
    error: privilegesError,
    data: userPrivileges,
  } = useQuery({
    queryKey: ['currentUserPrivileges'],
    queryFn: getCurrentUserPrivileges,
    enabled: !!config,
  });

  const isLoading = isConfigLoading || isPrivilegesLoading;
  const error = configError ?? privilegesError;

  const handleSearch = (
    rows: CriterionRow[],
    criteria: CriterionConfig[],
  ): CriterionRow[] => {
    const validated = validateRows(
      rows,
      criteria,
      t('COMMON_SEARCH_CRITERION_REQUIRED'),
      t('COMMON_SEARCH_VALUE_REQUIRED'),
      t('COMMON_SEARCH_RANGE_ORDER_INVALID'),
    );
    if (!validated.some((r) => r.validationError ?? r.rangeOrderError)) {
      addNotification({
        title: t('COMMON_SEARCH_SUCCESS'),
        message: t('COMMON_SEARCH_SUCCESS_MESSAGE'),
        type: 'success',
        timeout: 3000,
      });
    }
    return validated;
  };

  if (isLoading)
    return (
      <CodeSnippetSkeleton
        id="common-search-config-loading"
        testId="common-search-config-loading-test-id"
        className={styles.fullWidth}
        type="multi"
      />
    );

  if (error || !configUrl || !config)
    return (
      <InlineNotification
        id="common-search-config-error"
        testId="common-search-config-error-test-id"
        kind="error"
        lowContrast
        title={t('COMMON_SEARCH_CONFIG_ERROR')}
        className={styles.fullWidth}
      />
    );

  if (!location)
    return (
      <InlineNotification
        id="common-search-no-location-error"
        testId="common-search-no-location-error-test-id"
        kind="error"
        lowContrast
        title={t('COMMON_SEARCH_NO_LOCATION_ERROR')}
        className={styles.fullWidth}
      />
    );

  const privilegedContexts = config.filter((c) =>
    hasPrivilege(userPrivileges ?? null, c.requiredPrivileges),
  );

  if (privilegedContexts.length === 0)
    return (
      <InlineNotification
        id="common-search-no-privilege-error"
        testId="common-search-no-privilege-error-test-id"
        kind="error"
        lowContrast
        title={t('COMMON_SEARCH_NO_PRIVILEGE_ERROR')}
        className={styles.fullWidth}
      />
    );

  return (
    <div
      id="common-search-widget"
      data-testid="common-search-widget-test-id"
      aria-label="Common Search"
    >
      <SearchForm
        config={privilegedContexts}
        location={location}
        onSearch={handleSearch}
      />
    </div>
  );
};

export default CommonSearchWidget;
