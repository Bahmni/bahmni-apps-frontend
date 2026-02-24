import { Bundle } from 'fhir/r4';
import { extractConceptsFromResponseBundle } from '../conceptExtractor';

describe('extractConceptsFromResponseBundle', () => {
  it('should extract concepts from bundle with observations', () => {
    // Arrange
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

    // Act
    const result = extractConceptsFromResponseBundle(
      bundleWithObservations as Bundle,
    );

    // Assert
    expect(result.size).toBe(3);
    expect(result.get('uuid-1')).toBe('Blood Pressure');
    expect(result.get('uuid-2')).toBe('Heart Rate');
    expect(result.get('uuid-3')).toBe('Temperature');
  });

  it('should return empty map when bundle has no observations', () => {
    // Arrange
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

    // Act
    const result = extractConceptsFromResponseBundle(
      bundleWithoutObservations as Bundle,
    );

    // Assert
    expect(result.size).toBe(0);
    expect(result instanceof Map).toBe(true);
  });

  it('should return empty map when bundle is empty', () => {
    // Arrange
    const emptyBundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction-response',
      entry: [],
    };

    // Act
    const result = extractConceptsFromResponseBundle(emptyBundle);

    // Assert
    expect(result.size).toBe(0);
  });

  it('should handle bundle with undefined entry field', () => {
    // Arrange
    const bundleWithoutEntry: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction-response',
    };

    // Act
    const result = extractConceptsFromResponseBundle(bundleWithoutEntry);

    // Assert
    expect(result.size).toBe(0);
  });

  it('should skip observations with missing uuid or name', () => {
    // Arrange
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

    // Act
    const result = extractConceptsFromResponseBundle(
      bundleWithInvalidObservations as Bundle,
    );

    // Assert
    expect(result.size).toBe(1);
    expect(result.get('uuid-1')).toBe('Valid Observation');
    expect(result.get('uuid-2')).toBeUndefined();
  });
});
