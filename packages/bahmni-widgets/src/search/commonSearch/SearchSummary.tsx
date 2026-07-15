import { Button, Edit, Tag } from '@bahmni/design-system';
import { formatDateTime, useTranslation } from '@bahmni/services';
import {
  ActiveSearchState,
  CriterionConfig,
  CriterionValue,
  InputConfig,
} from './models';
import styles from './styles/CommonSearchWidget.module.scss';

interface SearchSummaryProps {
  activeSearchState: ActiveSearchState;
  onModifySearch: () => void;
}

const formatValue = (value: CriterionValue, input: InputConfig): string => {
  if ('value' in value) return value.value;

  if (input.kind === 'date') {
    const from = formatDateTime(value.from.value!).formattedResult;
    if (!value.to?.value) return from;
    const to = formatDateTime(value.to.value).formattedResult;
    return `${from} to ${to}`;
  }

  const from = value.from.value;
  if (!value.to?.value) return from!;
  return `${from} to ${value.to.value}`;
};

const buildTagText = (
  row: { criterionKey: string; value: CriterionValue },
  criterion: CriterionConfig,
  t: (key: string) => string,
): string =>
  `${t(criterion.translationKey)}: ${formatValue(row.value, criterion.input)}`;

const SearchSummary = ({
  activeSearchState,
  onModifySearch,
}: SearchSummaryProps) => {
  const { t } = useTranslation();
  const { context, rows } = activeSearchState;

  const tags = rows
    .filter(
      (
        row,
      ): row is typeof row & { criterionKey: string; value: CriterionValue } =>
        row.criterionKey !== null && row.value !== null,
    )
    .map((row) => {
      const criterion = context.criteria.find(
        (c) => c.field.key === row.criterionKey,
      )!;
      return { key: row.rowId, text: buildTagText(row, criterion, t) };
    });

  return (
    <div
      id="search-summary"
      data-testid="search-summary-test-id"
      className={styles.searchSummary}
    >
      <div
        id="search-summary-context"
        data-testid="search-summary-context-test-id"
        className={styles.summaryLeft}
      >
        <span data-testid="search-summary-context-label-test-id">
          {t(context.translationKey) + ': '}
        </span>
        {tags.map((tag) => (
          <Tag key={tag.key} type="green">
            {tag.text}
          </Tag>
        ))}
      </div>
      <div
        id="search-summary-modify"
        data-testid="search-summary-modify-test-id"
        className={styles.summaryRight}
      >
        <Button
          kind="ghost"
          renderIcon={Edit}
          onClick={onModifySearch}
          id="common-search-modify-button"
          data-testid="common-search-modify-button-test-id"
        >
          {t('COMMON_SEARCH_MODIFY_SEARCH_BUTTON')}
        </Button>
      </div>
    </div>
  );
};

export default SearchSummary;
