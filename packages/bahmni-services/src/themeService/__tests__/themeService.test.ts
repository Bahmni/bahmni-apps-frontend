import { fetchThemeConfig } from '../themeService';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('fetchThemeConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns parsed JSON when fetch succeeds', async () => {
    const theme = { 'button-primary': '#007d79' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(theme),
    });

    const result = await fetchThemeConfig();
    expect(result).toEqual(theme);
  });

  it('returns empty object when response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false });

    const result = await fetchThemeConfig();
    expect(result).toEqual({});
  });

  it('returns empty object when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await fetchThemeConfig();
    expect(result).toEqual({});
  });
});
