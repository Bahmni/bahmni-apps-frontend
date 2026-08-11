import { Button, Dropdown } from '@bahmni/design-system';
import { useTranslation, UserLocation } from '@bahmni/services';
import { useState } from 'react';
import CriterionRowComponent from './CriterionRow';
import { CriterionRow, CriterionValue, SearchContextConfig } from './models';
import styles from './styles/CommonSearchWidget.module.scss';
import {
  availableCriteriaForRow,
  criteriaAvailableToAdd,
  initialRows,
  makeRow,
  reconcileAdditionalCriterionErrors,
  updateRow,
} from './utils';

interface SearchFormProps {
  config: SearchContextConfig[];
  location: UserLocation;
  onSearch: (
    rows: CriterionRow[],
    context: SearchContextConfig,
  ) => CriterionRow[];
  savedRows?: CriterionRow[];
  savedContextKey?: SearchContextConfig['context'];
}

const SearchForm = ({
  config,
  location,
  onSearch,
  savedRows,
  savedContextKey,
}: SearchFormProps) => {
  const { t } = useTranslation();
  const [activeContextKey, setActiveContextKey] = useState<string>(
    savedContextKey ?? config[0].context,
  );
  const activeContext = config.find((c) => c.context === activeContextKey)!;
  const [rows, setRows] = useState<CriterionRow[]>(
    () => savedRows ?? initialRows(activeContext),
  );

  const handleContextChange = ({
    selectedItem,
  }: {
    selectedItem: SearchContextConfig | null;
  }) => {
    setActiveContextKey(selectedItem!.context);
    setRows(initialRows(selectedItem!));
  };

  const reconcile = (nextRows: CriterionRow[]) =>
    reconcileAdditionalCriterionErrors(
      nextRows,
      activeContext.criteria,
      t('COMMON_SEARCH_ADDITIONAL_CRITERION_REQUIRED'),
    );

  const handleCriterionChange = (rowId: string, criterionKey: string) => {
    setRows((prev) =>
      reconcile(
        updateRow(prev, rowId, () => ({
          criterionKey,
          value: null,
          validationError: null,
          rangeOrderError: null,
        })),
      ),
    );
  };

  const handleValueChange = (rowId: string, value: CriterionValue | null) => {
    setRows((prev) =>
      reconcile(
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
      ),
    );
  };

  const handleRemove = (rowId: string) => {
    setRows((prev) => reconcile(prev.filter((r) => r.rowId !== rowId)));
  };

  const availableCriteria = criteriaAvailableToAdd(
    activeContext.criteria,
    rows,
  );
  const canAddMore = availableCriteria.length > 0;

  const handleAdd = () => {
    const defaultCriterion = activeContext.criteria.find((c) => c.default);
    const defaultKey = defaultCriterion ? defaultCriterion.id! : null;
    const preselect = availableCriteria.some((c) => c.id === defaultKey)
      ? defaultKey
      : null;
    setRows((prev) => reconcile([...prev, makeRow(preselect)]));
  };

  return (
    <div
      id="search-form"
      data-testid="search-form-test-id"
      className={styles.searchForm}
    >
      <div className={styles.dropdownCol}>
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
      </div>
      {activeContext.locationAware && (
        <div className={styles.dropdownCol}>
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
        </div>
      )}
      {rows.map((row) => (
        <div key={row.rowId} className={styles.fullWidthCol}>
          <CriterionRowComponent
            row={row}
            availableCriteria={availableCriteriaForRow(
              activeContext.criteria,
              rows,
              row.rowId,
            )}
            selectedCriterion={
              activeContext.criteria.find((c) => c.id === row.criterionKey) ??
              null
            }
            onCriterionChange={handleCriterionChange}
            onValueChange={handleValueChange}
            onRemove={handleRemove}
          />
        </div>
      ))}
      <div className={styles.fullWidthCol}>
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
            onClick={() => setRows(onSearch(rows, activeContext))}
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
      </div>
    </div>
  );
};

export default SearchForm;
