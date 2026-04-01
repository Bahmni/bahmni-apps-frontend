import {
  getDefaultDateFormat,
  DEFAULT_DATE_FORMAT_STORAGE_KEY,
} from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppContextProvider } from '../AppContextProvider';

jest.mock('@bahmni/services', () => ({
  getDefaultDateFormat: jest.fn(),
  DEFAULT_DATE_FORMAT_STORAGE_KEY: 'bahmni.defaultDateFormat',
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

const mockGetDefaultDateFormat = getDefaultDateFormat as jest.MockedFunction<
  typeof getDefaultDateFormat
>;

describe('AppContextProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
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
});
