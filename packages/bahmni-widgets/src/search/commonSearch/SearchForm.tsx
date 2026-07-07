import {
  Button,
  Column,
  Dropdown,
  Grid,
  InlineNotification,
} from '@bahmni/design-system';
import {
  getUserLoginLocation,
  useTranslation,
  UserLocation,
} from '@bahmni/services';
import { useState } from 'react';
import { useNotification } from '../../notification';
import CriterionRowComponent from './CriterionRow';
import {
  CommonSearchWidgetConfig,
  CriterionRow,
  CriterionValue,
  SearchContextConfig,
} from './models';
import styles from './styles/CommonSearchWidget.module.scss';
import {
  availableCriteriaForRow,
  criteriaAvailableToAdd,
  initialRows,
  makeRow,
  updateRow,
  validateRows,
} from './utils';

interface SearchFormProps {
  config: CommonSearchWidgetConfig;
}

const SearchForm = ({ config }: SearchFormProps) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [location] = useState<UserLocation | null>(() => {
    try {
      return getUserLoginLocation();
    } catch {
      return null;
    }
  });
  const [activeContextKey, setActiveContextKey] = useState<string>(
    config[0].context,
  );
  const activeContext = config.find((c) => c.context === activeContextKey)!;
  const [rows, setRows] = useState<CriterionRow[]>(() =>
    initialRows(activeContext),
  );

  const handleContextChange = ({
    selectedItem,
  }: {
    selectedItem: SearchContextConfig | null;
  }) => {
    setActiveContextKey(selectedItem!.context);
    setRows(initialRows(selectedItem!));
  };

  const handleCriterionChange = (rowId: string, criterionKey: string) => {
    setRows((prev) =>
      updateRow(prev, rowId, () => ({
        criterionKey,
        value: null,
        validationError: null,
        rangeOrderError: null,
      })),
    );
  };

  const handleValueChange = (rowId: string, value: CriterionValue | null) => {
    setRows((prev) =>
      updateRow(prev, rowId, (r) => {
        const filled =
          value != null &&
          ('value' in value ? value.value != null : value.from.value != null);
        return {
          value,
          validationError: filled ? null : r.validationError,
          rangeOrderError: null,
        };
      }),
    );
  };

  const handleRemove = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
  };

  const availableCriteria = criteriaAvailableToAdd(
    activeContext.criteria,
    rows,
  );
  const canAddMore = availableCriteria.length > 0;

  const handleAdd = () => {
    const defaultKey =
      activeContext.criteria.find((c) => c.default)?.field.key ?? null;
    const preselect = availableCriteria.some((c) => c.field.key === defaultKey)
      ? defaultKey
      : null;
    setRows((prev) => [...prev, makeRow(preselect)]);
  };

  const handleSearch = () => {
    const validated = validateRows(
      rows,
      activeContext.criteria,
      t('COMMON_SEARCH_CRITERION_REQUIRED'),
      t('COMMON_SEARCH_VALUE_REQUIRED'),
      t('COMMON_SEARCH_RANGE_ORDER_INVALID'),
    );
    setRows(validated);
    if (validated.some((r) => r.validationError ?? r.rangeOrderError)) return;
    addNotification({
      title: t('COMMON_SEARCH_SUCCESS'),
      message: t('COMMON_SEARCH_SUCCESS_MESSAGE'),
      type: 'success',
      timeout: 3000,
    });
  };

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

  return (
    <Grid
      id="search-form-grid"
      data-testid="search-form-grid-test-id"
      className={styles.grid}
    >
      <Column sm={4} md={4} lg={4} className={styles.column}>
        <Dropdown
          id="context-selector"
          data-testid="context-selector-test-id"
          titleText={t('COMMON_SEARCH_SELECT_CONTEXT_TITLE')}
          label={t('COMMON_SEARCH_SELECT_CONTEXT_PLACEHOLDER')}
          items={config}
          selectedItem={activeContext}
          itemToString={(item: SearchContextConfig | null) =>
            item ? t(item.translationKey) : ''
          }
          onChange={handleContextChange}
        />
      </Column>
      <Column sm={4} md={4} lg={4} className={styles.column}>
        <Dropdown
          id="location-selector"
          data-testid="location-selector-test-id"
          titleText={t('COMMON_SEARCH_SELECT_LOCATION_LABEL')}
          label=""
          items={[location]}
          selectedItem={location}
          itemToString={(item: UserLocation | null) =>
            item?.display ?? item?.name ?? ''
          }
          disabled
          onChange={() => {}}
        />
      </Column>
      {rows.map((row) => (
        <Column sm={4} md={8} lg={16} key={row.rowId} className={styles.column}>
          <CriterionRowComponent
            row={row}
            availableCriteria={availableCriteriaForRow(
              activeContext.criteria,
              rows,
              row.rowId,
            )}
            selectedCriterion={
              activeContext.criteria.find(
                (c) => c.field.key === row.criterionKey,
              ) ?? null
            }
            onCriterionChange={handleCriterionChange}
            onValueChange={handleValueChange}
            onRemove={handleRemove}
          />
        </Column>
      ))}
      <Column sm={4} md={8} lg={16} className={styles.column}>
        <div
          id="common-search-footer"
          data-testid="common-search-footer-test-id"
          className={styles.footer}
        >
          {canAddMore ? (
            <Button
              kind="tertiary"
              id="common-search-add-criterion-button"
              data-testid="common-search-add-criterion-button-test-id"
              onClick={handleAdd}
            >
              {t('COMMON_SEARCH_ADD_CRITERIA_BUTTON')}
            </Button>
          ) : (
            <div />
          )}
          <Button
            kind="primary"
            id="common-search-search-button"
            data-testid="common-search-search-button-test-id"
            onClick={handleSearch}
            disabled={
              rows.length === 0 ||
              rows.some(
                (r) => r.validationError !== null || r.rangeOrderError !== null,
              )
            }
          >
            {t('COMMON_SEARCH_SEARCH_BUTTON')}
          </Button>
        </div>
      </Column>
    </Grid>
  );
};

export default SearchForm;
