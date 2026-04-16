import { useSubscribeConsultationSaved } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useHasPrivilege } from '../../userPrivileges/useHasPrivilege';
import ImmunizationHistory from '../ImmunizationHistory';

expect.extend(toHaveNoViolations);

jest.mock('../../hooks/usePatientUUID');
jest.mock('../../userPrivileges/useHasPrivilege');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientImmunizations: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockUseHasPrivilege = useHasPrivilege as jest.MockedFunction<
  typeof useHasPrivilege
>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseSubscribeConsultationSaved =
  useSubscribeConsultationSaved as jest.MockedFunction<
    typeof useSubscribeConsultationSaved
  >;

describe('ImmunizationHistory', () => {
  beforeEach(() => {
    mockUsePatientUUID.mockReturnValue('patient-uuid-123');
    mockUseHasPrivilege.mockReturnValue(true);
    mockUseSubscribeConsultationSaved.mockImplementation(() => {});
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the widget tile with title', () => {
    render(<ImmunizationHistory config={{}} />);
    expect(
      screen.getByTestId('immunization-history-widget-tile-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('IMMUNIZATION_HISTORY_WIDGET_TITLE'),
    ).toBeInTheDocument();
  });

  it.each([
    {
      status: 'completed',
      expectedTitle: 'IMMUNIZATION_HISTORY_WIDGET_ADMINISTERED_TAB_TITLE',
    },
    {
      status: 'not-done',
      expectedTitle: 'IMMUNIZATION_HISTORY_WIDGET_NOT_ADMINISTERED_TAB_TITLE',
    },
  ])(
    'shows title $expectedTitle when status is $status',
    ({ status, expectedTitle }) => {
      render(<ImmunizationHistory config={{ status }} />);
      expect(
        screen.getByTestId('immunization-history-widget-title-test-id'),
      ).toHaveTextContent(expectedTitle);
    },
  );

  it.each([
    {
      label: 'encounterType not configured',
      config: {},
      hasPrivilege: true,
      visible: false,
    },
    {
      label: 'privilege absent',
      config: { encounterType: 'Immunization' },
      hasPrivilege: false,
      visible: false,
    },
    {
      label: 'privilege present and encounterType configured',
      config: { encounterType: 'Immunization' },
      hasPrivilege: true,
      visible: true,
    },
  ])(
    'add button visible=$visible when $label',
    ({ config, hasPrivilege, visible }) => {
      mockUseHasPrivilege.mockReturnValue(hasPrivilege);
      render(<ImmunizationHistory config={config} />);
      expect(
        Boolean(
          screen.queryByTestId(
            'immunization-history-widget-add-button-test-id',
          ),
        ),
      ).toBe(visible);
    },
  );

  it.each([
    {
      startEncounterPrivilege: 'Custom Privilege',
      expectedPrivilege: 'Custom Privilege',
    },
    {
      startEncounterPrivilege: undefined,
      expectedPrivilege: 'Add Immunizations',
    },
  ])(
    'calls useHasPrivilege with $expectedPrivilege',
    ({ startEncounterPrivilege, expectedPrivilege }) => {
      render(<ImmunizationHistory config={{ startEncounterPrivilege }} />);
      expect(mockUseHasPrivilege).toHaveBeenCalledWith(expectedPrivilege);
    },
  );

  it('dispatches startConsultation with encounterType from config', async () => {
    const dispatchEventSpy = jest.spyOn(globalThis, 'dispatchEvent');
    render(
      <ImmunizationHistory config={{ encounterType: 'TestEncounterType' }} />,
    );
    await userEvent.click(
      screen.getByTestId('immunization-history-widget-add-button-test-id'),
    );
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'startConsultation',
        detail: { encounterType: 'TestEncounterType' },
      }),
    );
  });

  it('renders Font Awesome plus icon inside add button', () => {
    render(<ImmunizationHistory config={{ encounterType: 'Immunization' }} />);
    const addButton = screen.getByTestId(
      'immunization-history-widget-add-button-test-id',
    );
    expect(
      addButton.querySelector('svg[data-icon="plus"]'),
    ).toBeInTheDocument();
  });

  it('renders both tabs with correct labels', () => {
    render(<ImmunizationHistory config={{}} />);
    expect(
      screen.getByRole('tab', {
        name: 'IMMUNIZATION_HISTORY_WIDGET_TAB_ADMINISTERED',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', {
        name: 'IMMUNIZATION_HISTORY_WIDGET_TAB_NOT_ADMINISTERED',
      }),
    ).toBeInTheDocument();
  });

  it('switches to Not Administered tab on click', async () => {
    render(<ImmunizationHistory config={{}} />);
    await userEvent.click(
      screen.getByRole('tab', {
        name: 'IMMUNIZATION_HISTORY_WIDGET_TAB_NOT_ADMINISTERED',
      }),
    );
    expect(
      screen.getByTestId('immunization-not-administered-tab-test-id'),
    ).toBeVisible();
  });

  it.each([
    {
      status: 'completed',
      visibleTestId: 'immunization-administered-tab-test-id',
      hiddenTestId: 'immunization-not-administered-tab-test-id',
    },
    {
      status: 'not-done',
      visibleTestId: 'immunization-not-administered-tab-test-id',
      hiddenTestId: 'immunization-administered-tab-test-id',
    },
  ])(
    'shows only $status table and hides tabs when config.status is $status',
    ({ status, visibleTestId, hiddenTestId }) => {
      render(<ImmunizationHistory config={{ status }} />);
      expect(screen.getByTestId(visibleTestId)).toBeInTheDocument();
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId(hiddenTestId)).not.toBeInTheDocument();
    },
  );

  it('passes accessibility tests', async () => {
    const { container } = render(<ImmunizationHistory config={{}} />);
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  it.each([
    {
      label: 'with tabs (default config)',
      config: { encounterType: 'Immunization' },
    },
    {
      label: 'without tabs (status filter applied)',
      config: { status: 'completed', encounterType: 'Immunization' },
    },
  ])('matches snapshot $label', ({ config }) => {
    const { asFragment } = render(<ImmunizationHistory config={config} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
