import * as designSystem from '@bahmni/design-system';
import * as services from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { NotificationProvider } from '../../notification';
import { useBrandTheme } from '../hook';
import { BrandThemeProvider, BRAND_THEME_CONFIG_URL } from '../provider';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
}));

jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
  applyBahmniTheme: jest.fn(),
}));

const mockGetConfig = services.getConfig as jest.MockedFunction<
  typeof services.getConfig
>;
const mockApplyBahmniTheme =
  designSystem.applyBahmniTheme as jest.MockedFunction<
    typeof designSystem.applyBahmniTheme
  >;
const { BAHMNI_DEFAULT_THEME } = designSystem;

const TestChild = () => <div data-testid="child">child</div>;

describe('BrandThemeProvider', () => {
  let queryClient: QueryClient;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <BrandThemeProvider>{children}</BrandThemeProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Brand colour application', () => {
    it('applies merged config after successful fetch', async () => {
      const overrides = { primary: '#ff0000', 'primary-hover': '#cc0000' };
      mockGetConfig.mockResolvedValue(overrides);

      render(
        <Wrapper>
          <TestChild />
        </Wrapper>,
      );

      await waitFor(() => {
        expect(mockApplyBahmniTheme).toHaveBeenCalledWith({
          ...BAHMNI_DEFAULT_THEME,
          ...overrides,
        });
      });
    });

    it('falls back to defaults for unspecified keys in a partial override', async () => {
      const overrides = { primary: '#ff0000' };
      mockGetConfig.mockResolvedValue(overrides);

      render(
        <Wrapper>
          <TestChild />
        </Wrapper>,
      );

      await waitFor(() => {
        expect(mockApplyBahmniTheme).toHaveBeenCalledWith(
          expect.objectContaining({
            primary: '#ff0000',
            'primary-hover': BAHMNI_DEFAULT_THEME['primary-hover'],
            'link-visited': BAHMNI_DEFAULT_THEME['link-visited'],
          }),
        );
      });
    });
  });

  describe('Context value', () => {
    it('exposes themeConfig and isLoading: false after successful fetch', async () => {
      const overrides = { primary: '#ff0000' };
      mockGetConfig.mockResolvedValue(overrides);

      const { result } = renderHook(() => useBrandTheme(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.themeConfig).toEqual(overrides);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Custom configUrl', () => {
    it('fetches from a custom configUrl when provided', async () => {
      const customUrl = '/custom/path/brand.json';
      const overrides = { primary: '#00ff00' };
      mockGetConfig.mockResolvedValue(overrides);

      render(
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>
            <BrandThemeProvider configUrl={customUrl}>
              <TestChild />
            </BrandThemeProvider>
          </NotificationProvider>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(mockGetConfig).toHaveBeenCalledWith(
          customUrl,
          expect.any(Object),
        );
      });
    });

    it('uses the default Bahmni config URL when no configUrl is provided', async () => {
      mockGetConfig.mockResolvedValue({});

      render(
        <Wrapper>
          <TestChild />
        </Wrapper>,
      );

      await waitFor(() => {
        expect(mockGetConfig).toHaveBeenCalledWith(
          BRAND_THEME_CONFIG_URL,
          expect.any(Object),
        );
      });
    });
  });
});

describe('useBrandTheme', () => {
  it('throws when used outside BrandThemeProvider', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => renderHook(() => useBrandTheme())).toThrow(
      'useBrandTheme must be used within a BrandThemeProvider',
    );

    consoleError.mockRestore();
  });
});
