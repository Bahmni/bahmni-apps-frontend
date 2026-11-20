import { getUserLoginLocation } from '@bahmni/services';
import { UserGlobalAction } from '@bahmni/widgets';
import { render } from '@testing-library/react';
import { RegistrationUserMenu } from '../RegistrationUserMenu';

jest.mock('@bahmni/services', () => ({
  getUserLoginLocation: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  UserGlobalAction: jest.fn(() => (
    <div data-testid="mock-user-global-action" />
  )),
}));

describe('RegistrationUserMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should pass the locationName to UserGlobalAction when a valid location is returned', () => {
    (getUserLoginLocation as jest.Mock).mockReturnValue({
      name: 'General Ward',
      uuid: 'uuid-demo',
    });

    render(<RegistrationUserMenu />);

    expect(UserGlobalAction).toHaveBeenCalledWith(
      expect.objectContaining({ locationName: 'General Ward' }),
      undefined,
    );
  });

  it('should catch errors, log them as a warning, and render without crashing when location is missing', () => {
    const consoleSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(jest.fn());

    (getUserLoginLocation as jest.Mock).mockImplementation(() => {
      throw new Error('Cookie missing');
    });

    render(<RegistrationUserMenu />);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to read user login location:',
      expect.any(Error),
    );

    expect(UserGlobalAction).toHaveBeenCalledWith(
      expect.objectContaining({ locationName: undefined }),
      undefined,
    );
  });

  it('should pass an empty string when the location name is only whitespace, effectively omitting the row', () => {
    (getUserLoginLocation as jest.Mock).mockReturnValue({
      name: '   ',
      uuid: 'uuid-demo',
    });

    render(<RegistrationUserMenu />);

    expect(UserGlobalAction).toHaveBeenCalledWith(
      expect.objectContaining({ locationName: '' }),
      undefined,
    );
  });
});
