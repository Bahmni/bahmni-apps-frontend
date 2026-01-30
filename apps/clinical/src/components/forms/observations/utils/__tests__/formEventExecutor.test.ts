// Import the mocked module to access the mock function
import { runEventScript } from '@bahmni/form2-controls';
import { Form2Observation, FormMetadata } from '@bahmni/services';
import { executeOnFormSaveEvent } from '../formEventExecutor';

// Mock @bahmni/form2-controls runEventScript
jest.mock('@bahmni/form2-controls', () => ({
  runEventScript: jest.fn(),
}));
const mockRunEventScript = runEventScript as jest.MockedFunction<
  typeof runEventScript
>;

describe('formEventExecutor', () => {
  const mockPatientUuid = 'patient-uuid-123';
  const mockObservations: Form2Observation[] = [
    {
      concept: { uuid: 'concept-uuid-1', name: 'Weight' },
      value: 70,
      formFieldPath: 'form.1/1-0',
    } as Form2Observation,
    {
      concept: { uuid: 'concept-uuid-2', name: 'Height' },
      value: 170,
      formFieldPath: 'form.1/2-0',
    } as Form2Observation,
  ];

  const createMockMetadata = (onFormSaveScript?: string): FormMetadata =>
    ({
      name: 'Test Form',
      uuid: 'form-uuid-123',
      version: '1',
      schema: {
        events: onFormSaveScript ? { onFormSave: onFormSaveScript } : undefined,
      },
    }) as FormMetadata;

  // Mock formData structure that matches Container's state.data format
  const mockFormData = {
    children: [
      {
        control: {
          concept: { name: 'Weight', uuid: 'concept-uuid-1' },
          label: { value: 'Weight' },
        },
        value: { value: 70, comment: undefined, interpretation: null },
      },
      {
        control: {
          concept: { name: 'Height', uuid: 'concept-uuid-2' },
          label: { value: 'Height' },
        },
        value: { value: 170, comment: undefined, interpretation: null },
      },
    ],
  };

  describe('executeOnFormSaveEvent', () => {
    beforeEach(() => {
      mockRunEventScript.mockClear();
    });

    afterEach(() => {
      mockRunEventScript.mockReset();
    });

    it('should return original observations when no onFormSave event exists', () => {
      const metadata = createMockMetadata();

      const result = executeOnFormSaveEvent(
        metadata,
        mockObservations,
        mockPatientUuid,
      );

      expect(result).toEqual(mockObservations);
    });

    it('should call runEventScript and return modified observations', () => {
      const modifiedObs = [
        { ...mockObservations[0], value: 140 },
        { ...mockObservations[1], value: 340 },
      ];
      mockRunEventScript.mockReturnValue(modifiedObs);

      const script = 'some script';
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      const result = executeOnFormSaveEvent(
        metadata,
        mockObservations,
        mockPatientUuid,
      );

      expect(mockRunEventScript).toHaveBeenCalledWith(
        undefined,
        encodedScript,
        { uuid: mockPatientUuid },
      );
      expect(result).toEqual(modifiedObs);
    });

    it('should call runEventScript with formData when provided', () => {
      const filteredObs = [mockObservations[1]];
      mockRunEventScript.mockReturnValue(filteredObs);

      const script = 'filter script';
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      const result = executeOnFormSaveEvent(
        metadata,
        mockObservations,
        mockPatientUuid,
        mockFormData,
      );

      expect(mockRunEventScript).toHaveBeenCalledWith(
        mockFormData,
        encodedScript,
        { uuid: mockPatientUuid },
      );
      expect(result).toEqual(filteredObs);
    });

    it('should return modified context observations when script returns undefined', () => {
      // Mock runEventScript to return undefined, simulating scripts that modify context but don't return
      mockRunEventScript.mockReturnValue(undefined);

      const script = 'modify script';
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      const result = executeOnFormSaveEvent(
        metadata,
        mockObservations,
        mockPatientUuid,
      );

      // When runEventScript returns undefined, we return formContext.observations
      expect(result).toEqual(mockObservations);
    });

    it('should throw error with form name context when script execution fails', () => {
      mockRunEventScript.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      const script = 'failing script';
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      expect(() =>
        executeOnFormSaveEvent(metadata, mockObservations, mockPatientUuid),
      ).toThrow(
        'Error in onFormSave event for form "Test Form": Validation failed',
      );
    });

    it('should handle script that throws plain object error', () => {
      mockRunEventScript.mockImplementation(() => {
        throw { message: 'Custom validation error' };
      });

      const script = 'error script';
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      expect(() =>
        executeOnFormSaveEvent(metadata, mockObservations, mockPatientUuid),
      ).toThrow(
        'Error in onFormSave event for form "Test Form": Custom validation error',
      );
    });

    it('should propagate errors from runEventScript', () => {
      mockRunEventScript.mockImplementation(() => {
        throw new Error('Helper failed');
      });

      const script = 'formContext.observations = [];';
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      expect(() =>
        executeOnFormSaveEvent(metadata, mockObservations, mockPatientUuid),
      ).toThrow(
        'Error in onFormSave event for form "Test Form": Helper failed',
      );
    });

    it('should throw error when script is not a string', () => {
      const metadata = {
        name: 'Test Form',
        uuid: 'form-uuid-123',
        version: '1',
        schema: {
          events: { onFormSave: 123 as any },
        },
      } as FormMetadata;

      expect(() =>
        executeOnFormSaveEvent(metadata, mockObservations, mockPatientUuid),
      ).toThrow(
        'Error in onFormSave event for form "Test Form": Invalid onFormSave script: not a string or empty',
      );
    });

    it('should throw error when script is empty string', () => {
      const metadata = createMockMetadata('   ');

      expect(() =>
        executeOnFormSaveEvent(metadata, mockObservations, mockPatientUuid),
      ).toThrow(
        'Error in onFormSave event for form "Test Form": Invalid onFormSave script: not a string or empty',
      );
    });

    it('should call runEventScript with the provided script', () => {
      mockRunEventScript.mockReturnValue([]);

      const script = 'plain text script';
      const metadata = createMockMetadata(script);

      const result = executeOnFormSaveEvent(
        metadata,
        mockObservations,
        mockPatientUuid,
      );

      expect(mockRunEventScript).toHaveBeenCalledWith(undefined, script, {
        uuid: mockPatientUuid,
      });
      expect(result).toEqual([]);
    });

    it('should handle script throwing unknown error type', () => {
      mockRunEventScript.mockImplementation(() => {
        throw 12345;
      });

      const script = 'error script';
      const encodedScript = btoa(script);
      const metadata = createMockMetadata(encodedScript);

      expect(() =>
        executeOnFormSaveEvent(metadata, mockObservations, mockPatientUuid),
      ).toThrow(
        'Error in onFormSave event for form "Test Form": Unknown error occurred',
      );
    });
  });
});
