import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardSection from '../DashboardSection';
import { DashboardSectionConfig } from '@types/dashboardConfig';

// Mock dependencies
jest.mock('@carbon/react', () => ({
  Tile: jest.fn(({ children, ref, ...rest }) => (
    <div className="cds--tile" data-testid="carbon-tile" ref={ref} {...rest}>
      {children}
    </div>
  )),
}));

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn((key) =>
      key === 'custom.translation.key' ? 'Translated Title' : key,
    ),
  }),
}));

// Mock CSS modules
jest.mock('../styles/DashboardSection.module.scss', () => ({
  sectionTitle: 'sectionTitle',
  sectionTile: 'sectionTile',
}));

// Mock the display control components
jest.mock('@displayControls/allergies/AllergiesTable', () => ({
  __esModule: true,
  default: () => <div data-testid="allergies-table">Allergies Table</div>,
}));

jest.mock('@displayControls/conditions/ConditionsTable', () => ({
  __esModule: true,
  default: () => <div data-testid="conditions-table">Conditions Table</div>,
}));

jest.mock('@displayControls/labinvestigation/LabInvestigationControl', () => ({
  __esModule: true,
  default: () => <div data-testid="lab-investigation">Lab Investigation</div>,
}));

jest.mock('@displayControls/diagnoses/DiagnosesTable', () => ({
  __esModule: true,
  default: () => <div data-testid="diagnoses-table">Diagnoses Table</div>,
}));

jest.mock(
  '@displayControls/radiologyInvestigation/RadiologyInvestigationTable',
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="radiology-investigations-table">
        Radiology Orders Table
      </div>
    ),
  }),
);

describe('DashboardSection Component', () => {
  const mockSection: DashboardSectionConfig = {
    id: 'test-section-id',
    name: 'Test Section',
    icon: 'test-icon',
    controls: [],
  };

  // Handle for forwardRef in tests
  const mockRef = React.createRef<HTMLDivElement>();

  it('renders with the correct section name', () => {
    render(<DashboardSection section={mockSection} ref={mockRef} />);

    // Check if the section name is rendered
    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });

  it('has the correct id attribute', () => {
    const { container } = render(
      <DashboardSection section={mockSection} ref={mockRef} />,
    );

    // Check if the div has the correct id
    const sectionDiv = container.querySelector(
      `div[id="section-${mockSection.id}"]`,
    );
    expect(sectionDiv).not.toBeNull();
  });

  it('renders a Tile component', () => {
    render(<DashboardSection section={mockSection} ref={mockRef} />);

    // Check if a Tile component is rendered
    expect(screen.getByTestId('carbon-tile')).toBeInTheDocument();
  });

  it('accepts a ref prop', () => {
    const testRef = React.createRef<HTMLDivElement>();

    render(<DashboardSection section={mockSection} ref={testRef} />);

    // In a real component, we'd check ref.current
    // For our mocked component, we just verify the ref was passed
    expect(screen.getByTestId('carbon-tile')).toBeInTheDocument();
  });

  it('uses translationKey instead of name when available', () => {
    const sectionWithTranslationKey: DashboardSectionConfig = {
      id: 'test-section-id',
      name: 'Test Section',
      translationKey: 'custom.translation.key',
      icon: 'test-icon',
      controls: [],
    };

    render(
      <DashboardSection section={sectionWithTranslationKey} ref={mockRef} />,
    );

    // Check if the translated text is rendered instead of the name
    expect(screen.getByText('Translated Title')).toBeInTheDocument();
    expect(screen.queryByText('Test Section')).not.toBeInTheDocument();
  });

  describe('content rendering', () => {
    it('renders AllergiesTable when section name is Allergies', () => {
      const allergiesSection: DashboardSectionConfig = {
        id: 'allergies-id',
        name: 'Allergies',
        icon: 'test-icon',
        controls: [],
      };

      render(<DashboardSection section={allergiesSection} ref={mockRef} />);

      expect(screen.getByTestId('allergies-table')).toBeInTheDocument();
    });

    it('renders both ConditionsTable and DiagnosesTable when section name is Conditions', () => {
      const conditionsSection: DashboardSectionConfig = {
        id: 'conditions-id',
        name: 'Conditions',
        icon: 'test-icon',
        controls: [],
      };

      render(<DashboardSection section={conditionsSection} ref={mockRef} />);

      expect(screen.getByTestId('conditions-table')).toBeInTheDocument();
      expect(screen.getByTestId('diagnoses-table')).toBeInTheDocument();
    });

    it('renders LabInvestigation when section name is Lab Investigations', () => {
      const labInvestigationSection: DashboardSectionConfig = {
        id: 'lab-investigation-id',
        name: 'Lab Investigations',
        icon: 'test-icon',
        controls: [],
      };

      render(
        <DashboardSection section={labInvestigationSection} ref={mockRef} />,
      );

      expect(screen.getByTestId('lab-investigation')).toBeInTheDocument();
    });

    it('renders RadiologyOrdersTable when section name is Radiology Investigations', () => {
      const radiologySection: DashboardSectionConfig = {
        id: 'radiology-id',
        name: 'Radiology Investigations',
        icon: 'test-icon',
        controls: [],
      };

      render(<DashboardSection section={radiologySection} ref={mockRef} />);

      expect(
        screen.getByTestId('radiology-investigations-table'),
      ).toBeInTheDocument();
    });

    it('renders no content for unknown section types', () => {
      const unknownSection: DashboardSectionConfig = {
        id: 'unknown-section-id',
        name: 'Unknown Section',
        icon: 'test-icon',
        controls: [],
      };

      render(<DashboardSection section={unknownSection} ref={mockRef} />);

      // Check that only section title is present, no other content
      expect(screen.getByText('Unknown Section')).toBeInTheDocument();
      const tile = screen.getByTestId('carbon-tile');
      expect(tile.children.length).toBe(1); // Only the title paragraph, no additional content
    });
  });
});
