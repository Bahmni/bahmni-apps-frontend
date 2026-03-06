import { useTranslation } from '@bahmni/services';
import { useActivePractitioner, useUserPrivilege } from '@bahmni/widgets';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ConsultationActionButton from '../ConsultationActionButton';
import '@testing-library/jest-dom';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
}));
jest.mock('@bahmni/widgets');
jest.mock('../../../hooks/useEncounterSession');

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockUseActivePractitioner = useActivePractitioner as jest.MockedFunction<
  typeof useActivePractitioner
>;
const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;
const mockUseEncounterSession = require('../../../hooks/useEncounterSession')
  .useEncounterSession as jest.Mock;

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
    });
  });

  describe('when user has Add Encounters privilege', () => {
    beforeEach(() => {
      mockUseUserPrivilege.mockReturnValue({
        userPrivileges: [{ name: 'Add Encounters' }],
      } as any);
    });

    it('renders button, shows correct text, and handles disabled states', () => {
      const { rerender } = render(<ConsultationActionButton {...defaultProps} />);

      // Default: New Consultation
      expect(screen.getByTestId('consultation-action-button')).toHaveTextContent(
        'CONSULTATION_ACTION_NEW',
      );

      // Edit state when active encounter exists
      mockUseEncounterSession.mockReturnValue({
        editActiveEncounter: true,
        isLoading: false,
      });
      rerender(<ConsultationActionButton {...defaultProps} />);
      expect(screen.getByTestId('consultation-action-button')).toHaveTextContent(
        'CONSULTATION_ACTION_EDIT',
      );

      // Disabled when action area is visible
      rerender(
        <ConsultationActionButton {...defaultProps} isActionAreaVisible={true} />,
      );
      expect(screen.getByTestId('consultation-action-button')).toBeDisabled();

      // Disabled when loading
      mockUseEncounterSession.mockReturnValue({
        editActiveEncounter: false,
        isLoading: true,
      });
      rerender(<ConsultationActionButton {...defaultProps} />);
      expect(screen.getByTestId('consultation-action-button')).toBeDisabled();
    });
  });

  it('hides button when user lacks Add Encounters privilege', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: null,
    } as any);

    render(<ConsultationActionButton {...defaultProps} />);

    expect(
      screen.queryByTestId('consultation-action-button'),
    ).not.toBeInTheDocument();
  });
});
