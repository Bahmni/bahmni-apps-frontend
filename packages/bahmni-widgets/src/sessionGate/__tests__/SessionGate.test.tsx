import { checkSession, getCookieByName } from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionGate } from '../SessionGate';

jest.mock('@bahmni/services', () => ({
  checkSession: jest.fn(),
  getCookieByName: jest.fn(),
  BAHMNI_USER_COOKIE_NAME: 'bahmni.user',
  LOGIN_PATH: '/bahmni/v1/home/index.html#/login',
}));

const mockCheckSession = checkSession as jest.MockedFunction<
  typeof checkSession
>;
const mockGetCookieByName = getCookieByName as jest.MockedFunction<
  typeof getCookieByName
>;

describe('SessionGate', () => {
  const originalLocation = window.location;
  let replaceMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    replaceMock = jest.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, replace: replaceMock },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('redirects to LOGIN_PATH when the bahmni.user cookie is missing', () => {
    mockGetCookieByName.mockReturnValueOnce(null);

    render(
      <SessionGate>
        <div data-testid="child">child</div>
      </SessionGate>,
    );

    expect(replaceMock).toHaveBeenCalledWith(
      '/bahmni/v1/home/index.html#/login',
    );
    expect(mockCheckSession).not.toHaveBeenCalled();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('redirects when checkSession returns false', async () => {
    mockGetCookieByName.mockReturnValueOnce('alice');
    mockCheckSession.mockResolvedValueOnce(false);

    render(
      <SessionGate>
        <div data-testid="child">child</div>
      </SessionGate>,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        '/bahmni/v1/home/index.html#/login',
      );
    });
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('renders children once checkSession resolves true', async () => {
    mockGetCookieByName.mockReturnValueOnce('alice');
    mockCheckSession.mockResolvedValueOnce(true);

    render(
      <SessionGate>
        <div data-testid="child">child</div>
      </SessionGate>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
