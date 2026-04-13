import { useSubscribeConsultationSaved } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import Immunizations from '../Immunizations';

expect.extend(toHaveNoViolations);

jest.mock('../../hooks/usePatientUUID');
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
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseSubscribeConsultationSaved =
  useSubscribeConsultationSaved as jest.MockedFunction<
    typeof useSubscribeConsultationSaved
  >;

describe('Immunizations', () => {
  beforeEach(() => {
    mockUsePatientUUID.mockReturnValue('patient-uuid-123');
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

  it('renders both tabs with correct labels', () => {
    render(<Immunizations config={{}} />);
    expect(
      screen.getByRole('tab', { name: 'IMMUNIZATION_WIDGET_TAB_ADMINISTERED' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', {
        name: 'IMMUNIZATION_WIDGET_TAB_NOT_ADMINISTERED',
      }),
    ).toBeInTheDocument();
  });

  it('switches to Not Administered tab on click', async () => {
    render(<Immunizations config={{}} />);
    await userEvent.click(
      screen.getByRole('tab', {
        name: 'IMMUNIZATION_WIDGET_TAB_NOT_ADMINISTERED',
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
      render(<Immunizations config={{ status }} />);
      expect(screen.getByTestId(visibleTestId)).toBeInTheDocument();
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId(hiddenTestId)).not.toBeInTheDocument();
    },
  );

  it('passes accessibility tests', async () => {
    const { container } = render(<Immunizations config={{}} />);
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  it.each([
    { label: 'with tabs (default config)', config: {} },
    {
      label: 'without tabs (status filter applied)',
      config: { status: 'completed' },
    },
  ])('matches snapshot $label', ({ config }) => {
    const { asFragment } = render(<Immunizations config={config} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
