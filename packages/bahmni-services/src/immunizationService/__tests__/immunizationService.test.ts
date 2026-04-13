import { Bundle, Immunization } from 'fhir/r4';
import { get } from '../../api';
import { PATIENT_IMMUNIZATION_URL } from '../constants';
import {
  getPatientImmunizations,
  getPatientImmunizationsBundle,
} from '../immunizationService';

jest.mock('../../api');

const PATIENT_UUID = 'patient-uuid-123';

const mockImmunization: Immunization = {
  resourceType: 'Immunization',
  id: 'imm-1',
  status: 'completed',
  vaccineCode: {},
  patient: { reference: `Patient/${PATIENT_UUID}` },
  occurrenceDateTime: '2026-01-01',
};

const mockBundle: Bundle<Immunization> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [{ resource: mockImmunization }],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getPatientImmunizationsBundle', () => {
  it('calls get with the correct URL and returns the bundle', async () => {
    (get as jest.Mock).mockResolvedValueOnce(mockBundle);

    const result = await getPatientImmunizationsBundle(
      PATIENT_UUID,
      'completed',
    );

    expect(get).toHaveBeenCalledWith(
      PATIENT_IMMUNIZATION_URL(PATIENT_UUID, 'completed'),
    );
    expect(result).toEqual(mockBundle);
  });

  it('propagates errors from the API', async () => {
    (get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(getPatientImmunizationsBundle(PATIENT_UUID)).rejects.toThrow(
      'Network error',
    );
  });
});

describe('getPatientImmunizations', () => {
  it.each([
    {
      description: 'without status',
      status: undefined,
    },
    {
      description: 'with status',
      status: 'completed' as const,
    },
  ])('calls correct URL $description', async ({ status }) => {
    (get as jest.Mock).mockResolvedValueOnce({ ...mockBundle, entry: [] });

    await getPatientImmunizations(PATIENT_UUID, status);

    expect(get).toHaveBeenCalledWith(
      PATIENT_IMMUNIZATION_URL(PATIENT_UUID, status),
    );
  });

  it('returns extracted Immunization[] from bundle entries', async () => {
    (get as jest.Mock).mockResolvedValueOnce(mockBundle);

    const result = await getPatientImmunizations(PATIENT_UUID);

    expect(result).toEqual([mockImmunization]);
  });

  it('filters out non-Immunization entries', async () => {
    (get as jest.Mock).mockResolvedValueOnce({
      ...mockBundle,
      entry: [
        { resource: mockImmunization },
        { resource: { resourceType: 'Patient', id: 'p-1' } },
      ],
    } as Bundle<Immunization>);

    const result = await getPatientImmunizations(PATIENT_UUID);

    expect(result).toEqual([mockImmunization]);
  });

  it('returns [] when entry is undefined', async () => {
    (get as jest.Mock).mockResolvedValueOnce({
      resourceType: 'Bundle',
      type: 'searchset',
    } as Bundle<Immunization>);

    const result = await getPatientImmunizations(PATIENT_UUID);

    expect(result).toEqual([]);
  });

  it('propagates errors from the API', async () => {
    (get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(getPatientImmunizations(PATIENT_UUID)).rejects.toThrow(
      'Network error',
    );
  });
});
