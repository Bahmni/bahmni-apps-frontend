import { Button, Close, Column, Dropdown, Grid } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { CriterionInput } from './inputs';
import {
  CriterionConfig,
  CriterionRow as CriterionRowState,
  CriterionValue,
} from './models';
import styles from './styles/CommonSearchWidget.module.scss';

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
    <Grid
      id={`criterion-row-${row.rowId}-grid`}
      data-testid={`criterion-row-${row.rowId}-grid-test-id`}
      className={styles.grid}
    >
      <Column sm={2} md={4} lg={4} className={styles.column}>
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
            onCriterionChange(row.rowId, selectedItem!.field.key);
          }}
          invalid={!!criterionError}
          invalidText={criterionError}
        />
      </Column>
      <Column sm={4} md={8} lg={11} className={styles.column}>
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
      </Column>
      <Column sm={1} md={1} lg={1} className={styles.close}>
        <Button
          id={`remove-criterion-${row.rowId}`}
          data-testid={`remove-criterion-${row.rowId}-test-id`}
          aria-label="Remove criterion"
          kind="ghost"
          onClick={() => onRemove(row.rowId)}
        >
          <Close size={16} />
        </Button>
      </Column>
    </Grid>
  );
};

export default CriterionRow;
