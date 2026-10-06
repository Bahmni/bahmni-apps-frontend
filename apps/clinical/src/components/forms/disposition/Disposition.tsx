import {
  Column,
  DatePicker,
  DatePickerInput,
  Dropdown,
  Grid,
  TextAreaWClose,
  Tile,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';
import type { InputControl as ClinicalInputControlConfig } from '../../../providers/clinicalConfig/models';
import {
  useDispositionStore,
  type DispositionType,
} from '../../../stores/dispositionStore';
import styles from './styles/Disposition.module.scss';

interface DispositionProps {
  inputControlConfig?: ClinicalInputControlConfig;
}

const DEFAULT_DISPOSITION_TYPES: DispositionType[] = [
  { value: 'ADMIT', label: 'Admit' },
  { value: 'DISCHARGE', label: 'Discharge' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'UNDO_DISCHARGE', label: 'Undo Discharge' },
];

const DEFAULT_NOTES_MAX_LENGTH = 100;

const Disposition: React.FC<DispositionProps> = React.memo(
  ({ inputControlConfig }) => {
    const { t } = useTranslation();
    const {
      selectedType,
      date,
      notes,
      errors,
      setSelectedType,
      setDate,
      setNotes,
    } = useDispositionStore();

    const dispositionTypes =
      (inputControlConfig?.metadata?.dispositionTypes as
        | DispositionType[]
        | undefined) ?? DEFAULT_DISPOSITION_TYPES;

    const notesMaxLength =
      (inputControlConfig?.metadata?.notesMaxLength as number | undefined) ??
      DEFAULT_NOTES_MAX_LENGTH;

    const showDatePicker =
      (inputControlConfig?.metadata?.showDatePicker as boolean | undefined) ??
      true;

    return (
      <Tile className={styles.dispositionTile} data-testid="disposition-tile">
        <div className={styles.formTitle} data-testid="disposition-form-title">
          {t('DISPOSITION_FORM_TITLE')}
        </div>

        <Grid condensed={false}>
          <Column sm={2} md={4} lg={8} className={styles.column}>
            <Dropdown
              id="disposition-type"
              data-testid="disposition-type-dropdown"
              titleText={t('DISPOSITION_TYPE_LABEL')}
              label={t('DISPOSITION_TYPE_PLACEHOLDER')}
              items={dispositionTypes}
              itemToString={(item: DispositionType | null) =>
                item ? item.label : ''
              }
              selectedItem={selectedType}
              onChange={({
                selectedItem,
              }: {
                selectedItem: DispositionType | null;
              }) => setSelectedType(selectedItem ?? null)}
              size="sm"
              invalid={!!errors.type}
              invalidText={t(errors.type ?? '')}
            />
          </Column>

          {showDatePicker && (
            <Column sm={2} md={4} lg={8} className={styles.column}>
              <DatePicker
                datePickerType="single"
                className={styles.datePicker}
                data-testid="disposition-date-picker"
                value={date ?? undefined}
                onChange={(dates: Date[]) => {
                  if (dates.length > 0) {
                    setDate(dates[0]);
                  }
                }}
              >
                <DatePickerInput
                  id="disposition-date"
                  data-testid="disposition-date-input"
                  labelText={t('DISPOSITION_DATE_LABEL')}
                  placeholder="dd/mm/yyyy"
                  size="sm"
                />
              </DatePicker>
            </Column>
          )}

          <Column sm={4} md={8} lg={16} className={styles.noteColumn}>
            <TextAreaWClose
              id="disposition-notes"
              data-testid="disposition-notes"
              labelText={t('DISPOSITION_NOTES_LABEL')}
              placeholder={t('DISPOSITION_NOTES_PLACEHOLDER')}
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                if (e.target.value.length <= notesMaxLength) {
                  setNotes(e.target.value);
                }
              }}
              onClose={() => setNotes('')}
              enableCounter
              maxCount={notesMaxLength}
            />
          </Column>
        </Grid>
      </Tile>
    );
  },
);

Disposition.displayName = 'Disposition';

export default Disposition;
