import {
  Accordion,
  AccordionItem,
  CodeSnippetSkeleton,
  InlineNotification,
  Loading,
} from '@bahmni/design-system';
import {
  dispatchAuditEvent,
  generateUUID,
  getCurrentUserPrivileges,
  getConfig,
  clearRecentSearchCriteria,
  getCurrentUser,
  getRecentSearchCriteria,
  getUserLoginLocation,
  post,
  saveRecentSearchCriteria,
  useTranslation,
  UserLocation,
} from '@bahmni/services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { useNotification } from '../../notification';
import { SearchWidgetProps } from '../models';
import ResultsTable from './components/ResultsTable';
import SearchForm from './components/SearchForm';
import SearchSummary from './components/SearchSummary';
import {
  CurrentSearchState,
  CommonSearchWidgetConfig,
  CriterionRow,
  CursorDirection,
  RecentSearchCriteria,
  SearchContextConfig,
  SearchResponse,
} from './models';
import schema from './schema.json';
import styles from './styles/CommonSearchWidget.module.scss';
import {
  buildPaginationMeta,
  buildPayload,
  extractSearchPage,
  hydrateRecentSearch,
  processContextConfigs,
  resolveRows,
  toSearchAuditEventType,
  validateConfigForActions,
  validateConfigForCriteria,
  validateRows,
} from './utils';

const CommonSearchWidget = ({ extensionParams }: SearchWidgetProps) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();
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
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(true);
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

  const notifySearchFailure = () =>
    addNotification({
      title: t('ERROR_DEFAULT_TITLE'),
      message: t('COMMON_SEARCH_API_ERROR_MESSAGE'),
      type: 'error',
      timeout: 5000,
    });

  const { isLoading: isUserLoading, data: user } = useQuery({
    queryKey: ['commonSearchCurrentUser'],
    queryFn: getCurrentUser,
    enabled: !!config,
    staleTime: Infinity,
  });

  const recentSearchQueryKey = ['recentSearchCriteria', user?.uuid];
  const { data: recentSearch } = useQuery({
    queryKey: recentSearchQueryKey,
    queryFn: () =>
      getRecentSearchCriteria<RecentSearchCriteria['payload']['criteria']>(
        user!,
      ),
    enabled: !!user,
    staleTime: Infinity,
  });

  const saveRecentSearch = useMutation({
    mutationFn: (payload: RecentSearchCriteria['payload']) =>
      saveRecentSearchCriteria(user!.uuid, payload),
    onSuccess: (_, payload) =>
      queryClient.setQueryData<RecentSearchCriteria>(recentSearchQueryKey, {
        version: 1,
        savedAt: new Date().toISOString(),
        payload,
      }),
  });

  const clearRecentSearch = useMutation({
    mutationFn: () => clearRecentSearchCriteria(user!.uuid),
    onSuccess: () => queryClient.setQueryData(recentSearchQueryKey, null),
    onError: notifySearchFailure,
  });

  const configValidationError = useMemo(
    () =>
      config
        ? (validateConfigForActions(config) ??
          validateConfigForCriteria(config))
        : null,
    [config],
  );

  const privilegedContexts = useMemo(
    () => (config ? processContextConfigs(config, userPrivileges ?? null) : []),
    [config, userPrivileges],
  );

  const hydratedSearch = useMemo(
    () => hydrateRecentSearch(recentSearch ?? null, privilegedContexts),
    [recentSearch, privilegedContexts],
  );

  // The form seeds its rows once on mount, so wait for the saved criteria
  // (null when none) before rendering it
  const isRecentSearchPending = !!user && recentSearch === undefined;

  const isLoading =
    isConfigLoading ||
    isPrivilegesLoading ||
    isUserLoading ||
    isRecentSearchPending;
  const error = configError ?? privilegesError ?? configValidationError;

  const runSearch = (
    rows: CriterionRow[],
    context: SearchContextConfig,
    {
      cursor,
      direction,
      currentSet,
      searchId,
    }: {
      cursor: string | null;
      direction?: CursorDirection;
      currentSet: number;
      searchId?: string;
    },
  ) => {
    setIsSearchResultsLoading(true);
    post(
      context.url,
      buildPayload(
        resolveRows(rows, context.criteria),
        context.context,
        context.locationAware ? location?.uuid : undefined,
        buildPaginationMeta(context.batchSize, cursor, direction),
      ),
    )
      .then((data) => {
        if ((data as SearchResponse).error) {
          throw new Error('Search response returned an error');
        }

        const page = extractSearchPage(data);
        setCurrentSearchState((prev) => ({
          context,
          rows,
          results: page.results,
          totalCount: page.totalCount ?? prev?.totalCount ?? 0,
          nextCursor: page.nextCursor,
          prevCursor: page.prevCursor,
          currentSet,
          searchId: searchId ?? prev?.searchId ?? generateUUID(),
        }));

        dispatchAuditEvent({
          eventType: toSearchAuditEventType(context.context),
        });
        if (page.results.length > 0) {
          setIsSearchPanelOpen(false);
        }
      })
      .catch(() => {
        if (searchId) setCurrentSearchState(null);
        notifySearchFailure();
      })
      .finally(() => setIsSearchResultsLoading(false));
  };

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
      if (user) {
        saveRecentSearch.mutate({
          entity: context.context,
          criteria: buildPayload(
            resolveRows(validated, context.criteria),
            context.context,
          ).criteria,
        });
      }
      runSearch(validated, context, {
        cursor: null,
        currentSet: 0,
        searchId: generateUUID(),
      });
    }
    return validated;
  };

  const handleReset = () => {
    lastSearchRef.current = null;
    if (user) clearRecentSearch.mutate();
  };

  const handleSetNavigation = (direction: CursorDirection) => {
    if (!currentSearchState) return;
    const { context, rows, currentSet, nextCursor, prevCursor } =
      currentSearchState;
    const cursor = direction === 'next' ? nextCursor : prevCursor;
    if (!cursor) return;

    runSearch(rows, context, {
      cursor,
      direction,
      currentSet: direction === 'next' ? currentSet + 1 : currentSet - 1,
    });
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
        subtitle={configValidationError ? t(configValidationError) : ''}
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
      <Accordion
        testId="common-search-criteria-accordion"
        aria-label="Common Search Criteria Accordion"
        className={styles.searchCriteriaAccordion}
        align="start"
      >
        <AccordionItem
          title={
            currentSearchState
              ? t('COMMON_SEARCH_MODIFY_SEARCH_BUTTON')
              : t('COMMON_SEARCH_SELECT_SEARCH_CRITERIA')
          }
          open={isSearchPanelOpen}
          onHeadingClick={() => setIsSearchPanelOpen((prev) => !prev)}
          testId="common-search-criteria-accordion-test-id"
          className={styles.searchCriteriaAccordionItem}
        >
          <SearchForm
            config={privilegedContexts}
            location={location}
            onSearch={handleSearch}
            savedRows={lastSearchRef.current?.rows ?? hydratedSearch?.rows}
            savedContextKey={
              lastSearchRef.current?.contextKey ?? hydratedSearch?.contextKey
            }
            onReset={user ? handleReset : undefined}
          />
        </AccordionItem>
      </Accordion>
      {currentSearchState && (
        <>
          <SearchSummary currentSearchState={currentSearchState} />
          <ResultsTable
            resultFields={currentSearchState.context.resultFields}
            results={currentSearchState.results}
            actions={currentSearchState.context.actions}
            totalCount={currentSearchState.totalCount}
            cursorPagination={{
              pageSize: currentSearchState.context.pageSize,
              batchSize: currentSearchState.context.batchSize,
              currentSet: currentSearchState.currentSet,
              searchId: currentSearchState.searchId,
              hasNextSet: currentSearchState.nextCursor !== null,
              hasPreviousSet: currentSearchState.currentSet > 0,
              onSetChange: handleSetNavigation,
            }}
          />
        </>
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
