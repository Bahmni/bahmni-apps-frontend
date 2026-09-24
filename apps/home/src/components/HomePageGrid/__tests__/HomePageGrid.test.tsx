import { render, screen } from '@testing-library/react';
import { HomePageGrid } from '../HomePageGrid';

// The grid's behaviour (loading / error / empty / tile rendering) is owned by
// ModuleTileGrid in @bahmni/widgets and tested there. What home is responsible
// for is wiring the right extension point and its own translation keys.
jest.mock('@bahmni/widgets', () => ({
  ModuleTileGrid: jest.fn((props) => (
    <div
      data-testid="module-tile-grid-mock"
      data-props={JSON.stringify(props)}
    />
  )),
}));

describe('HomePageGrid', () => {
  it('delegates to ModuleTileGrid with the home extension point and home i18n keys', () => {
    render(<HomePageGrid />);

    const props = JSON.parse(
      screen.getByTestId('module-tile-grid-mock').dataset.props!,
    );

    expect(props.extensionPointId).toBe('org.bahmni.home.dashboard');
    expect(props.loadingLabelKey).toBe('HOME_LOADING_MODULES');
    expect(props.errorMessageKey).toBe('HOME_ERROR_FETCH_CONFIG');
    expect(props.emptyMessageKey).toBe('HOME_NO_MODULES');
  });

  it('offsets the grid below the fixed home header', () => {
    render(<HomePageGrid />);

    const props = JSON.parse(
      screen.getByTestId('module-tile-grid-mock').dataset.props!,
    );

    expect(props.className).toBeTruthy();
  });

  it('does not pass an appName, so home reads its own config by default', () => {
    render(<HomePageGrid />);

    const props = JSON.parse(
      screen.getByTestId('module-tile-grid-mock').dataset.props!,
    );

    expect(props.appName).toBeUndefined();
  });
});
