import {
  cancelEpisodeOfCare,
  dispatchAuditEvent,
  searchFHIRConcepts,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNotification } from '../../notification';
import CancelEpisodeOfCareModal from '../CancelEpisodeOfCareModal';
import { ProgramAction } from '../model';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  cancelEpisodeOfCare: jest.fn(),
  dispatchAuditEvent: jest.fn(),
  searchFHIRConcepts: jest.fn(),
}));
jest.mock('../../notification');
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: () => 'patient-uuid',
}));

const action: ProgramAction = {
  type: 'cancel',
  translationKey: 'PROGRAM_ACTION_CANCEL_EOC',
  requiredPrivileges: ['app:eoc:cancel'],
  visibleInStates: ['Assessment in progress'],
  reasonConceptSetUuid: 'reason-set-uuid',
};
const valueSet = {
  resourceType: 'ValueSet',
  status: 'active',
  expansion: {
    timestamp: '2026-01-01',
    contains: [{ code: 'declined-uuid', display: 'Patient declines' }],
  },
};

const mockAddNotification = jest.fn();
const onClose = jest.fn();
const onSuccess = jest.fn();

type User = ReturnType<typeof userEvent.setup>;

const renderModal = (queryClient = new QueryClient()) =>
  render(
    <QueryClientProvider client={queryClient}>
      <CancelEpisodeOfCareModal
        episodeUuid="episode-uuid"
        action={action}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </QueryClientProvider>,
  );

const chooseReason = async (user: User, name: string) => {
  await user.click(await screen.findByRole('combobox'));
  await user.click(await screen.findByText(name));
};

const clickCancel = (user: User) =>
  user.click(screen.getByText('CANCELLATION_MODAL_SUBMIT'));

describe('CancelEpisodeOfCareModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
    (searchFHIRConcepts as jest.Mock).mockResolvedValue(valueSet);
    (cancelEpisodeOfCare as jest.Mock).mockResolvedValue('');
  });

  it('should offer the members of the configured concept set as reasons', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByRole('combobox'));

    expect(searchFHIRConcepts).toHaveBeenCalledWith('reason-set-uuid');
    expect(await screen.findByText('Patient declines')).toBeInTheDocument();
  });

  it('should reuse the cached reasons when the dialog is opened again', async () => {
    const queryClient = new QueryClient();
    const { unmount } = renderModal(queryClient);
    await waitFor(() => expect(searchFHIRConcepts).toHaveBeenCalledTimes(1));
    unmount();

    renderModal(queryClient);
    await screen.findByRole('combobox');

    expect(searchFHIRConcepts).toHaveBeenCalledTimes(1);
  });

  it('should cancel the episode with the selected reason and report success', async () => {
    const user = userEvent.setup();
    renderModal();
    await chooseReason(user, 'Patient declines');

    await clickCancel(user);

    await waitFor(() =>
      expect(cancelEpisodeOfCare).toHaveBeenCalledWith('episode-uuid', {
        reason: 'declined-uuid',
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' }),
    );
  });

  it('should record an audit event for the cancellation', async () => {
    const user = userEvent.setup();
    renderModal();
    await chooseReason(user, 'Patient declines');

    await clickCancel(user);

    await waitFor(() =>
      expect(dispatchAuditEvent).toHaveBeenCalledWith({
        eventType: 'CANCEL_EOC',
        patientUuid: 'patient-uuid',
        messageParams: {
          episodeUuid: 'episode-uuid',
          reason: 'Patient declines',
        },
      }),
    );
  });

  it('should not offer a note field', async () => {
    renderModal();
    await screen.findByRole('combobox');

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('should show the backend message and not report success when the cancellation fails', async () => {
    (cancelEpisodeOfCare as jest.Mock).mockRejectedValue(
      new Error('EOC cannot be cancelled as it is cancelled'),
    );
    const user = userEvent.setup();
    renderModal();
    await chooseReason(user, 'Patient declines');

    await clickCancel(user);

    await waitFor(() =>
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'EOC cannot be cancelled as it is cancelled',
        }),
      ),
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(dispatchAuditEvent).not.toHaveBeenCalled();
  });

  it('should show an error when the reasons cannot be loaded', async () => {
    (searchFHIRConcepts as jest.Mock).mockRejectedValue(new Error('boom'));
    renderModal(
      new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    );

    await waitFor(() =>
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'PROGRAM_CANCEL_EOC_REASONS_LOAD_ERROR',
        }),
      ),
    );
  });
});
