import { Tag } from '@bahmni/design-system';
import { formatDateTime, useTranslation } from '@bahmni/services';
import {
  CurrentSearchState,
  CriterionConfig,
  CriterionValue,
  InputConfig,
} from './models';
import styles from './styles/CommonSearchWidget.module.scss';

interface SearchSummaryProps {
  currentSearchState: CurrentSearchState;
}

const formatValue = (
  value: CriterionValue,
  input: InputConfig,
  t: (key: string, options?: Record<string, string>) => string,
): string => {
  if ('value' in value) {
    if (input.kind === 'options') {
      const option = input.options.find((o) => o.value === value.value);
      return option ? t(option.translationKey) : value.value;
    }

    if (input.kind === 'lookup') {
      return value.label ?? value.value;
    }

    return value.value;
  }

  if (input.kind === 'date') {
    const from = formatDateTime(value.from.value!).formattedResult;
    if (!value.to?.value) return from;
    const to = formatDateTime(value.to.value).formattedResult;
    return t('COMMON_SEARCH_CRITERIA_TAG_RANGE', { from, to });
  }

  const from = value.from.value!;
  if (!value.to?.value) return from;
  return t('COMMON_SEARCH_CRITERIA_TAG_RANGE', { from, to: value.to.value });
};

const buildTagText = (
  row: { criterionKey: string; value: CriterionValue },
  criterion: CriterionConfig,
  t: (key: string, options?: Record<string, string>) => string,
): string =>
  `${t(criterion.translationKey)}: ${formatValue(row.value, criterion.input, t)}`;

const SearchSummary = ({ currentSearchState }: SearchSummaryProps) => {
  const { t } = useTranslation();
  const { context, rows } = currentSearchState;

  const tags = rows
    .filter(
      (
        row,
      ): row is typeof row & { criterionKey: string; value: CriterionValue } =>
        row.criterionKey !== null && row.value !== null,
    )
    .map((row) => {
      const criterion = context.criteria.find(
        (c) => c.id === row.criterionKey,
      )!;
      return { key: row.rowId, text: buildTagText(row, criterion, t) };
    });

  return (
    <div
      id="search-summary"
      data-testid="search-summary-test-id"
      className={styles.searchSummary}
    >
      <p
        id="search-summary-context-label"
        data-testid="search-summary-context-label-test-id"
        className={styles.summaryLabel}
      >
        {t('COMMON_SEARCH_SELECTED_CRITERIA_LABEL', {
          context: t(context.translationKey),
        })}
      </p>
      <div
        id="search-summary-context"
        data-testid="search-summary-context-test-id"
        className={styles.criteriaSummary}
      >
        {tags.map((tag) => (
          <Tag key={tag.key} type="green">
            {tag.text}
          </Tag>
        ))}
      </div>
    </div>
  );
};

export default SearchSummary;
