import {
  getMedicationConfig,
  fetchMedicationOrdersMetadata,
} from '@bahmni/services';
import { renderHook, waitFor } from '@testing-library/react';

import {
  MedicationOrdersMetadataResponse,
  MedicationJSONConfig,
} from '../../models/medicationConfig';
import { useMedicationConfig } from '../useMedicationConfig';

jest.mock('@bahmni/services', () => ({
  getMedicationConfig: jest.fn(),
  fetchMedicationOrdersMetadata: jest.fn(),
}));

describe('useMedicationConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and merge medication config successfully', async () => {
    const mockMedicationOrdersMetadata: MedicationOrdersMetadataResponse = {
      doseUnits: [
        { name: 'Tablet(s)', uuid: 'doseunit-uuid-1' },
        { name: 'ml', uuid: 'doseunit-uuid-2' },
      ],
      routes: [
        { name: 'Oral', uuid: 'route-uuid-1' },
        { name: 'Intravenous', uuid: 'route-uuid-2' },
      ],
      durationUnits: [
        { name: 'Day(s)', uuid: 'duration-uuid-1' },
        { name: 'Week(s)', uuid: 'duration-uuid-2' },
      ],
      dispensingUnits: [
        { name: 'Tablet(s)', uuid: 'dispensing-uuid-1' },
        { name: 'Bottle(s)', uuid: 'dispensing-uuid-2' },
      ],
      dosingRules: ['Rule 1', 'Rule 2'],
      dosingInstructions: [
        { name: 'As directed', uuid: 'instruction-uuid-1' },
        { name: 'Before meals', uuid: 'instruction-uuid-2' },
      ],
      orderAttributes: [
        {
          uuid: 'attr-uuid-1',
          name: 'Strength',
          dataType: 'Text',
          shortName: 'strength',
          units: 'mg',
          conceptClass: 'Misc',
          hiNormal: null,
          lowNormal: null,
          set: false,
        },
      ],
      frequencies: [
        { name: 'Once a day', uuid: 'freq-uuid-1', frequencyPerDay: 1 },
        { name: 'Twice a day', uuid: 'freq-uuid-2', frequencyPerDay: 2 },
      ],
    };

    const mockMedicationJSONConfig: MedicationJSONConfig = {
      defaultDurationUnit: 'd',
      defaultInstructions: 'As directed',
      drugFormDefaults: {
        Tablet: {
          doseUnits: 'Tablet(s)',
          route: 'Oral',
        },
      },
    };

    (fetchMedicationOrdersMetadata as jest.Mock).mockResolvedValue(
      mockMedicationOrdersMetadata,
    );
    (getMedicationConfig as jest.Mock).mockResolvedValue(
      mockMedicationJSONConfig,
    );

    const { result } = renderHook(() => useMedicationConfig());

    expect(result.current.loading).toBe(true);
    expect(result.current.medicationConfig).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.medicationConfig).toEqual({
      ...mockMedicationOrdersMetadata,
      ...mockMedicationJSONConfig,
    });
    expect(result.current.error).toBeNull();
    expect(fetchMedicationOrdersMetadata).toHaveBeenCalledTimes(1);
    expect(getMedicationConfig).toHaveBeenCalledTimes(1);
  });

  it('should handle error when fetchMedicationOrdersMetadata fails', async () => {
    const mockError = new Error('Failed to fetch medication orders metadata');
    (fetchMedicationOrdersMetadata as jest.Mock).mockRejectedValue(mockError);
    (getMedicationConfig as jest.Mock).mockResolvedValue({
      defaultDurationUnit: 'd',
      defaultInstructions: 'As directed',
    });

    const { result } = renderHook(() => useMedicationConfig());

    expect(result.current.loading).toBe(true);
    expect(result.current.medicationConfig).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.medicationConfig).toBeNull();
    expect(result.current.error).toEqual(mockError);
    expect(fetchMedicationOrdersMetadata).toHaveBeenCalledTimes(1);
  });

  it('should handle error when getMedicationConfig fails', async () => {
    const mockError = new Error('Failed to fetch medication JSON config');
    const mockMedicationOrdersMetadata: MedicationOrdersMetadataResponse = {
      doseUnits: [],
      routes: [],
      durationUnits: [],
      dispensingUnits: [],
      dosingRules: [],
      dosingInstructions: [],
      orderAttributes: [],
      frequencies: [],
    };

    (fetchMedicationOrdersMetadata as jest.Mock).mockResolvedValue(
      mockMedicationOrdersMetadata,
    );
    (getMedicationConfig as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useMedicationConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.medicationConfig).toBeNull();
    expect(result.current.error).toEqual(mockError);
  });

  it('should handle error when both services return null', async () => {
    (fetchMedicationOrdersMetadata as jest.Mock).mockResolvedValue(null);
    (getMedicationConfig as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useMedicationConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.medicationConfig).toBeNull();
    expect(result.current.error).toEqual(
      new Error('Failed to fetch medication configuration data'),
    );
  });

  it('should handle error when fetchMedicationOrdersMetadata returns null', async () => {
    const mockMedicationJSONConfig: MedicationJSONConfig = {
      defaultDurationUnit: 'd',
      defaultInstructions: 'As directed',
    };

    (fetchMedicationOrdersMetadata as jest.Mock).mockResolvedValue(null);
    (getMedicationConfig as jest.Mock).mockResolvedValue(
      mockMedicationJSONConfig,
    );

    const { result } = renderHook(() => useMedicationConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.medicationConfig).toBeNull();
    expect(result.current.error).toEqual(
      new Error('Failed to fetch medication configuration data'),
    );
  });

  it('should handle error when getMedicationConfig returns null', async () => {
    const mockMedicationOrdersMetadata: MedicationOrdersMetadataResponse = {
      doseUnits: [],
      routes: [],
      durationUnits: [],
      dispensingUnits: [],
      dosingRules: [],
      dosingInstructions: [],
      orderAttributes: [],
      frequencies: [],
    };

    (fetchMedicationOrdersMetadata as jest.Mock).mockResolvedValue(
      mockMedicationOrdersMetadata,
    );
    (getMedicationConfig as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useMedicationConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.medicationConfig).toBeNull();
    expect(result.current.error).toEqual(
      new Error('Failed to fetch medication configuration data'),
    );
  });
});
