import { SortableDataTable } from '@bahmni/design-system';
import {
  useTranslation,
  VitalFlowSheetConceptDetail,
  formatDate,
} from '@bahmni/services';
import React, { useMemo } from 'react';
import styles from './styles/VitalFlowSheet.module.scss';
import { useVitalFlowSheet } from './useVitalFlowSheet';
import {
  getSortedObservationTimes,
  getTranslatedConceptName,
  translateBodyPosition,
  categorizeConceptsIntoGroups,
  createGroupRows,
  createConceptRows,
} from './utils';

// TODO: Add JSON Schmema for VitalFlowSheetConfig
interface VitalFlowSheetConfig {
  latestCount: number;
  obsConcepts: string[];
  groupBy?: string;
}

interface VitalFlowSheetProps {
  config: VitalFlowSheetConfig;
}

interface ComplexDisplayData {
  systolic: { value: string; abnormal: boolean };
  diastolic: { value: string; abnormal: boolean };
  position: string;
}

interface ComplexObsValue {
  value: string;
  abnormal: boolean;
  complexData?: ComplexDisplayData;
}

interface FlowSheetRow {
  id: string;
  vitalSign: string;
  units?: string;
  conceptDetail?: VitalFlowSheetConceptDetail;
  type: 'group' | 'concept';
  groupName?: string;
  isSubRow?: boolean;
  parentGroupId?: string;
  [key: string]: unknown;
}

const VitalFlowSheet: React.FC<VitalFlowSheetProps> = ({
  config: { latestCount, obsConcepts, groupBy },
}) => {
  const { t } = useTranslation();

  const {
    data: vitalsData,
    loading,
    error,
  } = useVitalFlowSheet({
    latestCount,
    obsConcepts,
    groupBy: groupBy ?? 'obstime',
  });

  // Static headers for skeleton loading state
  const staticHeaders = useMemo(
    () => [
      {
        key: 'vitalSign',
        header: t('VITAL_SIGN'),
      },
      ...Array.from({ length: latestCount }, (_, index) => ({
        key: `obs_${index}`,
        header: `${t('DATE')}\n${t('TIME')}`,
      })),
    ],
    [t, latestCount],
  );

  // Transform data for table display
  const processedData = useMemo(() => {
    // Check if we have valid data to process
    if (!vitalsData) {
      return { headers: [], rows: [] };
    }

    const obsTimeKeys = getSortedObservationTimes(vitalsData);

    // Check if conceptDetails is empty
    if (!vitalsData.conceptDetails || vitalsData.conceptDetails.length === 0) {
      return { headers: [], rows: [] };
    }

    // Check if there's any meaningful observation data
    const hasObservationData = obsTimeKeys.some((obsTime) => {
      const obsData = vitalsData.tabularData[obsTime];
      return obsData && Object.keys(obsData).length > 0;
    });

    if (!hasObservationData) {
      return { headers: [], rows: [] };
    }

    // Create headers: first column for vital signs, then observation times with multi-line format
    const tableHeaders = [
      {
        key: 'vitalSign',
        header: t('VITAL_SIGN'),
      },
      ...obsTimeKeys.map((obsTime, index) => {
        const dateResult = formatDate(obsTime, t, 'dd MMMM, yyyy');
        const timeResult = formatDate(obsTime, t, 'h:mmaaaa');
        return {
          key: `obs_${index}`,
          header: `${dateResult.formattedResult}\n${timeResult.formattedResult}`,
        };
      }),
    ];

    // Extract concept categorization to form grouped rows(DBP,sbP and body position)
    const { groupedConcepts, ungroupedConcepts } = categorizeConceptsIntoGroups(
      vitalsData.conceptDetails,
    );

    // Extract group rows creation
    const groupRows = createGroupRows(
      groupedConcepts,
      obsTimeKeys,
      vitalsData,
      t,
    );

    // Extract concept rows creation
    const conceptRows = createConceptRows(
      ungroupedConcepts,
      obsTimeKeys,
      vitalsData,
    );

    const allRows = [...groupRows, ...conceptRows];

    // If no rows are generated, return empty state
    if (allRows.length === 0) {
      return { headers: [], rows: [] };
    }

    return { headers: tableHeaders, rows: allRows };
  }, [t, vitalsData]);

  const renderCell = (row: FlowSheetRow, cellId: string) => {
    if (cellId === 'vitalSign') {
      if (row.type === 'group') {
        // Render group header with units in regular text
        return (
          <div className={styles.vitalSignCell}>
            <span className={styles.vitalSignName}>
              {t(getTranslatedConceptName(row.vitalSign))}
            </span>
            {row.units && (
              <span className={styles.vitalSignUnits}> {row.units}</span>
            )}
          </div>
        );
      } else {
        // Render regular concept row
        const concept = row.conceptDetail;
        if (!concept) {
          return <span>{row.vitalSign}</span>;
        }
        return (
          <div className={styles.vitalSignCell}>
            <span className={styles.vitalSignName}>
              {t(getTranslatedConceptName(row.vitalSign))}
            </span>
            {concept.units && (
              <span className={styles.vitalSignUnits}> ({concept.units})</span>
            )}
          </div>
        );
      }
    }

    // Handle observation value cells
    if (cellId.startsWith('obs_')) {
      const obsValue = row[cellId] as {
        value: string;
        abnormal: boolean;
      } | null;

      if (!obsValue) {
        return '\u2014'; // Em dash for no data
      }

      const isLatest = cellId === 'obs_0'; // First column is latest
      const cellClasses = [
        styles.obsValueCell,
        obsValue.abnormal ? styles.abnormalValue : '',
        isLatest ? styles.latestValue : '',
      ]
        .filter(Boolean)
        .join(' ');

      // Handle complex display for grouped rows (e.g., blood pressure with individual abnormal styling)
      const complexObsValue = obsValue as ComplexObsValue;

      const displayValue =
        obsValue.value === 'COMPLEX_DISPLAY' && complexObsValue.complexData ? (
          <div className={styles.complexDisplayValue}>
            <div>
              <span
                className={
                  complexObsValue.complexData.systolic.abnormal
                    ? styles.abnormalValue
                    : ''
                }
              >
                {complexObsValue.complexData.systolic.value}
              </span>
              /
              <span
                className={
                  complexObsValue.complexData.diastolic.abnormal
                    ? styles.abnormalValue
                    : ''
                }
              >
                {complexObsValue.complexData.diastolic.value}
              </span>
            </div>
            {complexObsValue.complexData.position && (
              <span>
                {t(translateBodyPosition(complexObsValue.complexData.position))}
              </span>
            )}
          </div>
        ) : obsValue.value.includes('\n') ? (
          <div>
            {obsValue.value.split('\n').map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        ) : (
          obsValue.value
        );

      return (
        <span
          className={cellClasses}
          title={obsValue.abnormal ? t('ABNORMAL_VALUE') : undefined}
        >
          {displayValue}
        </span>
      );
    }

    return null;
  };

  return (
    <SortableDataTable
      headers={loading ? staticHeaders : processedData.headers}
      ariaLabel={t('VITAL_FLOW_SHEET_TABLE')}
      rows={processedData.rows}
      loading={loading}
      errorStateMessage={error?.message}
      emptyStateMessage={t('NO_VITAL_SIGNS_DATA')}
      renderCell={renderCell}
      className={styles.vitalFlowSheetDataTable}
      dataTestId="vital-flow-sheet-table"
    />
  );
};

export default VitalFlowSheet;
