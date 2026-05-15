import * as designSystem from '@bahmni/design-system';
import * as services from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { NotificationProvider } from '../../notification';
import { useBrandTheme } from '../hook';
import { BrandThemeProvider, BRAND_THEME_URL } from '../provider';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
}));

jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
  applyBrandTheme: jest.fn(),
}));

const mockGetConfig = services.getConfig as jest.MockedFunction<
  typeof services.getConfig
>;
const mockApplyBahmniTheme =
  designSystem.applyBrandTheme as jest.MockedFunction<
    typeof designSystem.applyBrandTheme
  >;

const FULL_BRAND_CONFIG = {
  primary: '#ff0000',
  'primary-text': '#ffffff',
  'primary-hover': '#cc0000',
  'primary-active': '#990000',
  'link-hover': '#aa0000',
  'link-visited': '#8A3FFC',
  'link-visited-on-dark': '#BE95FF',
  'layer-01': '#f4f4f4',
};

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
    it('applies config directly after successful fetch without fallback to defaults', async () => {
      mockGetConfig.mockResolvedValue(FULL_BRAND_CONFIG);

      render(
        <Wrapper>
          <TestChild />
        </Wrapper>,
      );

      await waitFor(() => {
        expect(mockApplyBahmniTheme).toHaveBeenCalledWith(FULL_BRAND_CONFIG);
      });
    });
  });

  describe('Context value', () => {
    it('exposes brandThemeConfig and isLoading: false after successful fetch', async () => {
      mockGetConfig.mockResolvedValue(FULL_BRAND_CONFIG);

      const { result } = renderHook(() => useBrandTheme(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.brandThemeConfig).toEqual(FULL_BRAND_CONFIG);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Custom configUrl', () => {
    it('fetches from a custom configUrl when provided', async () => {
      const customUrl = '/custom/path/brand.json';
      mockGetConfig.mockResolvedValue(FULL_BRAND_CONFIG);

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

    it('uses the default brand config URL when no configUrl is provided', async () => {
      mockGetConfig.mockResolvedValue(FULL_BRAND_CONFIG);

      render(
        <Wrapper>
          <TestChild />
        </Wrapper>,
      );

      await waitFor(() => {
        expect(mockGetConfig).toHaveBeenCalledWith(
          BRAND_THEME_URL,
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
