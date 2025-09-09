import { SortableDataTable } from '@bahmni-frontend/bahmni-design-system';
import {
  useTranslation,
  VitalFlowSheetConceptDetail,
  formatDate,
} from '@bahmni-frontend/bahmni-services';
import React, { useMemo, useCallback } from 'react';
import styles from './styles/VitalFlowSheet.module.scss';
import { useVitalFlowSheet } from './useVitalFlowSheet';

interface VitalFlowSheetProps {
  latestCount: number;
  obsConcepts: string[];
  groupBy?: string;
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

// Configuration for concept grouping
const CONCEPT_GROUPS = {
  'blood-pressure': {
    nameKey: 'VITAL_SIGNS_BLOOD_PRESSURE',
    units: 'mmHg',
    concepts: ['Sbp', 'DBP', 'Body position'],
    combineDisplay: (
      values: Record<string, { value: string; abnormal: boolean } | null>,
      conceptDetails?: VitalFlowSheetConceptDetail[],
    ) => {
      const systolicValue = parseInt(values['Sbp']?.value ?? '-');
      const diastolicValue = parseInt(values['DBP']?.value ?? '-');
      const position = values['Body position']?.value ?? '';

      // Find concept details for abnormal range checking
      const systolicConcept = conceptDetails?.find((c) => c.name === 'Sbp');
      const diastolicConcept = conceptDetails?.find((c) => c.name === 'DBP');

      const isSystolicAbnormal =
        !isNaN(systolicValue) &&
        systolicConcept &&
        (systolicValue > (systolicConcept.hiNormal ?? Infinity) ||
          systolicValue < (systolicConcept.lowNormal ?? 0));

      const isDiastolicAbnormal =
        !isNaN(diastolicValue) &&
        diastolicConcept &&
        (diastolicValue > (diastolicConcept.hiNormal ?? Infinity) ||
          diastolicValue < (diastolicConcept.lowNormal ?? 0));

      const isAbnormal = Boolean(isSystolicAbnormal ?? isDiastolicAbnormal);

      return {
        value: 'COMPLEX_DISPLAY', // Special marker for complex rendering
        abnormal: isAbnormal,
        complexData: {
          systolic: {
            value: systolicValue,
            abnormal: isSystolicAbnormal,
          },
          diastolic: {
            value: diastolicValue,
            abnormal: isDiastolicAbnormal,
          },
          position,
        },
      };
    },
  },
};

/**
 * Component to display vital signs in a flow sheet format
 */
const VitalFlowSheet: React.FC<VitalFlowSheetProps> = ({
  latestCount,
  obsConcepts,
  groupBy = 'obstime',
}) => {
  const { t } = useTranslation();

  const { data, loading, error } = useVitalFlowSheet({
    latestCount,
    obsConcepts,
    groupBy,
  });

  // Helper function to translate body position values
  const translateBodyPosition = useCallback(
    (position: string): string => {
      const positionMap: Record<string, string> = {
        seated: t('BODY_POSITION_SITTING'),
        recumbent: t('BODY_POSITION_RECUMBENT'),
        Unknown: t('BODY_POSITION_UNKNOWN'),
        Other: t('BODY_POSITION_OTHER'),
        standing: t('BODY_POSITION_STANDING'),
        "Fowler's position": t('BODY_POSITION_FOWLERS_POSITION'),
      };
      return positionMap[position] ? t(positionMap[position]) : position;
    },
    [t],
  );

  // Helper function to translate concept names
  const getTranslatedConceptName = useCallback(
    (conceptName: string): string => {
      const conceptTranslationMap: Record<string, string> = {
        Pulse: t('VITAL_SIGNS_PULSE'),
        'Respiratory rate': t('VITAL_SIGNS_RESPIRATORY_RATE'),
        Temperature: t('VITAL_SIGNS_TEMPERATURE'),
        'Heart Rate': t('VITAL_SIGNS_HEART_RATE'),
        'Systolic blood pressure': t('VITAL_SIGNS_SYSTOLIC_BLOOD_PRESSURE'),
        'Diastolic blood pressure': t('VITAL_SIGNS_DIASTOLIC_BLOOD_PRESSURE'),
        'Body position': t('VITAL_SIGNS_BODY_POSITION'),
      };

      return conceptTranslationMap[conceptName]
        ? t(conceptTranslationMap[conceptName])
        : conceptName;
    },
    [t],
  );

  // Define static headers (always available for skeleton rendering)
  const headers = useMemo(
    () => [
      {
        key: 'vitalSign',
        header: t('VITAL_SIGN'),
      },
    ],
    [t],
  );

  // Transform data for table display
  const processedData = useMemo(() => {
    // Check if we have valid data to process
    if (!data?.tabularData || !data?.conceptDetails) {
      return { headers: [], rows: [] };
    }

    // Check for truly empty data scenarios
    const hasNoData =
      Object.keys(data.tabularData).length === 0 ||
      Object.values(data.tabularData).every(
        (obsData) => !obsData || Object.keys(obsData).length === 0,
      );

    if (hasNoData) {
      return { headers: [], rows: [] };
    }

    // Get sorted observation times (latest first)
    const obsTimeKeys = Object.keys(data.tabularData).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );

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

    // Group concepts and create rows
    const groupedConcepts = new Map<string, VitalFlowSheetConceptDetail[]>();
    const ungroupedConcepts: VitalFlowSheetConceptDetail[] = [];

    // Categorize concepts into groups or ungrouped
    data.conceptDetails.forEach((concept) => {
      let isGrouped = false;

      Object.entries(CONCEPT_GROUPS).forEach(([groupId, groupConfig]) => {
        if (groupConfig.concepts.includes(concept.name)) {
          if (!groupedConcepts.has(groupId)) {
            groupedConcepts.set(groupId, []);
          }
          groupedConcepts.get(groupId)!.push(concept);
          isGrouped = true;
        }
      });

      if (!isGrouped) {
        ungroupedConcepts.push(concept);
      }
    });

    const tableRows: FlowSheetRow[] = [];

    // Create group rows and sub-rows
    groupedConcepts.forEach((concepts, groupId) => {
      const groupConfig =
        CONCEPT_GROUPS[groupId as keyof typeof CONCEPT_GROUPS];

      // Create main group row
      const groupName = t(groupConfig.nameKey);
      const groupRow: FlowSheetRow = {
        id: `group-${groupId}`,
        vitalSign: groupName,
        units: `(${groupConfig.units})`,
        type: 'group',
        groupName: groupName,
      };

      // Add combined values for each observation time
      obsTimeKeys.forEach((obsTime, index) => {
        const obsData = data.tabularData[obsTime];
        const conceptValues: Record<
          string,
          { value: string; abnormal: boolean } | null
        > = {};

        concepts.forEach((concept) => {
          conceptValues[concept.name] = obsData?.[concept.name] || null;
        });

        const combinedResult = groupConfig.combineDisplay(
          conceptValues,
          data.conceptDetails,
        );
        groupRow[`obs_${index}`] = combinedResult;
      });
      tableRows.push(groupRow);
    });

    // Add ungrouped concepts as regular rows
    ungroupedConcepts.forEach((concept) => {
      const translatedConceptName = getTranslatedConceptName(concept.fullName);
      const row: FlowSheetRow = {
        id: concept.name,
        vitalSign: translatedConceptName,
        units: concept.units,
        conceptDetail: concept,
        type: 'concept',
      };

      // Add observation values for each time
      obsTimeKeys.forEach((obsTime, index) => {
        const obsData = data.tabularData[obsTime];
        const conceptObs = obsData?.[concept.name];
        row[`obs_${index}`] = conceptObs || null;
      });

      tableRows.push(row);
    });

    return { headers: tableHeaders, rows: tableRows };
  }, [data, t, getTranslatedConceptName]);

  const renderCell = useCallback(
    (row: FlowSheetRow, cellId: string) => {
      if (cellId === 'vitalSign') {
        if (row.type === 'group') {
          // Render group header with units in regular text
          return (
            <div className={styles.vitalSignCell}>
              <span className={styles.vitalSignName}>{row.vitalSign}</span>
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
              <span className={styles.vitalSignName}>{row.vitalSign}</span>
              {concept.units && (
                <span className={styles.vitalSignUnits}>
                  {' '}
                  ({concept.units})
                </span>
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
          return <span className={styles.emptyCell}>—</span>;
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
          obsValue.value === 'COMPLEX_DISPLAY' &&
          complexObsValue.complexData ? (
            <div className={styles.complexDisplayValue}>
              <div className={styles.complexDisplaySystolic}>
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
                <div>
                  {translateBodyPosition(complexObsValue.complexData.position)}
                </div>
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
    },
    [t, translateBodyPosition],
  );

  return (
    <div className={styles.vitalFlowSheetTable}>
      {loading || !!error || processedData.rows.length === 0 ? (
        <SortableDataTable
          headers={headers}
          ariaLabel={t('VITAL_FLOW_SHEET_TABLE')}
          rows={[]}
          loading={loading}
          errorStateMessage={error?.message}
          emptyStateMessage={t('NO_VITAL_SIGNS_DATA')}
          renderCell={renderCell}
          className={styles.vitalFlowSheetDataTable}
        />
      ) : (
        <SortableDataTable
          headers={processedData.headers}
          ariaLabel={t('VITAL_FLOW_SHEET_TABLE')}
          rows={processedData.rows}
          loading={false}
          errorStateMessage={null}
          emptyStateMessage={t('NO_VITAL_SIGNS_DATA')}
          renderCell={renderCell}
          className={styles.vitalFlowSheetDataTable}
        />
      )}
    </div>
  );
};

export default VitalFlowSheet;
