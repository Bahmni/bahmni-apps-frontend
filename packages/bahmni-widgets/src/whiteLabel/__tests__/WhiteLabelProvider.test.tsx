import * as designSystem from '@bahmni/design-system';
import * as services from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { NotificationProvider } from '../../notification';
import { useWhiteLabel } from '../hook';
import { WhiteLabelProvider, WHITE_LABEL_URL } from '../provider';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
}));

jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
  applyWhiteLabel: jest.fn(),
}));

const mockGetConfig = services.getConfig as jest.MockedFunction<
  typeof services.getConfig
>;
const mockApplyBahmniTheme =
  designSystem.applyWhiteLabel as jest.MockedFunction<
    typeof designSystem.applyWhiteLabel
  >;

const FULL_WHITE_LABEL_CONFIG = {
  primary: '#ff0000',
  'primary-text': '#ffffff',
  'primary-hover': '#cc0000',
  'primary-active': '#990000',
  'link-hover': '#aa0000',
  'link-visited': '#8A3FFC',
  'link-visited-inverse': '#BE95FF',
  'background-secondary': '#f4f4f4',
};

const TestChild = () => <div data-testid="child">child</div>;

describe('WhiteLabelProvider', () => {
  let queryClient: QueryClient;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <WhiteLabelProvider>{children}</WhiteLabelProvider>
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

  describe('White label colour application', () => {
    it('applies config directly after successful fetch without fallback to defaults', async () => {
      mockGetConfig.mockResolvedValue(FULL_WHITE_LABEL_CONFIG);

      render(
        <Wrapper>
          <TestChild />
        </Wrapper>,
      );

      await waitFor(() => {
        expect(mockApplyBahmniTheme).toHaveBeenCalledWith(FULL_WHITE_LABEL_CONFIG);
      });
    });

    it('renders error state and does not apply theme when config has missing keys', async () => {
      mockGetConfig.mockRejectedValue(
        new Error('CONFIG_ERROR_VALIDATION_FAILED'),
      );

      const { getByTestId } = render(
        <Wrapper>
          <TestChild />
        </Wrapper>,
      );

      await waitFor(() => {
        expect(getByTestId('white-label-error-test-id')).toBeTruthy();
        expect(mockApplyBahmniTheme).not.toHaveBeenCalled();
      });
    });
  });

  describe('Context value', () => {
    it('exposes whiteLabelConfig and isLoading: false after successful fetch', async () => {
      mockGetConfig.mockResolvedValue(FULL_WHITE_LABEL_CONFIG);

      const { result } = renderHook(() => useWhiteLabel(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.whiteLabelConfig).toEqual(FULL_WHITE_LABEL_CONFIG);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Custom configUrl', () => {
    it('fetches from a custom configUrl when provided', async () => {
      const customUrl = '/custom/path/white-label.json';
      mockGetConfig.mockResolvedValue(FULL_WHITE_LABEL_CONFIG);

      render(
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>
            <WhiteLabelProvider configUrl={customUrl}>
              <TestChild />
            </WhiteLabelProvider>
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

    it('uses the default white label config URL when no configUrl is provided', async () => {
      mockGetConfig.mockResolvedValue(FULL_WHITE_LABEL_CONFIG);

      render(
        <Wrapper>
          <TestChild />
        </Wrapper>,
      );

      await waitFor(() => {
        expect(mockGetConfig).toHaveBeenCalledWith(
          WHITE_LABEL_URL,
          expect.any(Object),
        );
      });
    });
  });
});

describe('useWhiteLabel', () => {
  it('throws when used outside WhiteLabelProvider', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => renderHook(() => useWhiteLabel())).toThrow(
      'useWhiteLabel must be used within a WhiteLabelProvider',
    );

    consoleError.mockRestore();
  });
});
