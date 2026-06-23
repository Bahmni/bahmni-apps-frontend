import { render, screen } from '@testing-library/react';
import {
  DEFAULT_TRIGGER,
  DEFAULT_PATIENT_FIELDS,
} from '../../../constants/app';
import { useCommandPaletteConfig } from '../../../hooks/useCommandPaletteConfig';
import { CommandPaletteProvider } from '../CommandPaletteProvider';

jest.mock('../../../hooks/useCommandPaletteConfig');

jest.mock('@bahmni/widgets', () => ({
  CommandPaletteProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="widget-provider">{children}</div>
  ),
}));

const mockUseCommandPaletteConfig =
  useCommandPaletteConfig as jest.MockedFunction<
    typeof useCommandPaletteConfig
  >;

const defaultConfig = {
  navItems: [],
  patientActions: [],
  patientFieldsConfig: DEFAULT_PATIENT_FIELDS,
  trigger: DEFAULT_TRIGGER,
  searchAnnotations: [],
};

describe('CommandPaletteProvider', () => {
  beforeEach(() => {
    mockUseCommandPaletteConfig.mockReturnValue(defaultConfig);
  });

  it('renders children inside the widget provider', () => {
    render(
      <CommandPaletteProvider>
        <span>child content</span>
      </CommandPaletteProvider>,
    );

    expect(screen.getByTestId('widget-provider')).toBeInTheDocument();
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('renders without children', () => {
    render(<CommandPaletteProvider />);
    expect(screen.getByTestId('widget-provider')).toBeInTheDocument();
  });
});
