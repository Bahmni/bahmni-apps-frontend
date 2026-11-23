import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { LocationContext } from '../LocationContext';
import { LocationSelector } from '../LocationSelector';
import { mockLocation, mockLocations } from './__mocks__/LocationSelectorMocks';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        HOME_LOADING: 'Loading',
        HOME_NO_LOCATION_SELECTED: 'No location selected',
      };
      return translations[key] ?? key;
    },
  }),
}));

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
  SkeletonPlaceholder: ({ className }: any) => (
    <div data-testid="skeleton-placeholder" className={className} />
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

  it('renders skeleton while loading', () => {
    renderWithContext({ loading: true });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-placeholder')).toBeInTheDocument();
  });

  it('renders error state', () => {
    renderWithContext({ error: 'Failed to fetch location' });

    expect(screen.getByTestId('location-error')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Failed to fetch location',
    );
  });

  it('renders no-location state when location is null and no locations are available', () => {
    renderWithContext({ location: null, availableLocations: [] });

    expect(screen.getByRole('status')).toHaveTextContent(
      'No location selected',
    );
  });

  it('renders dropdown with select-location label when location is null but locations are available', () => {
    renderWithContext({ location: null });

    expect(screen.getByTestId('location-selector')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-label')).toHaveTextContent(
      'HOME_SELECT_LOCATION',
    );
    expect(screen.queryByText('No location selected')).not.toBeInTheDocument();
  });

  it('calls setLocation when a location is chosen while none is selected', async () => {
    const { context } = renderWithContext({ location: null });

    await act(async () => {
      fireEvent.click(screen.getByTestId('location-option-location-uuid-456'));
    });

    expect(context.setLocation).toHaveBeenCalledWith(mockLocations[1]);
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

  it('has no accessibility violations', async () => {
    const { container } = renderWithContext();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no accessibility violations when no location is selected', async () => {
    const { container } = renderWithContext({ location: null });
    expect(await axe(container)).toHaveNoViolations();
  });
});
