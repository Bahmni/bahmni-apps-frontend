import { act, render } from '@testing-library/react';
import AppointmentTabContent from '../AppointmentTabContent';
import UpcomingAppointments from '../UpcomingAppointments';
import {
  getAppointmentMocks,
  setupAppointmentMocks,
  getAppointmentTestCases,
} from './appointmentComponentTestHelper';

jest.mock('@tanstack/react-query');
jest.mock('@bahmni/services');
jest.mock('../../../notification');
jest.mock('../AppointmentTabContent', () => ({
  __esModule: true,
  default: jest.fn(({ emptyMessageKey }: any) => <div>{emptyMessageKey}</div>),
}));

const mockAppointmentTabContent = AppointmentTabContent as jest.Mock;

const defaultProps = {
  patientUUID: 'test-uuid',
  pageSize: 10,
  headers: [],
  sortable: [],
  renderCell: jest.fn(),
};

describe('UpcomingAppointments', () => {
  const mocks = getAppointmentMocks();

  beforeEach(() => {
    setupAppointmentMocks(mocks);
    mockAppointmentTabContent.mockImplementation(({ emptyMessageKey }: any) => (
      <div>{emptyMessageKey}</div>
    ));
  });

  const testCases = getAppointmentTestCases(
    {
      Component: UpcomingAppointments,
      queryKeyPrefix: 'appointments-upcoming',
    },
    mocks,
  );

  it('should render loading state', testCases.renderLoadingTest);
  it(
    'should display error notification when query fails',
    testCases.errorNotificationTest,
  );
  it(
    'should call useQuery with correct parameters',
    testCases.correctParametersTest,
  );

  describe('handlePageChange', () => {
    it('should update page when pageSize is unchanged', () => {
      let capturedOnPageChange: ((p: number, ps: number) => void) | undefined;
      mockAppointmentTabContent.mockImplementation(({ onPageChange }: any) => {
        capturedOnPageChange = onPageChange;
        return <div />;
      });

      mocks.mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<UpcomingAppointments {...defaultProps} />);

      expect(mocks.mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining([
            'appointments-upcoming',
            'test-uuid',
            1,
            10,
          ]),
        }),
      );

      act(() => capturedOnPageChange!(2, 10));

      expect(mocks.mockUseQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining([
            'appointments-upcoming',
            'test-uuid',
            2,
            10,
          ]),
        }),
      );
    });

    it('should reset to page 1 when pageSize changes', () => {
      let capturedOnPageChange: ((p: number, ps: number) => void) | undefined;
      mockAppointmentTabContent.mockImplementation(({ onPageChange }: any) => {
        capturedOnPageChange = onPageChange;
        return <div />;
      });

      mocks.mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<UpcomingAppointments {...defaultProps} />);

      act(() => capturedOnPageChange!(3, 10));
      act(() => capturedOnPageChange!(1, 25));

      expect(mocks.mockUseQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining([
            'appointments-upcoming',
            'test-uuid',
            1,
            25,
          ]),
        }),
      );
    });
  });
});
