import { Bundle } from 'fhir/r4';
import { get } from '../../api/api';
import { OPENMRS_FHIR_R4 } from '../../constants/app';
import { getBundle } from '../fhirBundleService';

jest.mock('../../api/api');

const mockedGet = get as jest.MockedFunction<typeof get>;

describe('getBundle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards the url to get and returns a typed Bundle', async () => {
    const bundle: Bundle<unknown> = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{ resource: { resourceType: 'Observation', id: '1' } }],
    };
    mockedGet.mockResolvedValue(bundle as unknown as Bundle<unknown>);

    const result = await getBundle('/Observation?patient=abc');

    expect(mockedGet).toHaveBeenCalledWith(
      `${OPENMRS_FHIR_R4}/Observation?patient=abc`,
    );
    expect(result).toBe(bundle);
  });

  it('propagates fetch failures to the caller', async () => {
    mockedGet.mockRejectedValue(new Error('network down'));

    await expect(getBundle('/Observation?patient=abc')).rejects.toThrow(
      'network down',
    );
  });
});
