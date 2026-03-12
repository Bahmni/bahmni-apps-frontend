import { useTranslation } from '@bahmni/services';
import { useActivePractitioner, useHasPrivilege } from '@bahmni/widgets';
import { render, screen } from '@testing-library/react';
import { useEncounterSession } from '../../../hooks/useEncounterSession';
import ConsultationActionButton from '../ConsultationActionButton';
import '@testing-library/jest-dom';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
}));
jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useActivePractitioner: jest.fn(),
  useHasPrivilege: jest.fn(),
}));
jest.mock('../../../hooks/useEncounterSession', () => ({
  useEncounterSession: jest.fn(),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockUseActivePractitioner = useActivePractitioner as jest.MockedFunction<
  typeof useActivePractitioner
>;
const mockUseHasPrivilege = useHasPrivilege as jest.MockedFunction<
  typeof useHasPrivilege
>;
const mockUseEncounterSession = useEncounterSession as jest.MockedFunction<
  typeof useEncounterSession
>;

describe('ConsultationActionButton', () => {
  const mockSetIsActionAreaVisible = jest.fn();

  const defaultProps = {
    isActionAreaVisible: false,
    setIsActionAreaVisible: mockSetIsActionAreaVisible,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTranslation.mockReturnValue({ t: (key: string) => key } as any);
    mockUseActivePractitioner.mockReturnValue({
      practitioner: { uuid: 'practitioner-uuid' },
    } as any);
    mockUseEncounterSession.mockReturnValue({
      editActiveEncounter: false,
      isLoading: false,
    } as any);
  });

  describe('when user has Add Encounters privilege', () => {
    beforeEach(() => {
      mockUseHasPrivilege.mockReturnValue(true);
    });

    it('renders button with default "New Consultation" text', () => {
      render(<ConsultationActionButton {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /CONSULTATION_ACTION_NEW/i }),
      ).toBeInTheDocument();
    });

    it('shows "Edit Consultation" text when active encounter exists', () => {
      mockUseEncounterSession.mockReturnValue({
        editActiveEncounter: true,
        isLoading: false,
      } as any);
      render(<ConsultationActionButton {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /CONSULTATION_ACTION_EDIT/i }),
      ).toBeInTheDocument();
    });

    it('disables button when action area is visible', () => {
      const { rerender } = render(
        <ConsultationActionButton {...defaultProps} />,
      );

      expect(
        screen.getByRole('button', { name: /CONSULTATION_ACTION_NEW/i }),
      ).not.toBeDisabled();

      rerender(
        <ConsultationActionButton {...defaultProps} isActionAreaVisible />,
      );

      expect(
        screen.getByRole('button', {
          name: /CONSULTATION_ACTION_IN_PROGRESS/i,
        }),
      ).toBeDisabled();
    });

    it('disables button when loading', () => {
      mockUseEncounterSession.mockReturnValue({
        editActiveEncounter: false,
        isLoading: true,
      } as any);
      render(<ConsultationActionButton {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /CONSULTATION_ACTION_NEW/i }),
      ).toBeDisabled();
    });
  });

  it('hides button when user lacks Add Encounters privilege', () => {
    mockUseHasPrivilege.mockReturnValue(false);

    render(<ConsultationActionButton {...defaultProps} />);

    expect(
      screen.queryByRole('button', { name: /CONSULTATION_ACTION_(NEW|EDIT)/i }),
    ).not.toBeInTheDocument();
  });
});
