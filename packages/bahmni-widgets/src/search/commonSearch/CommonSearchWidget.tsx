import { CodeSnippetSkeleton, InlineNotification } from '@bahmni/design-system';
import { getConfig, useTranslation } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { SearchWidgetProps } from '../models';
import { CommonSearchWidgetConfig } from './models';
import schema from './schema.json';
import SearchForm from './SearchForm';
import styles from './styles/CommonSearchWidget.module.scss';

const CommonSearchWidget = ({ extensionParams }: SearchWidgetProps) => {
  const { t } = useTranslation();
  const configUrl = extensionParams?.configUrl as string | undefined;

  const {
    isLoading,
    error,
    data: config,
  } = useQuery({
    queryKey: ['commonSearchWidgetConfig', configUrl],
    queryFn: () => getConfig<CommonSearchWidgetConfig>(configUrl!, schema),
    enabled: !!configUrl,
  });

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

  return (
    <div
      id="common-search-widget"
      data-testid="common-search-widget-test-id"
      aria-label="Common Search"
    >
      <SearchForm config={config} />
    </div>
  );
};

export default CommonSearchWidget;
