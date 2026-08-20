import { Button, Close, Dropdown } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { CriterionInput } from '../components';
import {
  CriterionConfig,
  CriterionRow as CriterionRowState,
  CriterionValue,
} from '../models';
import styles from '../styles/CommonSearchWidget.module.scss';

interface Props {
  row: CriterionRowState;
  availableCriteria: CriterionConfig[];
  selectedCriterion: CriterionConfig | null;
  onCriterionChange: (rowId: string, criterionKey: string) => void;
  onValueChange: (rowId: string, value: CriterionValue | null) => void;
  onRemove: (rowId: string) => void;
}

const CriterionRow = ({
  row,
  availableCriteria,
  selectedCriterion,
  onCriterionChange,
  onValueChange,
  onRemove,
}: Props) => {
  const { t } = useTranslation();
  const criterionError = !selectedCriterion
    ? (row.validationError ?? undefined)
    : undefined;

  return (
    <div
      id={`criterion-row-${row.rowId}`}
      data-testid={`criterion-row-${row.rowId}-test-id`}
      className={styles.criterionRow}
    >
      <div className={styles.criterionSelector}>
        <Dropdown
          id={`criterion-selector-${row.rowId}`}
          titleText={t('COMMON_SEARCH_SELECT_SEARCH_CRITERIA')}
          label={t('COMMON_SEARCH_SELECT_SEARCH_CRITERIA_PLACEHOLDER')}
          items={availableCriteria}
          selectedItem={selectedCriterion}
          itemToString={(item: CriterionConfig | null) =>
            item ? t(item.translationKey) : ''
          }
          onChange={({
            selectedItem,
          }: {
            selectedItem: CriterionConfig | null;
          }) => {
            onCriterionChange(row.rowId, selectedItem!.id!);
          }}
          invalid={!!criterionError}
          invalidText={criterionError}
        />
      </div>
      <div className={styles.criterionInput}>
        {selectedCriterion ? (
          <CriterionInput
            input={selectedCriterion.input}
            value={row.value}
            onChange={(val) => onValueChange(row.rowId, val)}
            validationError={row.validationError}
            rangeOrderError={row.rangeOrderError}
          />
        ) : (
          <div />
        )}
      </div>
      <div className={styles.criterionClose}>
        <Button
          id={`remove-criterion-${row.rowId}`}
          data-testid={`remove-criterion-${row.rowId}-test-id`}
          aria-label="Remove criterion"
          kind="ghost"
          onClick={() => onRemove(row.rowId)}
        >
          <Close size={16} />
        </Button>
      </div>
    </div>
  );
};

export default CriterionRow;
