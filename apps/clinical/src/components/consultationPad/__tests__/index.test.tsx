import {
  dispatchAuditEvent,
  dispatchConsultationSaved,
} from '@bahmni/services';
import { useActivePractitioner, useNotification } from '@bahmni/widgets';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useClinicalAppData } from '../../../hooks/useClinicalAppData';
import { useEncounterSession } from '../../../hooks/useEncounterSession';
import { useClinicalConfig } from '../../../providers/clinicalConfig';
import { useEncounterDetailsStore } from '../../../stores/encounterDetailsStore';
import { useObservationFormsStore } from '../../../stores/observationFormsStore';
import ConsultationPad from '../index';
import { INPUT_CONTROL_REGISTRY } from '../inputControlRegistry';
import { submitConsultation } from '../services';
import { captureUpdatedResources, getActiveEntries } from '../utils';
import {
  mockObsFormsState,
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
jest.mock('../../../hooks/useEncounterSession');
jest.mock('../../../providers/clinicalConfig');

jest.mock('../inputControlRegistry', () => ({
  INPUT_CONTROL_REGISTRY: [
    {
      key: 'allergies',
      component: () => null,
      reset: jest.fn(),
      validate: jest.fn(),
      hasData: jest.fn(),
      subscribe: jest.fn(),
    },
    {
      key: 'medications',
      component: () => null,
      reset: jest.fn(),
      validate: jest.fn(),
      hasData: jest.fn(),
      subscribe: jest.fn(),
    },
    {
      key: 'observationForms',
      component: () => null,
      reset: jest.fn(),
      validate: jest.fn(),
      hasData: jest.fn(),
      subscribe: jest.fn(),
    },
  ],
}));

jest.mock('../../forms/observations/ObservationFormsContainer', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../services', () => ({
  submitConsultation: jest.fn(),
}));

jest.mock('../utils', () => ({
  getActiveEntries: jest.fn(),
  captureUpdatedResources: jest.fn(),
}));

const defaultEncounterDetailsState = {
  isEncounterDetailsFormReady: true,
  isError: false,
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
  INPUT_CONTROL_REGISTRY.forEach((entry) => {
    (entry.validate as jest.Mock).mockReturnValue(true);
    (entry.hasData as jest.Mock).mockReturnValue(false);
    (entry.subscribe as jest.Mock).mockReturnValue(jest.fn());
  });

  jest.mocked(getActiveEntries).mockReturnValue(INPUT_CONTROL_REGISTRY as any);
  jest.mocked(captureUpdatedResources).mockReturnValue(mockUpdatedResources);
  jest.mocked(submitConsultation).mockResolvedValue(mockSubmitResult);

  jest
    .mocked(useEncounterDetailsStore)
    .mockImplementation((selector: any) =>
      selector(defaultEncounterDetailsState),
    );
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
  jest
    .mocked(useEncounterSession)
    .mockReturnValue({ activeEncounter: null } as any);
  jest
    .mocked(useClinicalConfig)
    .mockReturnValue({ clinicalConfig: null } as any);
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
    ])('is disabled when %s', (_, storeOverride, withData) => {
      jest
        .mocked(useEncounterDetailsStore)
        .mockImplementation((selector: any) =>
          selector({ ...defaultEncounterDetailsState, ...storeOverride }),
        );
      if (withData) {
        (INPUT_CONTROL_REGISTRY[0].hasData as jest.Mock).mockReturnValue(true);
      }

      renderComponent();

      expect(screen.getByTestId('primary-button')).toBeDisabled();
    });

    it('is enabled when form is ready and has data', () => {
      (INPUT_CONTROL_REGISTRY[0].hasData as jest.Mock).mockReturnValue(true);

      renderComponent();

      expect(screen.getByTestId('primary-button')).not.toBeDisabled();
    });
  });

  describe('cancel', () => {
    it('resets all entries and calls onClose', async () => {
      const onClose = jest.fn();

      renderComponent({ onClose });
      await userEvent.click(screen.getByTestId('secondary-button'));

      INPUT_CONTROL_REGISTRY.forEach((entry) =>
        expect(entry.reset).toHaveBeenCalled(),
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('submit', () => {
    const enableSubmit = () => {
      (INPUT_CONTROL_REGISTRY[0].hasData as jest.Mock).mockReturnValue(true);
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

    it('shows error notification on API failure', async () => {
      jest
        .mocked(submitConsultation)
        .mockRejectedValue(new Error('Server error'));
      enableSubmit();

      renderComponent();
      await userEvent.click(screen.getByTestId('primary-button'));

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'error', message: 'Server error' }),
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
