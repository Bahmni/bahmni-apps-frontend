import {
  getDefaultDateFormat,
  DEFAULT_DATE_FORMAT_STORAGE_KEY,
  validateSessionUser,
} from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppContextProvider } from '../AppContextProvider';

jest.mock('@bahmni/services', () => ({
  getDefaultDateFormat: jest.fn(),
  DEFAULT_DATE_FORMAT_STORAGE_KEY: 'bahmni.defaultDateFormat',
  validateSessionUser: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

const mockGetDefaultDateFormat = getDefaultDateFormat as jest.MockedFunction<
  typeof getDefaultDateFormat
>;
const mockValidateSessionUser = validateSessionUser as jest.MockedFunction<
  typeof validateSessionUser
>;

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
};

describe('AppContextProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockValidateSessionUser.mockResolvedValue(undefined);
    setVisibility('visible');
  });

  it('renders children', () => {
    mockGetDefaultDateFormat.mockResolvedValueOnce('DD/MM/YYYY');

    render(
      <AppContextProvider>
        <div data-testid="child">child content</div>
      </AppContextProvider>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('calls getDefaultDateFormat on mount', async () => {
    mockGetDefaultDateFormat.mockResolvedValueOnce('DD/MM/YYYY');

    render(
      <AppContextProvider>
        <div />
      </AppContextProvider>,
    );

    await waitFor(() => {
      expect(mockGetDefaultDateFormat).toHaveBeenCalledTimes(1);
    });
  });

  it('stores the date format in localStorage when format is returned', async () => {
    mockGetDefaultDateFormat.mockResolvedValueOnce('DD/MM/YYYY');

    render(
      <AppContextProvider>
        <div />
      </AppContextProvider>,
    );

    await waitFor(() => {
      expect(localStorage.getItem(DEFAULT_DATE_FORMAT_STORAGE_KEY)).toBe(
        'DD/MM/YYYY',
      );
    });
  });

  it('does not store anything in localStorage when format is null', async () => {
    mockGetDefaultDateFormat.mockResolvedValueOnce(null);

    render(
      <AppContextProvider>
        <div />
      </AppContextProvider>,
    );

    await waitFor(() => {
      expect(mockGetDefaultDateFormat).toHaveBeenCalledTimes(1);
    });

    expect(localStorage.getItem(DEFAULT_DATE_FORMAT_STORAGE_KEY)).toBeNull();
  });

  describe('session user validation', () => {
    beforeEach(() => {
      mockGetDefaultDateFormat.mockResolvedValue(null);
    });

    const renderProvider = () =>
      render(
        <AppContextProvider>
          <div />
        </AppContextProvider>,
      );

    it('does not validate on mount alone', () => {
      renderProvider();

      expect(mockValidateSessionUser).not.toHaveBeenCalled();
    });

    it('validates when the tab becomes visible again', () => {
      renderProvider();

      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockValidateSessionUser).toHaveBeenCalledTimes(1);
    });

    it('does not validate when the tab is being hidden', () => {
      renderProvider();
      setVisibility('hidden');

      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockValidateSessionUser).not.toHaveBeenCalled();
    });

    it('stops validating once unmounted', () => {
      const { unmount } = renderProvider();
      unmount();

      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockValidateSessionUser).not.toHaveBeenCalled();
    });

    it('surfaces a validation failure without breaking the app', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockValidateSessionUser.mockRejectedValueOnce(new Error('logout failed'));

      renderProvider();
      document.dispatchEvent(new Event('visibilitychange'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to validate the session user:',
          expect.any(Error),
        );
      });
      expect(screen.queryByText('logout failed')).not.toBeInTheDocument();
      consoleError.mockRestore();
    });
  });
});
