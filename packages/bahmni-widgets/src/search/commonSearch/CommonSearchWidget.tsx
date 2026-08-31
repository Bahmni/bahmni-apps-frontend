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
  getUserLoginLocation,
  post,
  useTranslation,
  UserLocation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
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
  SearchContextConfig,
  SearchResponse,
} from './models';
import schema from './schema.json';
import styles from './styles/CommonSearchWidget.module.scss';
import {
  buildPaginationMeta,
  buildPayload,
  extractSearchPage,
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

  const configValidationError = useMemo(
    () =>
      config
        ? (validateConfigForActions(config) ??
          validateConfigForCriteria(config))
        : null,
    [config],
  );

  const isLoading = isConfigLoading || isPrivilegesLoading;
  const error = configError ?? privilegesError ?? configValidationError;

  const notifySearchFailure = () =>
    addNotification({
      title: t('ERROR_DEFAULT_TITLE'),
      message: t('COMMON_SEARCH_API_ERROR_MESSAGE'),
      type: 'error',
      timeout: 5000,
    });

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
      runSearch(validated, context, {
        cursor: null,
        currentSet: 0,
        searchId: generateUUID(),
      });
    }
    return validated;
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

  const privilegedContexts = processContextConfigs(
    config,
    userPrivileges ?? null,
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
            savedRows={lastSearchRef.current?.rows}
            savedContextKey={lastSearchRef.current?.contextKey}
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
