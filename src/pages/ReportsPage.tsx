import React, { useState } from 'react';
import { getReports } from '@/services/reportsPageService';
import ReportsTable from '@/components/reports/reportsTable/ReportsTable';
import { addMonths } from 'date-fns';
import { Report } from '@/types/report';

const ReportsPage = () => {
  const [reportsData, setReportsData] = useState(() => ({
    dateRange: { text: 'Today', value: new Date() },
    startDate: new Date(),
    endDate: new Date(),
    format: { text: 'HTML', value: 'text/html' },
    reports: getReports(),
  }));

  const handleAllReportsFormatChange = (data: {
    text: string;
    value: string;
  }) => {
    setReportsData({
      ...reportsData,
      format: data,
      reports: Object.fromEntries(
        Object.entries(reportsData.reports).map(([id, report]) => [
          id,
          {
            ...report,
            format: data,
          },
        ]),
      ),
    });
  };

  const handleAllReportsDateRangeChange = (data: {
    text: string;
    value: Date;
  }) => {
    setReportsData({
      ...reportsData,
      dateRange: data,
      startDate: data.value,
      endDate:
        data.text === 'Previous Month' ? addMonths(data.value, 1) : new Date(),
      reports: Object.fromEntries(
        Object.entries(reportsData.reports).map(([id, report]) => [
          id,
          data.text === 'Previous Month'
            ? {
                ...report,
                startDate: data.value,
                endDate: addMonths(data.value, 1),
              }
            : {
                ...report,
                startDate: data.value,
              },
        ]),
      ),
    });
  };

  const handleAllReportsStartDateChange = (value: Date) => {
    setReportsData({
      ...reportsData,
      startDate: value,
      reports: Object.fromEntries(
        Object.entries(reportsData.reports).map(([id, report]) => [
          id,
          {
            ...report,
            startDate: value,
          },
        ]),
      ),
    });
  };

  const handleAllReportsEndDateChange = (value: Date) => {
    setReportsData({
      ...reportsData,
      endDate: value,
      reports: Object.fromEntries(
        Object.entries(reportsData.reports).map(([id, report]) => [
          id,
          {
            ...report,
            endDate: value,
          },
        ]),
      ),
    });
  };

  const handleSingleReportChange = (
    row: Report,
    key: string,
    value: Date | { text: string; value: string },
  ) => {
    const tempRows = { ...reportsData.reports };
    const foundRow = tempRows[row.id];
    foundRow[key] = value;
    setReportsData({
      ...reportsData,
      reports: tempRows,
    });
  };

  return (
    <ReportsTable
      reportsData={reportsData}
      setAllReportsDateRange={handleAllReportsDateRangeChange}
      setAllReportsFormat={handleAllReportsFormatChange}
      setAllReportsStartDate={handleAllReportsStartDateChange}
      setAllReportsEndDate={handleAllReportsEndDateChange}
      setSingleReportData={handleSingleReportChange}
    />
  );
};

export default ReportsPage;
