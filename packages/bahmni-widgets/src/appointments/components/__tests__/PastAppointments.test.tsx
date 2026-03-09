import PastAppointments from '../PastAppointments';
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
  default: ({ emptyMessageKey }: any) => <div>{emptyMessageKey}</div>,
}));

describe('PastAppointments', () => {
  const mocks = getAppointmentMocks();

  beforeEach(() => {
    setupAppointmentMocks(mocks);
  });

  const testCases = getAppointmentTestCases(
    {
      Component: PastAppointments,
      queryKeyPrefix: 'appointments-past',
      testProps: { numberOfPastAppointments: 5 },
    },
    mocks,
  );

  it('should render loading state', testCases.renderLoadingTest);
  it(
    'should display error notification when query fails',
    testCases.errorNotificationTest,
  );
  it(
    'should call useQuery with correct parameters including numberOfPastAppointments',
    testCases.correctParametersTest,
  );
});
