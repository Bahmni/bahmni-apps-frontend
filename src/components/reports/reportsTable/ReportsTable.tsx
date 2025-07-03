import React from 'react';
import * as styles from './styles/ReportsTable.module.scss';
import { SortableDataTable } from '@components/common/sortableDataTable/SortableDataTable';
import { Button, DatePicker, DatePickerInput, Dropdown } from '@carbon/react';
import { Report } from '@/types/report';
import {
  getAvailableDateRange,
  getAvailableFormats,
} from '@/services/reportsPageService';

interface ReportsTableProps {
  reportsData: {
    dateRange: { text: string; value: Date };
    startDate: Date;
    endDate: Date;
    format: { text: string; value: string };
    reports: Record<string, Report>;
  };
  setAllReportsDateRange: (data: { text: string; value: Date }) => void;
  setAllReportsFormat: (data: { text: string; value: string }) => void;
  setAllReportsStartDate: (value: Date) => void;
  setAllReportsEndDate: (value: Date) => void;
  setSingleReportData: (
    row: Report,
    key: string,
    value: Date | { text: string; value: string },
  ) => void;
}

const ReportsTable = ({
  reportsData,
  setAllReportsDateRange,
  setAllReportsFormat,
  setAllReportsStartDate,
  setAllReportsEndDate,
  setSingleReportData,
}: ReportsTableProps) => {
  const availableDateRange = getAvailableDateRange();
  const availableFormats = getAvailableFormats();

  const handleChange = (
    row: Report,
    key: string,
    value: Date | { text: string; value: string },
  ) => {
    setSingleReportData(row, key, value);
  };

  const renderCell = (row: Report, key: string) => {
    switch (key) {
      case 'startDate':
        return (
          <DatePicker
            className={styles.startDate}
            dateFormat="d-m-Y"
            value={reportsData.startDate}
            datePickerType="single"
            onChange={(data) => {
              handleChange(row, 'startDate', data[0]);
            }}
          >
            <DatePickerInput
              size="sm"
              hideLabel
              id="date-picker-simple"
              labelText="Start date"
              placeholder="dd/mm/yyyy"
            />
          </DatePicker>
        );
      case 'endDate':
        return (
          <DatePicker
            className={styles.endDate}
            dateFormat="d-m-Y"
            value={reportsData.endDate}
            datePickerType="single"
            onChange={(data) => {
              handleChange(row, 'endDate', data[0]);
            }}
          >
            <DatePickerInput
              size="sm"
              hideLabel
              id="date-picker-simple"
              labelText="End date"
              placeholder="dd/mm/yyyy"
            />
          </DatePicker>
        );
      case 'format':
        return (
          <Dropdown
            selectedItem={row.format}
            onChange={(data) => handleChange(row, 'format', data.selectedItem!)}
            size="sm"
            hideLabel
            id="default"
            invalidText="invalid selection"
            items={availableFormats}
            itemToString={(item) => (item ? item.text : '')}
            label=""
            titleText="Select format"
          />
        );
      case 'action':
        return (
          <div className={styles.actionsContainer}>
            <Button size="sm">Run Now</Button>
            <Button size="sm" kind="secondary">
              Queue
            </Button>
          </div>
        );
      default:
        return row[key];
    }
  };

  return (
    <div className={styles.reportsTableContainer}>
      <SortableDataTable
        headers={[
          {
            key: 'name',
            header: (
              <div className={styles.container}>
                <div className={styles.label}>Name</div>
                <Dropdown
                  selectedItem={reportsData.dateRange}
                  onChange={(data) =>
                    setAllReportsDateRange(data.selectedItem!)
                  }
                  className={styles.dateRangeSelect}
                  size="sm"
                  label="Select Date Range"
                  aria-required="true"
                  titleText={
                    <div className={styles.label}>
                      Select Date Range
                      <span aria-hidden="true" className={styles.asterisck}>
                        *
                      </span>
                    </div>
                  }
                  id="default"
                  items={availableDateRange}
                  itemToString={(item) => (item ? item.text : '')}
                />
              </div>
            ),
          },
          {
            key: 'startDate',
            header: (
              <DatePicker
                className={styles.startDate}
                dateFormat="d-m-Y"
                value={reportsData.startDate}
                datePickerType="single"
                onChange={(data) => {
                  setAllReportsStartDate(data[0]);
                }}
              >
                <DatePickerInput
                  size="sm"
                  id="date-picker-simple"
                  aria-required="true"
                  labelText={
                    <div className={styles.label}>
                      Start Date
                      <span aria-hidden="true" className={styles.asterisck}>
                        *
                      </span>
                    </div>
                  }
                  placeholder="dd/mm/yyyy"
                />
              </DatePicker>
            ),
          },
          {
            key: 'endDate',
            header: (
              <div>
                <DatePicker
                  className={styles.endDate}
                  dateFormat="d-m-Y"
                  value={reportsData.endDate}
                  datePickerType="single"
                  onChange={(data) => {
                    setAllReportsEndDate(data[0]);
                  }}
                >
                  <DatePickerInput
                    size="sm"
                    id="date-picker-simple"
                    aria-required="true"
                    labelText={
                      <div className={styles.label}>
                        End Date
                        <span aria-hidden="true" className={styles.asterisck}>
                          *
                        </span>
                      </div>
                    }
                    placeholder="dd/mm/yyyy"
                  />
                </DatePicker>
              </div>
            ),
          },
          {
            key: 'format',
            header: (
              <Dropdown
                selectedItem={reportsData.format}
                onChange={(data) => setAllReportsFormat(data.selectedItem!)}
                size="sm"
                label="Select Format"
                aria-required="true"
                titleText={
                  <div className={styles.label}>
                    Format
                    <span aria-hidden="true" className={styles.asterisck}>
                      *
                    </span>
                  </div>
                }
                id="default"
                items={availableFormats}
                itemToString={(item) => (item ? item.text : '')}
              />
            ),
          },
          { key: 'action', header: '' },
        ]}
        rows={Object.values(reportsData.reports)}
        sortable={[
          { key: 'name', sortable: false },
          { key: 'startDate', sortable: false },
          { key: 'endDate', sortable: false },
          { key: 'format', sortable: false },
          { key: 'action', sortable: false },
        ]}
        ariaLabel="Reports"
        renderCell={renderCell}
      />
    </div>
  );
};

export default ReportsTable;
