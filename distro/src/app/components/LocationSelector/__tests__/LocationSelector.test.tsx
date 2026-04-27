import { render, screen, fireEvent, act } from '@testing-library/react';
import { LocationContext } from '../../../context/LocationContext';
import { LocationSelector } from '../LocationSelector';
import { mockLocation, mockLocations } from './__mocks__/LocationSelectorMocks';

jest.mock('@bahmni/design-system', () => ({
  Dropdown: ({ items, onChange, label, disabled, ...props }: any) => (
    <div {...props}>
      <div data-testid="dropdown-label">{label}</div>
      {items?.map((item: any) => (
        <button
          key={item.uuid}
          data-testid={`location-option-${item.uuid}`}
          onClick={() => onChange({ selectedItem: item })}
          disabled={disabled}
        >
          {item.name}
        </button>
      ))}
    </div>
  ),
}));

const renderWithContext = (contextOverrides = {}) => {
  const defaultContext = {
    location: mockLocation,
    setLocation: jest.fn(),
    availableLocations: mockLocations,
    loading: false,
    error: null,
  };

  const value = { ...defaultContext, ...contextOverrides };

  return {
    ...render(
      <LocationContext.Provider value={value}>
        <LocationSelector />
      </LocationContext.Provider>,
    ),
    context: value,
  };
};

describe('LocationSelector', () => {
  it('renders dropdown with current location name', () => {
    renderWithContext();

    expect(screen.getByTestId('location-selector')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-label')).toHaveTextContent(
      'General Ward',
    );
  });

  it('renders loading state', () => {
    renderWithContext({ loading: true });

    expect(screen.getByRole('status')).toHaveTextContent('LOADING');
  });

  it('renders error state', () => {
    renderWithContext({ error: 'Failed to fetch location' });

    expect(screen.getByTestId('location-error')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Failed to fetch location',
    );
  });

  it('renders no-location state when location is null', () => {
    renderWithContext({ location: null });

    expect(screen.getByRole('status')).toHaveTextContent(
      'NO_LOCATION_SELECTED',
    );
  });

  it('calls setLocation when a different location is selected', async () => {
    const { context } = renderWithContext();

    await act(async () => {
      fireEvent.click(screen.getByTestId('location-option-location-uuid-456'));
    });

    expect(context.setLocation).toHaveBeenCalledWith(mockLocations[1]);
  });

  it('does not call setLocation when same location is selected', async () => {
    const { context } = renderWithContext();

    await act(async () => {
      fireEvent.click(screen.getByTestId('location-option-location-uuid-123'));
    });

    expect(context.setLocation).not.toHaveBeenCalled();
  });

  it('handles error from setLocation gracefully', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const failingSetLocation = jest.fn(() => {
      throw new Error('Update failed');
    });

    renderWithContext({ setLocation: failingSetLocation });

    await act(async () => {
      fireEvent.click(screen.getByTestId('location-option-location-uuid-456'));
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to change location:',
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });
});
