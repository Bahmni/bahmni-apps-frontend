import {
  Button,
  DatePicker,
  DatePickerInput,
  Dropdown,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';
import {
  DATE_PRESET_I18N_KEYS,
  DATE_PRESETS,
  type DatePreset,
} from './constants';
import type { FormatKey } from './models';
import styles from './styles/TableFilters.module.scss';
import { formatItemToString, presetToRange } from './utils';

interface TableFiltersProps {
  startDate: Date | null;
  endDate: Date | null;
  format: FormatKey | null;
  selectedPreset: DatePreset | null;
  availableFormats: FormatKey[];
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onFormatChange: (format: FormatKey | null) => void;
  onPresetChange: (preset: DatePreset | null) => void;
  onReset: () => void;
  onApply: () => void;
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  startDate,
  endDate,
  format,
  selectedPreset,
  availableFormats,
  onStartDateChange,
  onEndDateChange,
  onFormatChange,
  onPresetChange,
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
          itemToString={(preset) =>
            preset ? t(DATE_PRESET_I18N_KEYS[preset]) : ''
          }
          selectedItem={selectedPreset}
          onChange={({ selectedItem }) => {
            onPresetChange(selectedItem ?? null);
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
          onChange={(dates) => {
            onPresetChange(null);
            onStartDateChange(dates[0] ?? null);
          }}
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
          onChange={(dates) => {
            onPresetChange(null);
            onEndDateChange(dates[0] ?? null);
          }}
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
          itemToString={formatItemToString(t)}
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
