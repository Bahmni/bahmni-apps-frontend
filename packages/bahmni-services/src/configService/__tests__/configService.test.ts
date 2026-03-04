import { get } from '../../api';
import {
  mockVitalSignsSchema,
  mockValidVitalSignsConfig,
  mockInvalidVitalSignsConfig,
} from '../__mocks__/configMocks';
import { getConfig } from '../configService';
import { ERROR_MESSAGES } from '../constants';

jest.mock('../../api');
const mockedGet = get as jest.MockedFunction<typeof get>;

describe('configService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when config is not found', async () => {
    mockedGet.mockResolvedValue(null);

    await expect(
      getConfig('/test/config', mockVitalSignsSchema),
    ).rejects.toThrow(ERROR_MESSAGES.CONFIG_NOT_FOUND);

    expect(mockedGet).toHaveBeenCalledWith('/test/config');
  });

  it('should throw error when validation fails', async () => {
    mockedGet.mockResolvedValue(mockInvalidVitalSignsConfig);

    await expect(
      getConfig('/test/config', mockVitalSignsSchema),
    ).rejects.toThrow(ERROR_MESSAGES.VALIDATION_FAILED);

    expect(mockedGet).toHaveBeenCalledWith('/test/config');
  });

  it('should return config when valid', async () => {
    mockedGet.mockResolvedValue(mockValidVitalSignsConfig);

    const result = await getConfig('/test/config', mockVitalSignsSchema);

    expect(result).toEqual(mockValidVitalSignsConfig);
    expect(mockedGet).toHaveBeenCalledWith('/test/config');
  });
});
