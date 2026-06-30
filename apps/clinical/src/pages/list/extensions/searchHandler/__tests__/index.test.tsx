import {
  clearSearchWidgetRegistry,
  registerSearchWidget,
} from '@bahmni/widgets';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Search from '..';
import {
  mockExtensionWithIcon,
  mockExtensionWithRegisteredType,
  mockExtensionWithUnregisteredType,
} from './__mocks__/searchHandlerMocks';

expect.extend(toHaveNoViolations);

const MockWidget = () => <div data-testid="mock-widget-test-id" />;
MockWidget.displayName = 'MockWidget';

describe('Search', () => {
  beforeEach(() => {
    registerSearchWidget({ key: 'testWidget', component: MockWidget });
  });

  afterEach(() => {
    clearSearchWidgetRegistry();
  });

  it('renders nothing when extensions array is empty', () => {
    const { container } = render(<Search extensions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a tab per extension', () => {
    render(
      <Search
        extensions={[mockExtensionWithRegisteredType, mockExtensionWithIcon]}
      />,
    );
    expect(
      screen.getByRole('tab', {
        name: `Search Tab ${mockExtensionWithRegisteredType.id}`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', {
        name: `Search Tab ${mockExtensionWithIcon.id}`,
      }),
    ).toBeInTheDocument();
  });

  it('renders the registered widget in the tab panel', () => {
    render(<Search extensions={[mockExtensionWithRegisteredType]} />);
    expect(screen.getByTestId('mock-widget-test-id')).toBeInTheDocument();
  });

  it('shows not-registered message when widget type is unregistered', () => {
    render(<Search extensions={[mockExtensionWithUnregisteredType]} />);
    expect(
      screen.getByTestId('extension-widget-not-registered-test-id'),
    ).toBeInTheDocument();
  });

  it('renders icon when extension has icon', () => {
    render(<Search extensions={[mockExtensionWithIcon]} />);
    expect(
      screen.getByTestId(`${mockExtensionWithIcon.id}-icon-test-id`),
    ).toBeInTheDocument();
  });

  it('does not render icon when extension has no icon', () => {
    render(<Search extensions={[mockExtensionWithRegisteredType]} />);
    expect(
      screen.queryByTestId(
        `${mockExtensionWithRegisteredType.id}-icon-test-id`,
      ),
    ).not.toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Search extensions={[mockExtensionWithRegisteredType]} />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot', () => {
      const { container } = render(
        <Search extensions={[mockExtensionWithRegisteredType]} />,
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
