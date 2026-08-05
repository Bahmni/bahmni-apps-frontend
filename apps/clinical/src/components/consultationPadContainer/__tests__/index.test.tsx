import {
  createVisitWithFhirR4,
  dispatchAuditEvent,
  getVisitLocationUUID,
  getUserLoginLocation,
  useTranslation,
} from '@bahmni/services';
import {
  useHasPrivilege,
  useNotification,
  usePatientUUID,
} from '@bahmni/widgets';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { useClinicalAppData } from '../../../hooks/useClinicalAppData';
import { useEncounterConcepts } from '../../../hooks/useEncounterConcepts';
import { useClinicalConfig } from '../../../providers/clinicalConfig';
import { useEncounterDetailsStore } from '../../../stores/encounterDetailsStore';
import ConsultationPadContainer from '../index';

jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
  ActionArea: ({
    title,
    content,
    primaryButtonText,
    onPrimaryButtonClick,
    isPrimaryButtonDisabled,
    secondaryButtonText,
    onSecondaryButtonClick,
  }: any) => (
    <div data-testid="action-area">
      <span data-testid="action-area-title">{title}</span>
      <div>{content}</div>
      <button
        data-testid="primary-button"
        disabled={isPrimaryButtonDisabled}
        onClick={onPrimaryButtonClick}
      >
        {primaryButtonText}
      </button>
      {secondaryButtonText && (
        <button data-testid="secondary-button" onClick={onSecondaryButtonClick}>
          {secondaryButtonText}
        </button>
      )}
    </div>
  ),
  InlineNotification: ({ title, testId }: any) => (
    <div data-testid={testId ?? 'inline-notification'}>{title}</div>
  ),
  Loading: () => null,
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  createVisitWithFhirR4: jest.fn(),
  dispatchAuditEvent: jest.fn(),
  getVisitLocationUUID: jest.fn(),
  getUserLoginLocation: jest.fn(),
  useTranslation: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useHasPrivilege: jest.fn(),
  useNotification: jest.fn(),
  usePatientUUID: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../../../hooks/useClinicalAppData');
jest.mock('../../../hooks/useEncounterConcepts');
jest.mock('../../../providers/clinicalConfig');
jest.mock('../../../stores/encounterDetailsStore');

jest.mock('../../consultationPad', () => ({
  __esModule: true,
  default: () => <div data-testid="consultation-pad" />,
}));

jest.mock('../../forms/encounterDetails/EncounterDetails', () => ({
  __esModule: true,
  default: () => <div data-testid="encounter-details" />,
}));

const PATIENT_UUID = 'patient-uuid-1';
const VISIT_TYPE_OPD = { uuid: 'vt-opd', name: 'OPD' };
const VISIT_TYPE_IPD = { uuid: 'vt-ipd', name: 'IPD' };
const ENCOUNTER_TYPE = { uuid: 'et-uuid', name: 'Consultation' };
const MOCK_VISIT_LOCATION = { uuid: 'loc-uuid' };
const ENCOUNTER_SESSION_CONTEXT = { isVisitActive: false };

const buildConfig = (
  allowedVisitTypes: string[],
  defaultEncounterType?: string,
) => ({
  isLoading: false,
  error: null,
  clinicalConfig: {
    consultationPad: {
      allowedVisitTypes,
      inputControls: [
        {
          type: 'encounterDetails',
          metadata: {
            ...(defaultEncounterType !== undefined
              ? { defaultEncounterType }
              : {}),
          },
        },
      ],
    },
  },
});

const defaultEncounterConceptsResult = {
  encounterConcepts: {
    visitTypes: [VISIT_TYPE_OPD, VISIT_TYPE_IPD],
    encounterTypes: [ENCOUNTER_TYPE],
    orderTypes: [],
    conceptData: [],
  },
  loading: false,
  error: null,
  refetch: jest.fn(),
};

const mockAddNotification = jest.fn();
const mockReset = jest.fn();
const mockSetConsultationDate = jest.fn();
const mockSetRequestedEncounterType = jest.fn();
const mockInvalidateQueries = jest.fn();

const defaultStoreState = {
  selectedVisitType: null,
  selectedEncounterType: null,
  reset: mockReset,
  setConsultationDate: mockSetConsultationDate,
  setRequestedEncounterType: mockSetRequestedEncounterType,
};

const renderComponent = (
  props: Partial<React.ComponentProps<typeof ConsultationPadContainer>> = {},
) =>
  render(
    <ConsultationPadContainer
      encounterSessionStartContext={ENCOUNTER_SESSION_CONTEXT}
      onClose={jest.fn()}
      {...props}
    />,
  );

beforeEach(() => {
  jest
    .mocked(useClinicalAppData)
    .mockReturnValue({ activeEpisodeId: null } as any);
  jest
    .mocked(useTranslation)
    .mockReturnValue({ t: (key: string) => key } as any);
  jest.mocked(usePatientUUID).mockReturnValue(PATIENT_UUID);
  jest.mocked(useHasPrivilege).mockReturnValue(true);
  jest
    .mocked(useNotification)
    .mockReturnValue({ addNotification: mockAddNotification } as any);
  jest
    .mocked(useClinicalConfig)
    .mockReturnValue(buildConfig(['OPD', 'IPD']) as any);
  jest
    .mocked(useEncounterConcepts)
    .mockReturnValue(defaultEncounterConceptsResult as any);
  jest
    .mocked(useQuery)
    .mockReturnValue({ data: null, error: null, isLoading: false } as any);
  jest
    .mocked(useQueryClient)
    .mockReturnValue({ invalidateQueries: mockInvalidateQueries } as any);
  jest
    .mocked(getVisitLocationUUID)
    .mockResolvedValue(MOCK_VISIT_LOCATION as any);
  jest
    .mocked(getUserLoginLocation)
    .mockReturnValue({ uuid: 'login-loc-uuid' } as any);
  jest.mocked(createVisitWithFhirR4).mockResolvedValue(undefined as any);
  jest.mocked(dispatchAuditEvent).mockReturnValue(undefined);
  jest
    .mocked(useEncounterDetailsStore)
    .mockImplementation((selector: any) => selector(defaultStoreState));
  (useEncounterDetailsStore as any).getState = jest
    .fn()
    .mockReturnValue(defaultStoreState);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ConsultationPadContainer', () => {
  it('shows loading spinner when config is loading', () => {
    jest.mocked(useClinicalConfig).mockReturnValue({
      isLoading: true,
      clinicalConfig: null,
      error: null,
    } as any);
    renderComponent();
    expect(
      screen.getByTestId('consultation-pad-container-loading'),
    ).toBeInTheDocument();
  });

  it('shows loading spinner when active visit query is pending', () => {
    jest.mocked(useQuery).mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
    } as any);
    renderComponent();
    expect(
      screen.getByTestId('consultation-pad-container-loading'),
    ).toBeInTheDocument();
  });

  it('shows loading spinner while visit creation is in progress', async () => {
    jest.mocked(useClinicalConfig).mockReturnValue(buildConfig(['OPD']) as any);
    jest.mocked(useEncounterConcepts).mockReturnValue({
      ...defaultEncounterConceptsResult,
      encounterConcepts: {
        ...defaultEncounterConceptsResult.encounterConcepts,
        visitTypes: [VISIT_TYPE_OPD],
      },
    } as any);
    jest.mocked(createVisitWithFhirR4).mockReturnValue(new Promise(() => {}));
    renderComponent();
    await waitFor(() => {
      expect(
        screen.getByTestId('consultation-pad-container-loading'),
      ).toBeInTheDocument();
    });
  });

  it('shows warning with close button when no allowed visit types are configured', async () => {
    jest.mocked(useClinicalConfig).mockReturnValue({
      isLoading: false,
      error: null,
      clinicalConfig: {
        consultationPad: { allowedVisitTypes: [], inputControls: [] },
      },
    } as any);
    const onClose = jest.fn();
    renderComponent({ onClose });
    expect(
      screen.getByTestId('consultation-pad-container-no-privilege'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('primary-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders ConsultationPad when an active visit exists', () => {
    jest.mocked(useQuery).mockReturnValue({
      data: { id: 'visit-1' },
      error: null,
      isLoading: false,
    } as any);
    renderComponent();
    expect(screen.getByTestId('consultation-pad')).toBeInTheDocument();
  });

  it('renders ConsultationPad after visit is successfully created', async () => {
    jest.mocked(useClinicalConfig).mockReturnValue(buildConfig(['OPD']) as any);
    jest.mocked(useEncounterConcepts).mockReturnValue({
      ...defaultEncounterConceptsResult,
      encounterConcepts: {
        ...defaultEncounterConceptsResult.encounterConcepts,
        visitTypes: [VISIT_TYPE_OPD],
      },
    } as any);
    jest.mocked(createVisitWithFhirR4).mockResolvedValue(undefined as any);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId('consultation-pad')).toBeInTheDocument();
    });
  });

  it('shows no-privilege warning and calls onClose when Close is clicked', async () => {
    jest.mocked(useHasPrivilege).mockReturnValue(false);
    const onClose = jest.fn();
    renderComponent({ onClose });

    expect(
      screen.getByTestId('consultation-pad-container-no-privilege'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('primary-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls createVisitWithFhirR4 with correct args, dispatches audit event, and resets store on auto-create', async () => {
    jest.mocked(useClinicalConfig).mockReturnValue(buildConfig(['OPD']) as any);
    jest.mocked(useEncounterConcepts).mockReturnValue({
      ...defaultEncounterConceptsResult,
      encounterConcepts: {
        ...defaultEncounterConceptsResult.encounterConcepts,
        visitTypes: [VISIT_TYPE_OPD],
      },
    } as any);
    renderComponent();

    await waitFor(() => {
      expect(createVisitWithFhirR4).toHaveBeenCalledWith(
        PATIENT_UUID,
        MOCK_VISIT_LOCATION.uuid,
        VISIT_TYPE_OPD.uuid,
        undefined,
      );
    });
    expect(dispatchAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'START_VISIT',
        messageParams: { visitType: 'OPD' },
      }),
    );
    expect(mockReset).toHaveBeenCalled();
  });

  it('shows error notification when visit creation fails', async () => {
    jest.mocked(useClinicalConfig).mockReturnValue(buildConfig(['OPD']) as any);
    jest.mocked(useEncounterConcepts).mockReturnValue({
      ...defaultEncounterConceptsResult,
      encounterConcepts: {
        ...defaultEncounterConceptsResult.encounterConcepts,
        visitTypes: [VISIT_TYPE_OPD],
      },
    } as any);
    jest
      .mocked(createVisitWithFhirR4)
      .mockRejectedValue(new Error('Failed to create visit'));
    renderComponent();

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      );
    });
  });

  it('shows error notification when active visit query fails', async () => {
    jest.mocked(useQuery).mockReturnValue({
      data: undefined,
      error: new Error('Query failed'),
      isLoading: false,
    } as any);
    renderComponent();

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      );
    });
  });

  it('renders EncounterDetails form when multiple visit types are allowed', () => {
    renderComponent();
    expect(screen.getByTestId('encounter-details')).toBeInTheDocument();
    expect(screen.getByTestId('action-area')).toBeInTheDocument();
  });

  it('disables Start Visit button when no visit/encounter type selected; enables when both selected', () => {
    const { unmount } = renderComponent();
    expect(screen.getByTestId('primary-button')).toBeDisabled();
    unmount();

    jest.mocked(useEncounterDetailsStore).mockImplementation((selector: any) =>
      selector({
        ...defaultStoreState,
        selectedVisitType: VISIT_TYPE_OPD,
        selectedEncounterType: ENCOUNTER_TYPE,
      }),
    );
    renderComponent();
    expect(screen.getByTestId('primary-button')).not.toBeDisabled();
  });

  it('resets store and calls onClose when Cancel is clicked', async () => {
    const onClose = jest.fn();
    renderComponent({ onClose });

    await userEvent.click(screen.getByTestId('secondary-button'));

    expect(mockReset).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('creates visit and renders ConsultationPad when Start Visit is clicked', async () => {
    const storeWithSelection = {
      ...defaultStoreState,
      selectedVisitType: VISIT_TYPE_OPD,
      selectedEncounterType: ENCOUNTER_TYPE,
    };
    jest
      .mocked(useEncounterDetailsStore)
      .mockImplementation((selector: any) => selector(storeWithSelection));
    (useEncounterDetailsStore as any).getState = jest
      .fn()
      .mockReturnValue(storeWithSelection);

    renderComponent();
    await userEvent.click(screen.getByTestId('primary-button'));

    await waitFor(() => {
      expect(createVisitWithFhirR4).toHaveBeenCalledWith(
        PATIENT_UUID,
        MOCK_VISIT_LOCATION.uuid,
        VISIT_TYPE_OPD.uuid,
        undefined,
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId('consultation-pad')).toBeInTheDocument();
    });
  });

  it('passes activeEpisodeId to createVisitWithFhirR4 when available', async () => {
    const EPISODE_UUID = 'episode-uuid-1';
    jest
      .mocked(useClinicalAppData)
      .mockReturnValue({ activeEpisodeId: EPISODE_UUID } as any);
    jest.mocked(useClinicalConfig).mockReturnValue(buildConfig(['OPD']) as any);
    jest.mocked(useEncounterConcepts).mockReturnValue({
      ...defaultEncounterConceptsResult,
      encounterConcepts: {
        ...defaultEncounterConceptsResult.encounterConcepts,
        visitTypes: [VISIT_TYPE_OPD],
      },
    } as any);
    renderComponent();

    await waitFor(() => {
      expect(createVisitWithFhirR4).toHaveBeenCalledWith(
        PATIENT_UUID,
        MOCK_VISIT_LOCATION.uuid,
        VISIT_TYPE_OPD.uuid,
        EPISODE_UUID,
      );
    });
  });

  it('sets consultation date on mount', () => {
    renderComponent();
    expect(mockSetConsultationDate).toHaveBeenCalledWith(expect.any(Date));
  });

  it('sets requestedEncounterType from config defaultEncounterType, or null when absent', () => {
    jest
      .mocked(useClinicalConfig)
      .mockReturnValue(buildConfig(['OPD', 'IPD'], 'Consultation') as any);
    const { unmount } = renderComponent();
    expect(mockSetRequestedEncounterType).toHaveBeenCalledWith('Consultation');
    unmount();

    mockSetRequestedEncounterType.mockClear();
    jest
      .mocked(useClinicalConfig)
      .mockReturnValue(buildConfig(['OPD', 'IPD']) as any);
    renderComponent();
    expect(mockSetRequestedEncounterType).toHaveBeenCalledWith(null);
  });
});
