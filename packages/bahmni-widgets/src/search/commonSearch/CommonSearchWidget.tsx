import {
  CodeSnippetSkeleton,
  InlineNotification,
  Loading,
} from '@bahmni/design-system';
import {
  getCurrentUserPrivileges,
  getConfig,
  getUserLoginLocation,
  hasPrivilege,
  useTranslation,
  UserLocation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useNotification } from '../../notification';
import { SearchWidgetProps } from '../models';
import { post } from './api';
import {
  CurrentSearchState,
  CommonSearchWidgetConfig,
  CriterionRow,
  SearchContextConfig,
} from './models';
import ResultsTable from './ResultsTable';
import schema from './schema.json';
import SearchForm from './SearchForm';
import SearchSummary from './SearchSummary';
import styles from './styles/CommonSearchWidget.module.scss';
import {
  buildPayload,
  hasDuplicateSortPriority,
  resolveRows,
  validateRows,
} from './utils';

const CommonSearchWidget = ({ extensionParams }: SearchWidgetProps) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const configUrl = extensionParams?.configUrl as string | undefined;
  const [isSearchResultsLoading, setIsSearchResultsLoading] = useState(false);
  const [location] = useState<UserLocation | null>(() => {
    try {
      return getUserLoginLocation();
    } catch {
      return null;
    }
  });
  const [currentSearchState, setCurrentSearchState] =
    useState<CurrentSearchState | null>(null);
  const lastSearchRef = useRef<{
    rows: CriterionRow[];
    contextKey: SearchContextConfig['context'];
  } | null>(null);

  const {
    isLoading: isConfigLoading,
    error: configError,
    data: config,
  } = useQuery({
    queryKey: ['commonSearchWidgetConfig', configUrl],
    queryFn: () =>
      getConfig<CommonSearchWidgetConfig>(configUrl!, schema).then((cfg) => {
        if (
          cfg.some((context) => hasDuplicateSortPriority(context.resultFields))
        ) {
          throw new Error(
            'Common Search config error: duplicate sortPriority values in resultFields',
          );
        }
        return cfg;
      }),
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
    context: SearchContextConfig,
  ): CriterionRow[] => {
    const validated = validateRows(
      rows,
      context.criteria,
      t('COMMON_SEARCH_CRITERION_REQUIRED'),
      t('COMMON_SEARCH_VALUE_REQUIRED'),
      t('COMMON_SEARCH_RANGE_ORDER_INVALID'),
      t,
    );
    if (!validated.some((r) => r.validationError ?? r.rangeOrderError)) {
      lastSearchRef.current = { rows: validated, contextKey: context.context };
      setCurrentSearchState({
        context,
        rows: validated,
        resultFields: context.resultFields,
        results: [],
      });
      setIsSearchResultsLoading(true);
      post(
        context.url,
        buildPayload(resolveRows(validated, context.criteria), context.context),
      )
        .then((data) => {
          setCurrentSearchState((prev: CurrentSearchState | null) =>
            prev
              ? {
                  ...prev,
                  results: (data as { results: unknown[] }).results,
                }
              : null,
          );
          setIsSearchResultsLoading(false);
        })
        .catch(() => {
          setCurrentSearchState((prev: CurrentSearchState | null) =>
            prev
              ? {
                  ...prev,
                }
              : null,
          );
          setIsSearchResultsLoading(false);
          addNotification({
            title: t('ERROR_DEFAULT_TITLE'),
            message: t('COMMON_SEARCH_API_ERROR_MESSAGE'),
            type: 'error',
            timeout: 5000,
          });
        });
    }
    return validated;
  };

  const handleModifySearch = () => {
    setCurrentSearchState(null);
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
      {!isSearchResultsLoading && currentSearchState ? (
        <>
          <SearchSummary
            currentSearchState={currentSearchState}
            onModifySearch={handleModifySearch}
          />
          <ResultsTable
            resultFields={currentSearchState.resultFields}
            results={currentSearchState.results}
          />
        </>
      ) : (
        <SearchForm
          config={privilegedContexts}
          location={location}
          onSearch={handleSearch}
          savedRows={lastSearchRef.current?.rows}
          savedContextKey={lastSearchRef.current?.contextKey}
        />
      )}
      {isSearchResultsLoading && (
        <div
          id="common-search-loading-overlay"
          data-testid="common-search-loading-overlay-test-id"
        >
          <Loading active withOverlay />
        </div>
      )}
    </div>
  );
};

export default CommonSearchWidget;
