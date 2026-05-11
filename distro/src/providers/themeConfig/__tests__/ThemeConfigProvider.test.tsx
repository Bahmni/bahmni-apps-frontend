import * as designSystem from '@bahmni/design-system';
import * as services from '@bahmni/services';
import { NotificationProvider } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useThemeConfig } from '../hook';
import { ThemeConfigProvider } from '../provider';

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

describe('ThemeConfigProvider', () => {
  let queryClient: QueryClient;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <ThemeConfigProvider>{children}</ThemeConfigProvider>
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

  describe('Theme application', () => {
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

      const { result } = renderHook(() => useThemeConfig(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.themeConfig).toEqual(overrides);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });
});

describe('useThemeConfig', () => {
  it('throws when used outside ThemeConfigProvider', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => renderHook(() => useThemeConfig())).toThrow(
      'useThemeConfig must be used within a ThemeConfigProvider',
    );

    consoleError.mockRestore();
  });
});
