import { useTranslation } from '@bahmni/services';

const CommonSearchWidget = () => {
  const { t } = useTranslation();
  return (
    <div
      id="common-search-widget"
      data-testid="common-search-widget-test-id"
      aria-label="Common Search"
    >
      {t('COMMON_SEARCH_LABEL')}
    </div>
  );
};

export default CommonSearchWidget;
