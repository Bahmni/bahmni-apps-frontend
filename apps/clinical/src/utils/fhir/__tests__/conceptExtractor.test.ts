import { Bundle } from 'fhir/r4';
import { extractConceptsFromResponseBundle } from '../conceptExtractor';

describe('extractConceptsFromResponseBundle', () => {
  it('should extract concepts from bundle with observations', () => {
    const bundleWithObservations = {
      resourceType: 'Bundle',
      type: 'transaction-response',
      entry: [
        {
          resource: {
            resourceType: 'Observation',
            code: {
              coding: [
                {
                  code: 'uuid-1',
                  display: 'Blood Pressure',
                },
              ],
            },
          },
        },
        {
          resource: {
            resourceType: 'Observation',
            code: {
              coding: [
                {
                  code: 'uuid-2',
                  display: 'Heart Rate',
                },
              ],
              text: 'Heart Rate Text',
            },
          },
        },
        {
          resource: {
            resourceType: 'Observation',
            code: {
              coding: [
                {
                  code: 'uuid-3',
                  // No display, should use text field
                },
              ],
              text: 'Temperature',
            },
          },
        },
        {
          resource: {
            resourceType: 'Encounter',
            id: 'encounter-1',
          },
        },
      ],
    };

    const result = extractConceptsFromResponseBundle(
      bundleWithObservations as Bundle,
    );

    expect(result.size).toBe(3);
    expect(result.get('uuid-1')).toBe('Blood Pressure');
    expect(result.get('uuid-2')).toBe('Heart Rate');
    expect(result.get('uuid-3')).toBe('Temperature');
  });

  it('should return empty map when bundle has no observations', () => {
    const bundleWithoutObservations = {
      resourceType: 'Bundle',
      type: 'transaction-response',
      entry: [
        {
          resource: {
            resourceType: 'Encounter',
            id: 'encounter-1',
          },
        },
        {
          resource: {
            resourceType: 'Condition',
            id: 'condition-1',
          },
        },
      ],
    };

    const result = extractConceptsFromResponseBundle(
      bundleWithoutObservations as Bundle,
    );

    expect(result.size).toBe(0);
    expect(result instanceof Map).toBe(true);
  });

  it('should return empty map when bundle is empty', () => {
    const emptyBundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction-response',
      entry: [],
    };

    const result = extractConceptsFromResponseBundle(emptyBundle);

    expect(result.size).toBe(0);
  });

  it('should handle bundle with undefined entry field', () => {
    const bundleWithoutEntry: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction-response',
    };

    const result = extractConceptsFromResponseBundle(bundleWithoutEntry);

    expect(result.size).toBe(0);
  });

  it('should skip observations with missing uuid or name', () => {
    const bundleWithInvalidObservations = {
      resourceType: 'Bundle',
      type: 'transaction-response',
      entry: [
        {
          resource: {
            resourceType: 'Observation',
            code: {
              coding: [
                {
                  code: 'uuid-1',
                  display: 'Valid Observation',
                },
              ],
            },
          },
        },
        {
          resource: {
            resourceType: 'Observation',
            code: {
              coding: [
                {
                  // Missing code (uuid)
                  display: 'Invalid - no code',
                },
              ],
            },
          },
        },
        {
          resource: {
            resourceType: 'Observation',
            code: {
              coding: [
                {
                  code: 'uuid-2',
                  // No display and no text
                },
              ],
            },
          },
        },
      ],
    };

    const result = extractConceptsFromResponseBundle(
      bundleWithInvalidObservations as Bundle,
    );

    expect(result.size).toBe(1);
    expect(result.get('uuid-1')).toBe('Valid Observation');
    expect(result.get('uuid-2')).toBeUndefined();
  });
});
