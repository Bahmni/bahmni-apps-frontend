import { FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL } from '@bahmni/services';
import { Bundle, Observation } from 'fhir/r4';
import {
  extractFormFieldPath,
  extractComment,
  getFormFieldPathAndComment,
  filterObservationsByFormName,
} from '../utils';

const makeObservation = (
  id: string,
  display: string,
  overrides: Partial<Observation> = {},
): Observation => ({
  resourceType: 'Observation',
  id,
  status: 'final',
  code: { text: display },
  ...overrides,
});

const makeBundle = (observations: Observation[]): Bundle<Observation> => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry: observations.map((resource) => ({ resource })),
});

describe('forms/utils', () => {
  describe('extractFormFieldPath', () => {
    it('should extract formFieldPath from observation extension', () => {
      const obs = makeObservation('obs-1', 'Temperature', {
        extension: [
          {
            url: FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
            valueString: 'Vitals.1/1-0',
          },
        ],
      });

      expect(extractFormFieldPath(obs)).toBe('Vitals.1/1-0');
    });

    it('should return undefined when extension is not present', () => {
      const obs = makeObservation('obs-1', 'Temperature');
      expect(extractFormFieldPath(obs)).toBeUndefined();
    });

    it('should return undefined when extension array is empty', () => {
      const obs = makeObservation('obs-1', 'Temperature', {
        extension: [],
      });
      expect(extractFormFieldPath(obs)).toBeUndefined();
    });

    it('should return undefined when extension has different URL', () => {
      const obs = makeObservation('obs-1', 'Temperature', {
        extension: [
          {
            url: 'http://some.other/extension',
            valueString: 'some-value',
          },
        ],
      });
      expect(extractFormFieldPath(obs)).toBeUndefined();
    });

    it('should return undefined for undefined observation', () => {
      expect(extractFormFieldPath(undefined)).toBeUndefined();
    });
  });

  describe('extractComment', () => {
    it('should extract comment from observation note', () => {
      const obs = makeObservation('obs-1', 'Temperature', {
        note: [{ text: 'Patient was resting' }],
      });

      expect(extractComment(obs)).toBe('Patient was resting');
    });

    it('should return first note when multiple notes exist', () => {
      const obs = makeObservation('obs-1', 'Temperature', {
        note: [{ text: 'First note' }, { text: 'Second note' }],
      });

      expect(extractComment(obs)).toBe('First note');
    });

    it('should return undefined when note is not present', () => {
      const obs = makeObservation('obs-1', 'Temperature');
      expect(extractComment(obs)).toBeUndefined();
    });

    it('should return undefined when note array is empty', () => {
      const obs = makeObservation('obs-1', 'Temperature', {
        note: [],
      });
      expect(extractComment(obs)).toBeUndefined();
    });

    it('should return undefined for undefined observation', () => {
      expect(extractComment(undefined)).toBeUndefined();
    });
  });

  describe('getFormFieldPathAndComment', () => {
    it('should extract both formFieldPath and comment', () => {
      const obs = makeObservation('obs-1', 'Temperature', {
        extension: [
          {
            url: FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
            valueString: 'Vitals.1/1-0',
          },
        ],
        note: [{ text: 'Some comment' }],
      });
      const bundle = makeBundle([obs]);

      const result = getFormFieldPathAndComment(bundle, 'obs-1');
      expect(result).toEqual({
        formFieldPath: 'Vitals.1/1-0',
        comment: 'Some comment',
      });
    });

    it('should extract only formFieldPath when no comment', () => {
      const obs = makeObservation('obs-1', 'Temperature', {
        extension: [
          {
            url: FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
            valueString: 'Vitals.1/1-0',
          },
        ],
      });
      const bundle = makeBundle([obs]);

      const result = getFormFieldPathAndComment(bundle, 'obs-1');
      expect(result.formFieldPath).toBe('Vitals.1/1-0');
      expect(result.comment).toBeUndefined();
    });

    it('should extract only comment when no formFieldPath', () => {
      const obs = makeObservation('obs-1', 'Temperature', {
        note: [{ text: 'A note' }],
      });
      const bundle = makeBundle([obs]);

      const result = getFormFieldPathAndComment(bundle, 'obs-1');
      expect(result.formFieldPath).toBeUndefined();
      expect(result.comment).toBe('A note');
    });

    it('should return empty object when observation not found in bundle', () => {
      const bundle = makeBundle([makeObservation('obs-1', 'Temperature')]);

      const result = getFormFieldPathAndComment(bundle, 'nonexistent');
      expect(result).toEqual({});
    });

    it('should return empty object when bundle has no entries', () => {
      const bundle: Bundle<Observation> = {
        resourceType: 'Bundle',
        type: 'searchset',
      };

      const result = getFormFieldPathAndComment(bundle, 'obs-1');
      expect(result).toEqual({});
    });
  });

  describe('filterObservationsByFormName', () => {
    it('should return empty array when bundle has no entries', () => {
      const bundle: Bundle<Observation> = {
        resourceType: 'Bundle',
        type: 'searchset',
      };

      expect(filterObservationsByFormName(bundle, 'Vitals')).toEqual([]);
    });

    it('should return empty array when formName is empty', () => {
      const bundle = makeBundle([makeObservation('obs-1', 'Temp')]);
      expect(filterObservationsByFormName(bundle, '')).toEqual([]);
    });

    it('should include observations with matching formFieldPath', () => {
      const obs = makeObservation('obs-1', 'Temperature', {
        valueQuantity: { value: 98.6, unit: 'F' },
        extension: [
          {
            url: FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
            valueString: 'Vitals.1/1-0',
          },
        ],
      });
      const bundle = makeBundle([obs]);

      const result = filterObservationsByFormName(bundle, 'Vitals');
      expect(result).toHaveLength(1);
      expect(result[0].obs.id).toBe('obs-1');
      expect(result[0].formFieldPath).toBe('Vitals.1/1-0');
    });

    it('should exclude observations with non-matching formFieldPath', () => {
      const obs = makeObservation('obs-1', 'Temperature', {
        valueQuantity: { value: 98.6, unit: 'F' },
        extension: [
          {
            url: FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
            valueString: 'OtherForm.1/1-0',
          },
        ],
      });
      const bundle = makeBundle([obs]);

      const result = filterObservationsByFormName(bundle, 'Vitals');
      expect(result).toHaveLength(0);
    });

    it('should include observations without formFieldPath', () => {
      const obs = makeObservation('obs-1', 'Temperature', {
        valueQuantity: { value: 98.6, unit: 'F' },
      });
      const bundle = makeBundle([obs]);

      const result = filterObservationsByFormName(bundle, 'Vitals');
      expect(result).toHaveLength(1);
      expect(result[0].formFieldPath).toBeUndefined();
    });

    it('should include comment when present', () => {
      const obs = makeObservation('obs-1', 'Temperature', {
        valueQuantity: { value: 98.6, unit: 'F' },
        extension: [
          {
            url: FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
            valueString: 'Vitals.1/1-0',
          },
        ],
        note: [{ text: 'Patient note' }],
      });
      const bundle = makeBundle([obs]);

      const result = filterObservationsByFormName(bundle, 'Vitals');
      expect(result[0].comment).toBe('Patient note');
    });

    it('should filter mixed observations correctly', () => {
      const matchingObs = makeObservation('obs-1', 'Temperature', {
        valueQuantity: { value: 98.6, unit: 'F' },
        extension: [
          {
            url: FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
            valueString: 'Vitals.1/1-0',
          },
        ],
      });
      const nonMatchingObs = makeObservation('obs-2', 'Weight', {
        valueQuantity: { value: 70, unit: 'kg' },
        extension: [
          {
            url: FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
            valueString: 'PhysicalExam.1/1-0',
          },
        ],
      });
      const noPathObs = makeObservation('obs-3', 'Notes', {
        valueString: 'General notes',
      });
      const bundle = makeBundle([matchingObs, nonMatchingObs, noPathObs]);

      const result = filterObservationsByFormName(bundle, 'Vitals');
      expect(result).toHaveLength(2);
      expect(result.map(({ obs }) => obs.id)).toEqual(
        expect.arrayContaining(['obs-1', 'obs-3']),
      );
    });

    it('should handle grouped observations with formFieldPath on parent', () => {
      const child = makeObservation('child-1', 'Systolic', {
        valueQuantity: { value: 120, unit: 'mmHg' },
        note: [{ text: 'Slightly elevated' }],
      });
      const parent = makeObservation('parent-1', 'Blood Pressure', {
        hasMember: [{ reference: 'Observation/child-1' }],
        extension: [
          {
            url: FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
            valueString: 'Vitals.1/2-0',
          },
        ],
      });
      const bundle = makeBundle([child, parent]);

      const result = filterObservationsByFormName(bundle, 'Vitals');
      expect(result).toHaveLength(1);
      expect(result[0].obs.id).toBe('child-1');
      expect(result[0].formFieldPath).toBe('Vitals.1/2-0');
      expect(result[0].comment).toBe('Slightly elevated');
    });

    it('should exclude grouped observations when parent formFieldPath does not match', () => {
      const child = makeObservation('child-1', 'Systolic', {
        valueQuantity: { value: 120, unit: 'mmHg' },
      });
      const parent = makeObservation('parent-1', 'Blood Pressure', {
        hasMember: [{ reference: 'Observation/child-1' }],
        extension: [
          {
            url: FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
            valueString: 'OtherForm.1/2-0',
          },
        ],
      });
      const bundle = makeBundle([child, parent]);

      const result = filterObservationsByFormName(bundle, 'Vitals');
      expect(result).toHaveLength(0);
    });
  });
});
