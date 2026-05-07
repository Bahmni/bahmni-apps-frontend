import {
  dispatchAuditEvent,
  dispatchConsultationSaved,
} from '@bahmni/services';
import { useActivePractitioner, useNotification } from '@bahmni/widgets';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useClinicalAppData } from '../../../hooks/useClinicalAppData';
import { useEncounterConcepts } from '../../../hooks/useEncounterConcepts';
import { useEncounterSession } from '../../../hooks/useEncounterSession';
import { useClinicalConfig } from '../../../providers/clinicalConfig';
import { useEncounterDetailsStore } from '../../../stores/encounterDetailsStore';
import { useObservationFormsStore } from '../../../stores/observationFormsStore';
import ConsultationPad from '../index';
import { submitConsultation } from '../services';
import {
  loadEncounterInputControls,
  captureUpdatedResources,
  getActiveEntries,
} from '../utils';
import {
  mockEncounterConcepts,
  mockObsFormsState,
  mockRegistry,
  mockSubmitResult,
  mockUpdatedResources,
} from './__mocks__/indexMocks';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
  ActionArea: ({
    title,
    content,
    onPrimaryButtonClick,
    onSecondaryButtonClick,
    isPrimaryButtonDisabled,
    hidden,
  }: any) => (
    <div data-testid="action-area" data-hidden={String(!!hidden)}>
      <span data-testid="action-area-title">{title}</span>
      <div data-testid="action-area-content">{content}</div>
      <button
        data-testid="primary-button"
        onClick={onPrimaryButtonClick}
        disabled={isPrimaryButtonDisabled}
      >
        Done
      </button>
      <button data-testid="secondary-button" onClick={onSecondaryButtonClick}>
        Cancel
      </button>
    </div>
  ),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  dispatchAuditEvent: jest.fn(),
  dispatchConsultationSaved: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useActivePractitioner: jest.fn(),
  useHasPrivilege: jest.fn().mockReturnValue(true),
  useNotification: jest.fn(),
}));

jest.mock('../../../stores/encounterDetailsStore');
jest.mock('../../../stores/observationFormsStore');
jest.mock('../../../hooks/useClinicalAppData');
jest.mock('../../../hooks/useEncounterConcepts');
jest.mock('../../../hooks/useEncounterSession');
jest.mock('../../../providers/clinicalConfig');

jest.mock('../../forms/observations/ObservationFormsContainer', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../services', () => ({
  submitConsultation: jest.fn(),
}));

jest.mock('../utils', () => ({
  loadEncounterInputControls: jest.fn(),
  getActiveEntries: jest.fn(),
  captureUpdatedResources: jest.fn(),
}));

const defaultEncounterDetailsState = {
  isEncounterDetailsFormReady: true,
  isError: false,
  setRequestedEncounterType: jest.fn(),
};

const mockAddNotification = jest.fn();

const renderComponent = (
  props: Partial<React.ComponentProps<typeof ConsultationPad>> = {},
) =>
  render(
    <ConsultationPad
      encounterType="Consultation"
      onClose={jest.fn()}
      {...props}
    />,
  );

beforeEach(() => {
  mockRegistry.forEach((entry) => {
    (entry.validate as jest.Mock).mockReturnValue(true);
    (entry.hasData as jest.Mock).mockReturnValue(false);
    (entry.subscribe as jest.Mock).mockReturnValue(jest.fn());
  });

  jest.mocked(loadEncounterInputControls).mockReturnValue(mockRegistry);
  jest.mocked(getActiveEntries).mockReturnValue(mockRegistry as any);
  jest.mocked(captureUpdatedResources).mockReturnValue(mockUpdatedResources);
  jest.mocked(submitConsultation).mockResolvedValue(mockSubmitResult);

  jest
    .mocked(useEncounterDetailsStore)
    .mockImplementation((selector: any) =>
      selector(defaultEncounterDetailsState),
    );
  (useEncounterDetailsStore as any).getState = jest
    .fn()
    .mockReturnValue(defaultEncounterDetailsState);
  jest
    .mocked(useObservationFormsStore)
    .mockReturnValue(mockObsFormsState as any);

  jest
    .mocked(useActivePractitioner)
    .mockReturnValue({ practitioner: null } as any);
  jest
    .mocked(useNotification)
    .mockReturnValue({ addNotification: mockAddNotification } as any);
  jest.mocked(useClinicalAppData).mockReturnValue({ episodeOfCare: [] } as any);
  jest.mocked(useEncounterConcepts).mockReturnValue({
    encounterConcepts: mockEncounterConcepts,
    loading: false,
    error: null,
    refetch: jest.fn(),
  } as any);
  jest
    .mocked(useEncounterSession)
    .mockReturnValue({ activeEncounter: null } as any);
  jest
    .mocked(useClinicalConfig)
    .mockReturnValue({ clinicalConfig: null } as any);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ConsultationPad', () => {
  describe('content rendering', () => {
    it('renders error state when isError is true', () => {
      jest
        .mocked(useEncounterDetailsStore)
        .mockImplementation((selector: any) =>
          selector({ ...defaultEncounterDetailsState, isError: true }),
        );

      renderComponent();

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(
        screen.getByText(
          'An error occurred while loading the consultation pad. Please try again later.',
        ),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('allergies-divider')).not.toBeInTheDocument();
    });

    it('hides ActionArea when viewing a form', () => {
      jest.mocked(useObservationFormsStore).mockReturnValue({
        ...mockObsFormsState,
        viewingForm: { uuid: 'form-uuid', name: 'Vitals' } as any,
      } as any);

      renderComponent();

      expect(screen.getByTestId('action-area')).toHaveAttribute(
        'data-hidden',
        'true',
      );
    });
  });

  describe('submit button disabled states', () => {
    it.each([
      ['isError', { isError: true }, true],
      [
        'encounter form not ready',
        { isEncounterDetailsFormReady: false },
        true,
      ],
      ['no consultation data', {}, false],
    ])('is disabled when %s', (_, storeOverride, hasData) => {
      jest
        .mocked(useEncounterDetailsStore)
        .mockImplementation((selector: any) =>
          selector({ ...defaultEncounterDetailsState, ...storeOverride }),
        );
      (mockRegistry[0].hasData as jest.Mock).mockReturnValue(hasData);

      renderComponent();

      expect(screen.getByTestId('primary-button')).toBeDisabled();
    });

    it('is enabled when form is ready and has data', () => {
      (mockRegistry[0].hasData as jest.Mock).mockReturnValue(true);

      renderComponent();

      expect(screen.getByTestId('primary-button')).not.toBeDisabled();
    });
  });

  describe('resolvedEncounterType', () => {
    it('falls back to config defaultEncounterType when encounterType prop is empty', () => {
      jest.mocked(useClinicalConfig).mockReturnValue({
        clinicalConfig: {
          consultationPad: {
            inputControls: [
              {
                type: 'encounterDetails',
                metadata: { defaultEncounterType: 'OPD' },
              },
            ],
          },
        },
      } as any);

      renderComponent({ encounterType: '' });

      expect(
        defaultEncounterDetailsState.setRequestedEncounterType,
      ).toHaveBeenCalledWith('OPD');
    });
  });

  describe('encounterType prop validation', () => {
    it('renders error state when encounterType prop is not in the configured list', () => {
      renderComponent({ encounterType: 'UnknownType' });

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders skeleton while encounter concepts are loading and encounterType prop is set', () => {
      jest.mocked(useEncounterConcepts).mockReturnValue({
        encounterConcepts: null,
        loading: true,
        error: null,
        refetch: jest.fn(),
      } as any);

      renderComponent({ encounterType: 'Consultation' });

      expect(screen.queryByTestId('allergies-divider')).not.toBeInTheDocument();
    });

    it.each([
      ['valid', 'Consultation'],
      ['empty', ''],
    ])(
      'does not show error state when encounterType is %s',
      (_, encounterType) => {
        renderComponent({ encounterType });

        expect(
          screen.queryByText('Something went wrong'),
        ).not.toBeInTheDocument();
      },
    );
  });

  describe('lifecycle', () => {
    it('resets active entries on unmount', () => {
      const { unmount } = renderComponent();
      unmount();

      mockRegistry.forEach((entry) => expect(entry.reset).toHaveBeenCalled());
    });
  });

  describe('useEncounterSession integration', () => {
    it('passes selectedEncounterType uuid to useEncounterSession', () => {
      jest
        .mocked(useEncounterDetailsStore)
        .mockImplementation((selector: any) =>
          selector({
            ...defaultEncounterDetailsState,
            selectedEncounterType: {
              uuid: 'encounter-type-uuid',
              name: 'Consultation',
            },
          }),
        );

      renderComponent();

      expect(useEncounterSession).toHaveBeenCalledWith(
        expect.objectContaining({ encounterTypeUUID: 'encounter-type-uuid' }),
      );
    });
  });

  describe('cancel', () => {
    it('resets all entries and calls onClose', async () => {
      const onClose = jest.fn();

      renderComponent({ onClose });
      await userEvent.click(screen.getByTestId('secondary-button'));

      mockRegistry.forEach((entry) => expect(entry.reset).toHaveBeenCalled());
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('submit', () => {
    const enableSubmit = () => {
      (mockRegistry[0].hasData as jest.Mock).mockReturnValue(true);
    };

    it('dispatches events, shows success notification, and closes on success', async () => {
      const onClose = jest.fn();
      enableSubmit();

      renderComponent({ onClose });
      await userEvent.click(screen.getByTestId('primary-button'));

      await waitFor(() => {
        expect(submitConsultation).toHaveBeenCalled();
        expect(dispatchAuditEvent).toHaveBeenCalled();
        expect(dispatchConsultationSaved).toHaveBeenCalled();
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'success' }),
        );
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('shows observation forms validation error and does not submit when observationForms entry is invalid', async () => {
      const obsEntry = mockRegistry.find((e) => e.key === 'observationForms')!;
      (obsEntry.hasData as jest.Mock).mockReturnValue(true);
      (obsEntry.validate as jest.Mock).mockReturnValue(false);
      renderComponent();
      await userEvent.click(screen.getByTestId('primary-button'));

      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      );
      expect(submitConsultation).not.toHaveBeenCalled();
    });

    it.each([
      ['Error instance', new Error('Server error'), 'Server error'],
      [
        'non-Error rejection',
        'unexpected failure',
        'Error creating consultation bundle',
      ],
    ])(
      'shows error notification when submit fails with %s',
      async (_, rejection, expectedMessage) => {
        jest.mocked(submitConsultation).mockRejectedValue(rejection);
        enableSubmit();

        renderComponent();
        await userEvent.click(screen.getByTestId('primary-button'));

        await waitFor(() => {
          expect(mockAddNotification).toHaveBeenCalledWith(
            expect.objectContaining({
              type: 'error',
              message: expectedMessage,
            }),
          );
        });
      },
    );

    it.each([
      [
        'episodeOfCare uuids',
        () =>
          jest.mocked(useClinicalAppData).mockReturnValue({
            episodeOfCare: [{ uuid: 'eoc-1' }, { uuid: 'eoc-2' }],
          } as any),
        { episodeOfCareUuids: ['eoc-1', 'eoc-2'] },
      ],
      [
        'statDurationInMilliseconds from config',
        () =>
          jest.mocked(useClinicalConfig).mockReturnValue({
            clinicalConfig: {
              consultationPad: { statDurationInMilliseconds: 3000 },
            },
          } as any),
        { statDurationInMilliseconds: 3000 },
      ],
    ])('passes %s to submitConsultation', async (_, setup, expectedArgs) => {
      setup();
      enableSubmit();

      renderComponent();
      await userEvent.click(screen.getByTestId('primary-button'));

      await waitFor(() => {
        expect(submitConsultation).toHaveBeenCalledWith(
          expect.objectContaining(expectedArgs),
        );
      });
    });
  });

  it('matches snapshot', () => {
    const { container } = renderComponent();
    expect(container).toMatchSnapshot();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderComponent();
    expect(await axe(container)).toHaveNoViolations();
  });
});
