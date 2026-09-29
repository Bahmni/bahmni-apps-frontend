import {
  Button,
  DatePicker,
  DatePickerInput,
  Dropdown,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';
import { FORMAT_I18N_KEYS } from './constants';
import type { FormatKey } from './models';
import styles from './styles/TableFilters.module.scss';

interface TableFiltersProps {
  startDate: Date | null;
  endDate: Date | null;
  format: FormatKey | null;
  availableFormats: FormatKey[];
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onFormatChange: (format: FormatKey | null) => void;
  onReset: () => void;
  onApply: () => void;
}

const DATE_PRESETS: string[] = ['Today', 'This Month', 'Last 7 Days'];

const presetToRange = (preset: string): [Date, Date] => {
  const today = new Date();
  switch (preset) {
    case 'This Month':
      return [new Date(today.getFullYear(), today.getMonth(), 1), today];
    case 'Last 7 Days': {
      const from = new Date();
      from.setDate(today.getDate() - 7);
      return [from, today];
    }
    default:
      return [today, today];
  }
};

export const TableFilters: React.FC<TableFiltersProps> = ({
  startDate,
  endDate,
  format,
  availableFormats,
  onStartDateChange,
  onEndDateChange,
  onFormatChange,
  onReset,
  onApply,
}) => {
  const { t } = useTranslation();

  return (
    <section className={styles.filtersContainer} data-testid="reports-filters">
      <h2 className={styles.filtersTitle}>{t('REPORTS_FILTERS_LABEL')}</h2>

      <div className={styles.filtersRow}>
        <Dropdown
          id="date-range-preset"
          titleText={t('REPORTS_SELECT_DATE_RANGE')}
          label=""
          items={DATE_PRESETS}
          itemToString={(preset) => preset ?? ''}
          onChange={({ selectedItem }) => {
            if (!selectedItem) return;
            const [from, to] = presetToRange(selectedItem);
            onStartDateChange(from);
            onEndDateChange(to);
          }}
        />

        <DatePicker
          datePickerType="single"
          dateFormat="d/m/Y"
          value={startDate ?? undefined}
          onChange={(dates) => onStartDateChange(dates[0] ?? null)}
        >
          <DatePickerInput
            id="filter-start-date"
            labelText={t('REPORTS_START_DATE_LABEL')}
            placeholder={t('REPORTS_DATE_PLACEHOLDER')}
          />
        </DatePicker>

        <DatePicker
          datePickerType="single"
          dateFormat="d/m/Y"
          minDate={startDate ?? undefined}
          value={endDate ?? undefined}
          onChange={(dates) => onEndDateChange(dates[0] ?? null)}
        >
          <DatePickerInput
            id="filter-end-date"
            labelText={t('REPORTS_END_DATE_LABEL')}
            placeholder={t('REPORTS_DATE_PLACEHOLDER')}
          />
        </DatePicker>

        <span className={styles.divider} aria-hidden="true" />

        <Dropdown
          id="filter-format"
          titleText={t('REPORTS_FORMAT_LABEL')}
          label={t('REPORTS_CHOOSE_FORMAT')}
          items={availableFormats}
          itemToString={(fmt) => (fmt ? t(FORMAT_I18N_KEYS[fmt]) : '')}
          selectedItem={format}
          onChange={({ selectedItem }) => onFormatChange(selectedItem)}
        />
      </div>

      <div className={styles.buttonsRow}>
        <Button kind="tertiary" onClick={onReset}>
          {t('REPORTS_RESET_BUTTON')}
        </Button>
        <Button kind="primary" onClick={onApply}>
          {t('REPORTS_APPLY_BUTTON')}
        </Button>
      </div>
    </section>
  );
};

export default TableFilters;
