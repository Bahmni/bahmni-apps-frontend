import {
  VitalFlowSheetConceptDetail,
  VitalFlowSheetData,
} from '@bahmni-frontend/bahmni-services';

export const getSortedObservationTimes = (
  vitalsData: VitalFlowSheetData | [],
) => {
  if (!Array.isArray(vitalsData)) {
    return Object.keys(vitalsData.tabularData).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
  }
  return [];
};

export const getTranslatedConceptName = (conceptName: string): string => {
  switch (conceptName) {
    case 'Pulse':
      return 'VITAL_SIGNS_PULSE';
    case 'Respiratory rate':
      return 'VITAL_SIGNS_RESPIRATORY_RATE';
    case 'Temperature':
      return 'VITAL_SIGNS_TEMPERATURE';
    case 'Heart Rate':
      return 'VITAL_SIGNS_HEART_RATE';
    case 'Systolic blood pressure':
      return 'VITAL_SIGNS_SYSTOLIC_BLOOD_PRESSURE';
    case 'Diastolic blood pressure':
      return 'VITAL_SIGNS_DIASTOLIC_BLOOD_PRESSURE';
    case 'Body position':
      return 'VITAL_SIGNS_BODY_POSITION';
    default:
      return conceptName;
  }
};

export const translateBodyPosition = (position: string): string => {
  switch (position) {
    case 'seated':
      return 'BODY_POSITION_SITTING';
    case 'recumbent':
      return 'BODY_POSITION_RECUMBENT';
    case 'Unknown':
      return 'BODY_POSITION_UNKNOWN';
    case 'Other':
      return 'BODY_POSITION_OTHER';
    case 'standing':
      return 'BODY_POSITION_STANDING';
    case "Fowler's position":
      return 'BODY_POSITION_FOWLERS_POSITION';
    default:
      return position;
  }
};

// FlowSheetRow interface for utility functions
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

export const categorizeConceptsIntoGroups = (
  conceptDetails: VitalFlowSheetConceptDetail[],
) => {
  const groupedConcepts = new Map<string, VitalFlowSheetConceptDetail[]>();
  const ungroupedConcepts: VitalFlowSheetConceptDetail[] = [];

  // Categorize concepts into groups or ungrouped
  conceptDetails.forEach((concept) => {
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

  return { groupedConcepts, ungroupedConcepts };
};

export const createGroupRows = (
  groupedConcepts: Map<string, VitalFlowSheetConceptDetail[]>,
  obsTimeKeys: string[],
  vitalsData: VitalFlowSheetData,
  t: (key: string) => string,
): FlowSheetRow[] => {
  const tableRows: FlowSheetRow[] = [];

  // Create group rows and sub-rows
  groupedConcepts.forEach((concepts, groupId) => {
    const groupConfig = CONCEPT_GROUPS[groupId as keyof typeof CONCEPT_GROUPS];

    // Create main group row
    const groupName = t(groupConfig.nameKey);
    const groupRow: FlowSheetRow = {
      id: `group-${groupId}`,
      vitalSign: groupName,
      units: `(${groupConfig.units})`,
      type: 'group',
      groupName: groupName,
    };

    // Check if this group has any actual data across all observation times
    obsTimeKeys.forEach((obsTime, index) => {
      const obsData = vitalsData.tabularData[obsTime];
      const conceptValues: Record<
        string,
        { value: string; abnormal: boolean } | null
      > = {};

      concepts.forEach((concept) => {
        const conceptObs = obsData?.[concept.name];
        conceptValues[concept.name] = conceptObs || null;
      });

      const combinedResult = groupConfig.combineDisplay(
        conceptValues,
        vitalsData.conceptDetails,
      );
      groupRow[`obs_${index}`] = combinedResult;
    });
    tableRows.push(groupRow);
  });

  return tableRows;
};

export const createConceptRows = (
  ungroupedConcepts: VitalFlowSheetConceptDetail[],
  obsTimeKeys: string[],
  vitalsData: VitalFlowSheetData,
): FlowSheetRow[] => {
  const tableRows: FlowSheetRow[] = [];

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

    // Check if this concept has any actual data across all observation times
    obsTimeKeys.forEach((obsTime, index) => {
      const obsData = vitalsData.tabularData[obsTime];
      const conceptObs = obsData?.[concept.name];
      row[`obs_${index}`] = conceptObs || null;
    });
    tableRows.push(row);
  });

  return tableRows;
};

export const CONCEPT_GROUPS = {
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

      const isAbnormal = Boolean(isSystolicAbnormal || isDiastolicAbnormal);

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
