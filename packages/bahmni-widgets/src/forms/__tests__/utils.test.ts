import { FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL } from '@bahmni/services';
import { Observation } from 'fhir/r4';
import { extractFormFieldPath } from '../utils';

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
});
