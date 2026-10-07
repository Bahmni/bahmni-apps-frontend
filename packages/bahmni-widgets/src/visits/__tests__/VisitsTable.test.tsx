import { formatDateTime } from '@bahmni/services';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import * as UrlUtils from '../../utils/urlUtils';
import VisitsTable from '../VisitsTable';
import {
  mockActiveIpdEncounter,
  mockAllPatientEncounters,
  mockEncounters,
  mockMultiDayIpdEncounter,
  mockOneDayOpdEncounter,
} from './__mocks__/visitMocks';

jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getVisits: jest.fn(),
  formatDateTime: jest.fn(),
}));

jest.mock('../../utils/urlUtils', () => ({
  ...jest.requireActual('../../utils/urlUtils'),
  resolveNavigationURL: jest.fn(),
}));

const mockFormatDateTime = formatDateTime as jest.MockedFunction<
  typeof formatDateTime
>;
const mockResolveNavigationURL =
  UrlUtils.resolveNavigationURL as jest.MockedFunction<
    typeof UrlUtils.resolveNavigationURL
  >;

const renderWithClient = (config?: Record<string, unknown>) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <VisitsTable config={config} />
    </QueryClientProvider>,
  );
};

describe('VisitsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatDateTime.mockImplementation((date, _t, includeTime) => ({
      formattedResult: includeTime ? `${date}-with-time` : `${date}`,
    }));
    mockResolveNavigationURL.mockResolvedValue(null);
  });

  it('shows a loading skeleton while visits are being fetched (AC 14)', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    renderWithClient();
    expect(screen.getByTestId('visits-table-skeleton')).toBeInTheDocument();
  });

  it('shows the empty state message when the patient has no visits (AC 11)', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    renderWithClient();
    expect(screen.getByTestId('visits-table-empty')).toHaveTextContent(
      'NO_VISITS_FOR_PATIENT',
    );
  });

  it('shows an error state when fetching visits fails', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    renderWithClient();
    expect(screen.getByTestId('visits-table-error')).toBeInTheDocument();
  });

  describe('with visits', () => {
    beforeEach(() => {
      // Two queries now run: ['visits', …] for the visit list and
      // ['patientEncounters', …] for the child encounters that carry the login
      // location. Key off queryKey[0] so each gets its own fixture.
      (useQuery as jest.Mock).mockImplementation(
        ({ queryKey }: { queryKey: unknown[] }) => ({
          data:
            queryKey[0] === 'patientEncounters'
              ? mockAllPatientEncounters
              : mockEncounters,
          isLoading: false,
          isError: false,
        }),
      );
    });

    it('displays visit date and visit type for each visit (AC 1)', () => {
      renderWithClient();
      expect(
        screen.getByTestId(`${mockActiveIpdEncounter.id}-visit-type-test-id`),
      ).toHaveTextContent('IPD');
      expect(
        screen.getByTestId(`${mockOneDayOpdEncounter.id}-visit-type-test-id`),
      ).toHaveTextContent('OPD');
      expect(
        screen.getByTestId(`${mockActiveIpdEncounter.id}-visit-date-test-id`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`${mockMultiDayIpdEncounter.id}-visit-date-test-id`),
      ).toBeInTheDocument();
    });

    it('shows an Active tag for the visit with no end date (AC 2)', () => {
      renderWithClient();
      expect(
        screen.getByTestId(`${mockActiveIpdEncounter.id}-status-test-id`),
      ).toHaveTextContent('VISIT_STATUS_ACTIVE');
    });

    it('shows an Inactive tag for closed visits', () => {
      renderWithClient();
      [mockOneDayOpdEncounter, mockMultiDayIpdEncounter].forEach((encounter) =>
        expect(
          screen.getByTestId(`${encounter.id}-status-test-id`),
        ).toHaveTextContent('VISIT_STATUS_INACTIVE'),
      );
    });

    it('renders the three default columns and no Location column when config.fields is unset (AC 5)', () => {
      renderWithClient();
      ['VISIT_DATE', 'VISIT_TYPE', 'VISIT_STATUS'].forEach((header) =>
        expect(screen.getByText(header)).toBeInTheDocument(),
      );
      expect(screen.queryByText('VISIT_LOCATION')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId(`${mockActiveIpdEncounter.id}-location-test-id`),
      ).not.toBeInTheDocument();
    });

    it('renders the login location from the visit child encounters, not the visit facility (AC 5)', () => {
      renderWithClient({
        fields: ['visitDate', 'visitType', 'status', 'location'],
      });
      expect(screen.getByText('VISIT_LOCATION')).toBeInTheDocument();

      const activeCell = screen.getByTestId(
        `${mockActiveIpdEncounter.id}-location-test-id`,
      );
      // The visit itself carries "Bahmni Hospital"; the login location lives on
      // its child encounter. Showing the facility would be the original bug.
      expect(activeCell).toHaveTextContent('OPD-1');
      expect(activeCell).not.toHaveTextContent('Bahmni Hospital');

      expect(
        screen.getByTestId(`${mockMultiDayIpdEncounter.id}-location-test-id`),
      ).toHaveTextContent('Pediatric Ward');
    });

    it('leaves Location blank for a visit with no child encounter rather than falling back to the facility (AC 5)', () => {
      renderWithClient({ fields: ['visitDate', 'location'] });
      const cell = screen.getByTestId(
        `${mockOneDayOpdEncounter.id}-location-test-id`,
      );
      expect(cell).toHaveTextContent('-');
      expect(cell).not.toHaveTextContent('Bahmni Hospital');
    });

    it('does not fetch patient encounters when the location column is not configured', () => {
      renderWithClient({ fields: ['visitDate', 'visitType'] });
      const encounterQuery = (useQuery as jest.Mock).mock.calls.find(
        ([opts]) => opts.queryKey[0] === 'patientEncounters',
      );
      expect(encounterQuery?.[0].enabled).toBe(false);
    });

    it('omits any column left out of config.fields', () => {
      renderWithClient({ fields: ['visitDate', 'visitType'] });
      expect(screen.getByText('VISIT_DATE')).toBeInTheDocument();
      expect(screen.getByText('VISIT_TYPE')).toBeInTheDocument();
      expect(screen.queryByText('VISIT_STATUS')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId(`${mockActiveIpdEncounter.id}-status-test-id`),
      ).not.toBeInTheDocument();
    });

    const renderedHeaders = () =>
      screen
        .getAllByRole('columnheader')
        .map((th: HTMLElement) => th.textContent?.trim());

    it('renders columns in the order given by config.fields', () => {
      renderWithClient({
        fields: ['status', 'visitType', 'location', 'visitDate'],
      });
      expect(renderedHeaders()).toEqual([
        'VISIT_STATUS',
        'VISIT_TYPE',
        'VISIT_LOCATION',
        'VISIT_DATE',
      ]);
    });

    it('prepends Visit Date and Visit Type when config.fields leaves them out', () => {
      renderWithClient({ fields: ['status', 'location'] });
      expect(renderedHeaders()).toEqual([
        'VISIT_DATE',
        'VISIT_TYPE',
        'VISIT_STATUS',
        'VISIT_LOCATION',
      ]);
    });

    it('prepends only the missing mandatory column, keeping the configured position of the other', () => {
      renderWithClient({ fields: ['status', 'visitDate'] });
      expect(renderedHeaders()).toEqual([
        'VISIT_TYPE',
        'VISIT_STATUS',
        'VISIT_DATE',
      ]);
    });

    it('surfaces an unrecognised field as a column headed by the raw key rather than dropping it', () => {
      renderWithClient({ fields: ['visitDate', 'notAField'] });
      expect(screen.getByText('notAField')).toBeInTheDocument();
    });

    it('renders the visit date as a Link when navigationURL resolves (AC 8)', async () => {
      mockResolveNavigationURL.mockResolvedValue(
        '/bahmni/clinical/index.html#/default/patient/test-patient-uuid/dashboard/visit/visit-active-ipd',
      );
      renderWithClient({
        navigationURL: '/bahmni/clinical/.../{patientUuid}/{id}',
      });

      await waitFor(() => {
        const link = screen.getByTestId(
          `${mockActiveIpdEncounter.id}-visit-date-test-id`,
        );
        expect(link.tagName.toLowerCase()).toBe('a');
        expect(link).toHaveAttribute(
          'href',
          '/bahmni/clinical/index.html#/default/patient/test-patient-uuid/dashboard/visit/visit-active-ipd',
        );
      });
    });

    it('renders the visit date as plain text when no navigationURL is configured (AC 8)', () => {
      renderWithClient();
      const cell = screen.getByTestId(
        `${mockActiveIpdEncounter.id}-visit-date-test-id`,
      );
      expect(cell.tagName.toLowerCase()).toBe('span');
      expect(mockResolveNavigationURL).not.toHaveBeenCalled();
    });

    it('shows the "View IPD Dashboard" link for an IPD visit when ipdDashboardUrl is configured (AC 9)', async () => {
      mockResolveNavigationURL.mockResolvedValue(
        '/ipd/dashboard/visit-active-ipd',
      );
      renderWithClient({ ipdDashboardUrl: '/ipd/dashboard/{id}' });

      await waitFor(() => {
        const link = screen.getByTestId(
          `${mockActiveIpdEncounter.id}-ipd-dashboard-link-test-id`,
        );
        expect(link).toHaveTextContent('VIEW_IPD_DASHBOARD');
        expect(link).toHaveAttribute('href', '/ipd/dashboard/visit-active-ipd');
      });
      // The non-IPD visit should not get the link even when configured.
      expect(
        screen.queryByTestId(
          `${mockOneDayOpdEncounter.id}-ipd-dashboard-link-test-id`,
        ),
      ).not.toBeInTheDocument();
    });

    it('hides the IPD dashboard link when ipdDashboardUrl is not configured (AC 10)', () => {
      renderWithClient();
      expect(
        screen.queryByTestId(
          `${mockActiveIpdEncounter.id}-ipd-dashboard-link-test-id`,
        ),
      ).not.toBeInTheDocument();
      expect(mockResolveNavigationURL).not.toHaveBeenCalled();
    });
  });

  describe('maximumNoOfVisits', () => {
    const manyEncounters = Array.from({ length: 6 }, (_, i) => ({
      ...mockOneDayOpdEncounter,
      id: `visit-${i}`,
      period: { start: `2025-01-0${i + 1}T00:00:00.000+00:00` },
    }));

    it('limits to config.maximumNoOfVisits when set (AC 6)', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: manyEncounters,
        isLoading: false,
        isError: false,
      });
      const { container } = renderWithClient({ maximumNoOfVisits: 2 });
      expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
    });

    it('defaults to 4 visits when maximumNoOfVisits is not configured (AC 7)', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: manyEncounters,
        isLoading: false,
        isError: false,
      });
      const { container } = renderWithClient();
      expect(container.querySelectorAll('tbody tr')).toHaveLength(4);
    });

    it.each([-1, -10, 0, 2.5, 'abc'])(
      'falls back to 4 visits when maximumNoOfVisits is %p',
      (maximumNoOfVisits) => {
        (useQuery as jest.Mock).mockReturnValue({
          data: manyEncounters,
          isLoading: false,
          isError: false,
        });
        const { container } = renderWithClient({ maximumNoOfVisits });
        expect(container.querySelectorAll('tbody tr')).toHaveLength(4);
      },
    );
  });
});
