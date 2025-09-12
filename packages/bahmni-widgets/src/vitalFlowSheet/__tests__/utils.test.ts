import {
  VitalFlowSheetData,
  VitalFlowSheetConceptDetail,
} from '@bahmni-frontend/bahmni-services';
import {
  getSortedObservationTimes,
  getTranslatedConceptName,
  translateBodyPosition,
  categorizeConceptsIntoGroups,
  createGroupRows,
  createConceptRows,
  CONCEPT_GROUPS,
} from '../utils';

describe('VitalFlowSheet Utils', () => {
  describe('getSortedObservationTimes', () => {
    it('should return sorted observation times in descending order', () => {
      const vitalsData: VitalFlowSheetData = {
        tabularData: {
          '2024-01-01 10:00:00': {},
          '2024-01-03 10:00:00': {},
          '2024-01-02 10:00:00': {},
        },
        conceptDetails: [],
      };

      const result = getSortedObservationTimes(vitalsData);

      expect(result).toEqual([
        '2024-01-03 10:00:00',
        '2024-01-02 10:00:00',
        '2024-01-01 10:00:00',
      ]);
    });

    it('should return empty array when vitalsData is an array', () => {
      const result = getSortedObservationTimes([]);
      expect(result).toEqual([]);
    });

    it('should handle empty tabularData', () => {
      const vitalsData: VitalFlowSheetData = {
        tabularData: {},
        conceptDetails: [],
      };

      const result = getSortedObservationTimes(vitalsData);
      expect(result).toEqual([]);
    });
  });

  describe('getTranslatedConceptName', () => {
    it('should return correct translation keys for known concepts', () => {
      expect(getTranslatedConceptName('Pulse')).toBe('VITAL_SIGNS_PULSE');
      expect(getTranslatedConceptName('Respiratory rate')).toBe(
        'VITAL_SIGNS_RESPIRATORY_RATE',
      );
      expect(getTranslatedConceptName('Temperature')).toBe(
        'VITAL_SIGNS_TEMPERATURE',
      );
      expect(getTranslatedConceptName('Heart Rate')).toBe(
        'VITAL_SIGNS_HEART_RATE',
      );
      expect(getTranslatedConceptName('Systolic blood pressure')).toBe(
        'VITAL_SIGNS_SYSTOLIC_BLOOD_PRESSURE',
      );
      expect(getTranslatedConceptName('Diastolic blood pressure')).toBe(
        'VITAL_SIGNS_DIASTOLIC_BLOOD_PRESSURE',
      );
      expect(getTranslatedConceptName('Body position')).toBe(
        'VITAL_SIGNS_BODY_POSITION',
      );
    });

    it('should return original concept name for unknown concepts', () => {
      expect(getTranslatedConceptName('Unknown Concept')).toBe(
        'Unknown Concept',
      );
      expect(getTranslatedConceptName('')).toBe('');
    });
  });

  describe('translateBodyPosition', () => {
    it('should return correct translation keys for known positions', () => {
      expect(translateBodyPosition('seated')).toBe('BODY_POSITION_SITTING');
      expect(translateBodyPosition('recumbent')).toBe(
        'BODY_POSITION_RECUMBENT',
      );
      expect(translateBodyPosition('Unknown')).toBe('BODY_POSITION_UNKNOWN');
      expect(translateBodyPosition('Other')).toBe('BODY_POSITION_OTHER');
      expect(translateBodyPosition('standing')).toBe('BODY_POSITION_STANDING');
      expect(translateBodyPosition("Fowler's position")).toBe(
        'BODY_POSITION_FOWLERS_POSITION',
      );
    });

    it('should return original position for unknown positions', () => {
      expect(translateBodyPosition('custom position')).toBe('custom position');
      expect(translateBodyPosition('')).toBe('');
    });
  });

  describe('categorizeConceptsIntoGroups', () => {
    const mockConceptDetails: VitalFlowSheetConceptDetail[] = [
      {
        name: 'Sbp',
        fullName: 'Systolic blood pressure',
        units: 'mmHg',
        hiNormal: 140,
        lowNormal: 90,
        attributes: {},
      },
      {
        name: 'DBP',
        fullName: 'Diastolic blood pressure',
        units: 'mmHg',
        hiNormal: 90,
        lowNormal: 60,
        attributes: {},
      },
      {
        name: 'Body position',
        fullName: 'Body position',
        units: '',
        hiNormal: 0,
        lowNormal: 0,
        attributes: {},
      },
      {
        name: 'Temperature',
        fullName: 'Temperature (C)',
        units: '°C',
        hiNormal: 37.5,
        lowNormal: 36.0,
        attributes: {},
      },
    ];

    it('should categorize concepts into groups and ungrouped', () => {
      const result = categorizeConceptsIntoGroups(mockConceptDetails);

      expect(result.groupedConcepts.has('blood-pressure')).toBe(true);
      expect(result.groupedConcepts.get('blood-pressure')).toHaveLength(3);
      expect(result.ungroupedConcepts).toHaveLength(1);
      expect(result.ungroupedConcepts[0].name).toBe('Temperature');
    });

    it('should handle empty concept details', () => {
      const result = categorizeConceptsIntoGroups([]);

      expect(result.groupedConcepts.size).toBe(0);
      expect(result.ungroupedConcepts).toHaveLength(0);
    });

    it('should handle concepts that do not match any group', () => {
      const ungroupedConcepts: VitalFlowSheetConceptDetail[] = [
        {
          name: 'Pulse',
          fullName: 'Pulse',
          units: 'bpm',
          hiNormal: 100,
          lowNormal: 60,
          attributes: {},
        },
      ];

      const result = categorizeConceptsIntoGroups(ungroupedConcepts);

      expect(result.groupedConcepts.size).toBe(0);
      expect(result.ungroupedConcepts).toHaveLength(1);
      expect(result.ungroupedConcepts[0].name).toBe('Pulse');
    });
  });

  describe('createGroupRows', () => {
    const mockVitalsData: VitalFlowSheetData = {
      tabularData: {
        '2024-01-01 10:00:00': {
          Sbp: { value: '120', abnormal: false },
          DBP: { value: '80', abnormal: false },
          'Body position': { value: 'seated', abnormal: false },
        },
        '2024-01-02 10:00:00': {
          Sbp: { value: '150', abnormal: true },
          DBP: { value: '95', abnormal: true },
          'Body position': { value: 'standing', abnormal: false },
        },
      },
      conceptDetails: [
        {
          name: 'Sbp',
          fullName: 'Systolic blood pressure',
          units: 'mmHg',
          hiNormal: 140,
          lowNormal: 90,
          attributes: {},
        },
        {
          name: 'DBP',
          fullName: 'Diastolic blood pressure',
          units: 'mmHg',
          hiNormal: 90,
          lowNormal: 60,
          attributes: {},
        },
      ],
    };

    const mockGroupedConcepts = new Map([
      [
        'blood-pressure',
        [
          {
            name: 'Sbp',
            fullName: 'Systolic blood pressure',
            units: 'mmHg',
            hiNormal: 140,
            lowNormal: 90,
            attributes: {},
          },
          {
            name: 'DBP',
            fullName: 'Diastolic blood pressure',
            units: 'mmHg',
            hiNormal: 90,
            lowNormal: 60,
            attributes: {},
          },
        ],
      ],
    ]);

    const mockT = (key: string) => {
      const translations: Record<string, string> = {
        VITAL_SIGNS_BLOOD_PRESSURE: 'Blood Pressure',
      };
      return translations[key] || key;
    };

    it('should create group rows with combined display', () => {
      const obsTimeKeys = ['2024-01-01 10:00:00', '2024-01-02 10:00:00'];
      const result = createGroupRows(
        mockGroupedConcepts,
        obsTimeKeys,
        mockVitalsData,
        mockT,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('group-blood-pressure');
      expect(result[0].vitalSign).toBe('Blood Pressure');
      expect(result[0].units).toBe('(mmHg)');
      expect(result[0].type).toBe('group');

      // Check observation data
      expect(result[0].obs_0).toBeDefined();
      expect(result[0].obs_1).toBeDefined();
      expect((result[0].obs_0 as any).abnormal).toBe(false);
      expect((result[0].obs_1 as any).abnormal).toBe(true);
    });

    it('should handle empty grouped concepts', () => {
      const emptyGroupedConcepts = new Map();
      const obsTimeKeys = ['2024-01-01 10:00:00'];
      const result = createGroupRows(
        emptyGroupedConcepts,
        obsTimeKeys,
        mockVitalsData,
        mockT,
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('createConceptRows', () => {
    const mockUngroupedConcepts: VitalFlowSheetConceptDetail[] = [
      {
        name: 'Temperature',
        fullName: 'Temperature',
        units: '°C',
        hiNormal: 37.5,
        lowNormal: 36.0,
        attributes: {},
      },
      {
        name: 'Pulse',
        fullName: 'Pulse',
        units: 'bpm',
        hiNormal: 100,
        lowNormal: 60,
        attributes: {},
      },
    ];

    const mockVitalsData: VitalFlowSheetData = {
      tabularData: {
        '2024-01-01 10:00:00': {
          Temperature: { value: '36.5', abnormal: false },
          Pulse: { value: '72', abnormal: false },
        },
        '2024-01-02 10:00:00': {
          Temperature: { value: '37.8', abnormal: true },
        },
      },
      conceptDetails: mockUngroupedConcepts,
    };

    it('should create concept rows for ungrouped concepts', () => {
      const obsTimeKeys = ['2024-01-01 10:00:00', '2024-01-02 10:00:00'];
      const result = createConceptRows(
        mockUngroupedConcepts,
        obsTimeKeys,
        mockVitalsData,
      );

      expect(result).toHaveLength(2);

      // Check Temperature row
      expect(result[0].id).toBe('Temperature');
      expect(result[0].vitalSign).toBe('VITAL_SIGNS_TEMPERATURE');
      expect(result[0].units).toBe('°C');
      expect(result[0].type).toBe('concept');
      expect(result[0].obs_0).toEqual({ value: '36.5', abnormal: false });
      expect(result[0].obs_1).toEqual({ value: '37.8', abnormal: true });

      // Check Pulse row
      expect(result[1].id).toBe('Pulse');
      expect(result[1].vitalSign).toBe('VITAL_SIGNS_PULSE');
      expect(result[1].units).toBe('bpm');
      expect(result[1].type).toBe('concept');
      expect(result[1].obs_0).toEqual({ value: '72', abnormal: false });
      expect(result[1].obs_1).toBeNull();
    });

    it('should handle empty ungrouped concepts', () => {
      const obsTimeKeys = ['2024-01-01 10:00:00'];
      const result = createConceptRows([], obsTimeKeys, mockVitalsData);

      expect(result).toHaveLength(0);
    });

    it('should handle missing observation data', () => {
      const obsTimeKeys = ['2024-01-03 10:00:00']; // Non-existent time
      const result = createConceptRows(
        mockUngroupedConcepts,
        obsTimeKeys,
        mockVitalsData,
      );

      expect(result).toHaveLength(2);
      expect(result[0].obs_0).toBeNull();
      expect(result[1].obs_0).toBeNull();
    });
  });

  describe('CONCEPT_GROUPS', () => {
    describe('blood-pressure group', () => {
      const bloodPressureGroup = CONCEPT_GROUPS['blood-pressure'];

      it('should have correct configuration', () => {
        expect(bloodPressureGroup.nameKey).toBe('VITAL_SIGNS_BLOOD_PRESSURE');
        expect(bloodPressureGroup.units).toBe('mmHg');
        expect(bloodPressureGroup.concepts).toEqual([
          'Sbp',
          'DBP',
          'Body position',
        ]);
      });

      describe('combineDisplay function', () => {
        const mockConceptDetails: VitalFlowSheetConceptDetail[] = [
          {
            name: 'Sbp',
            fullName: 'Systolic blood pressure',
            units: 'mmHg',
            hiNormal: 140,
            lowNormal: 90,
            attributes: {},
          },
          {
            name: 'DBP',
            fullName: 'Diastolic blood pressure',
            units: 'mmHg',
            hiNormal: 90,
            lowNormal: 60,
            attributes: {},
          },
        ];

        it('should combine normal blood pressure values', () => {
          const values = {
            Sbp: { value: '120', abnormal: false },
            DBP: { value: '80', abnormal: false },
            'Body position': { value: 'seated', abnormal: false },
          };

          const result = bloodPressureGroup.combineDisplay(
            values,
            mockConceptDetails,
          );

          expect(result.value).toBe('COMPLEX_DISPLAY');
          expect(result.abnormal).toBe(false);
          expect(result.complexData.systolic.value).toBe(120);
          expect(result.complexData.systolic.abnormal).toBe(false);
          expect(result.complexData.diastolic.value).toBe(80);
          expect(result.complexData.diastolic.abnormal).toBe(false);
          expect(result.complexData.position).toBe('seated');
        });

        it('should detect abnormal systolic values', () => {
          const values = {
            Sbp: { value: '160', abnormal: true },
            DBP: { value: '80', abnormal: false },
            'Body position': { value: 'standing', abnormal: false },
          };

          const result = bloodPressureGroup.combineDisplay(
            values,
            mockConceptDetails,
          );

          expect(result.abnormal).toBe(true);
          expect(result.complexData.systolic.abnormal).toBe(true);
          expect(result.complexData.diastolic.abnormal).toBe(false);
        });

        it('should detect abnormal diastolic values', () => {
          const values = {
            Sbp: { value: '120', abnormal: false },
            DBP: { value: '100', abnormal: true },
            'Body position': { value: 'seated', abnormal: false },
          };

          const result = bloodPressureGroup.combineDisplay(
            values,
            mockConceptDetails,
          );

          expect(result.abnormal).toBe(true);
          expect(result.complexData.systolic.abnormal).toBe(false);
          expect(result.complexData.diastolic.abnormal).toBe(true);
        });

        it('should handle missing values', () => {
          const values = {
            Sbp: null,
            DBP: null,
            'Body position': null,
          };

          const result = bloodPressureGroup.combineDisplay(
            values,
            mockConceptDetails,
          );

          expect(result.complexData.systolic.value).toBeNaN();
          expect(result.complexData.diastolic.value).toBeNaN();
          expect(result.complexData.position).toBe('');
          expect(result.abnormal).toBe(false);
        });

        it('should handle low abnormal values', () => {
          const values = {
            Sbp: { value: '80', abnormal: true },
            DBP: { value: '50', abnormal: true },
            'Body position': { value: 'recumbent', abnormal: false },
          };

          const result = bloodPressureGroup.combineDisplay(
            values,
            mockConceptDetails,
          );

          expect(result.abnormal).toBe(true);
          expect(result.complexData.systolic.abnormal).toBe(true);
          expect(result.complexData.diastolic.abnormal).toBe(true);
        });

        it('should handle missing concept details', () => {
          const values = {
            Sbp: { value: '160', abnormal: true },
            DBP: { value: '100', abnormal: true },
            'Body position': { value: 'seated', abnormal: false },
          };

          const result = bloodPressureGroup.combineDisplay(values, []);

          expect(result.complexData.systolic.abnormal).toBeUndefined();
          expect(result.complexData.diastolic.abnormal).toBeUndefined();
          expect(result.abnormal).toBe(false);
        });

        it('should handle non-numeric values', () => {
          const values = {
            Sbp: { value: 'invalid', abnormal: false },
            DBP: { value: 'invalid', abnormal: false },
            'Body position': { value: 'seated', abnormal: false },
          };

          const result = bloodPressureGroup.combineDisplay(
            values,
            mockConceptDetails,
          );

          expect(result.complexData.systolic.value).toBeNaN();
          expect(result.complexData.diastolic.value).toBeNaN();
          expect(result.complexData.systolic.abnormal).toBe(false);
          expect(result.complexData.diastolic.abnormal).toBe(false);
        });
      });
    });
  });
});
