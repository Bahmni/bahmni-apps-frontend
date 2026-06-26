import { useTranslation } from '@bahmni/services';

const AdvancedSearchWidget = () => {
  const { t } = useTranslation();
  return (
    <div
      id="advanced-search-widget"
      data-testid="advanced-search-widget-test-id"
      aria-label="Advanced Search"
    >
      {t('ADVANCED_SEARCH_LABEL')}
    </div>
  );
};

export default AdvancedSearchWidget;
