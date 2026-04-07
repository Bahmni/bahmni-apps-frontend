import { Bundle, Immunization } from 'fhir/r4';
import { get } from '../../api';
import { IMMUNIZATION_FHIR_URL } from '../constants';
import { getPatientImmunizations } from '../immunizationService';

jest.mock('../../api');

const PATIENT_UUID = 'patient-uuid-123';

const mockBundle: Bundle<Immunization> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [],
};

describe('getPatientImmunizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches immunizations without a status filter', async () => {
    (get as jest.Mock).mockResolvedValueOnce(mockBundle);

    await getPatientImmunizations(PATIENT_UUID);

    expect(get).toHaveBeenCalledWith(
      `${IMMUNIZATION_FHIR_URL}?patient=${PATIENT_UUID}&_sort=-_lastUpdated&_count=100`,
    );
  });

  it('fetches immunizations with a status filter', async () => {
    (get as jest.Mock).mockResolvedValueOnce(mockBundle);

    await getPatientImmunizations(PATIENT_UUID, 'completed');

    expect(get).toHaveBeenCalledWith(
      `${IMMUNIZATION_FHIR_URL}?patient=${PATIENT_UUID}&_sort=-_lastUpdated&_count=100&status=completed`,
    );
  });

  it('returns the bundle from the API response', async () => {
    (get as jest.Mock).mockResolvedValueOnce(mockBundle);

    const result = await getPatientImmunizations(PATIENT_UUID);

    expect(result).toEqual(mockBundle);
  });

  it('propagates errors from the API', async () => {
    (get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(getPatientImmunizations(PATIENT_UUID)).rejects.toThrow(
      'Network error',
    );
  });
});
