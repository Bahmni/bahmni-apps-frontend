import { useTranslation, hasPrivilege } from '@bahmni/services';
import { useActivePractitioner, useUserPrivilege } from '@bahmni/widgets';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ConsultationActionButton from '../ConsultationActionButton';
import { CONSULTATION_PAD_PRIVILEGES } from '../../../constants/consultationPadPrivileges';
import '@testing-library/jest-dom';

jest.mock('@bahmni/services');
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
const mockHasPrivilege = hasPrivilege as jest.MockedFunction<
  typeof hasPrivilege
>;

describe('ConsultationActionButton - Privilege Check', () => {
  const mockSetIsActionAreaVisible = jest.fn();

  const defaultProps = {
    isActionAreaVisible: false,
    setIsActionAreaVisible: mockSetIsActionAreaVisible,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    } as any);

    mockUseActivePractitioner.mockReturnValue({
      uuid: 'practitioner-uuid',
      practitioner: { uuid: 'practitioner-uuid' },
    } as any);

    (require('../../../hooks/useEncounterSession').useEncounterSession as jest.Mock).mockReturnValue({
      editActiveEncounter: false,
      isLoading: false,
    });
  });

  describe('when user has Add Encounters privilege', () => {
    beforeEach(() => {
      mockUseUserPrivilege.mockReturnValue({
        userPrivileges: [
          { uuid: '1', name: CONSULTATION_PAD_PRIVILEGES.ENCOUNTER },
        ],
        isLoading: false,
        error: null,
      } as any);

      mockHasPrivilege.mockReturnValue(true);
    });

    it('should render the button', () => {
      render(
        <ConsultationActionButton
          {...defaultProps}
        />,
      );

      const button = screen.getByTestId('consultation-action-button');
      expect(button).toBeInTheDocument();
    });

    it('should display New Consultation text when no active encounter', () => {
      render(
        <ConsultationActionButton
          {...defaultProps}
        />,
      );

      const button = screen.getByTestId('consultation-action-button');
      expect(button).toHaveTextContent('CONSULTATION_ACTION_NEW');
    });

    it('should display Edit Consultation text when active encounter exists', () => {
      (require('../../../hooks/useEncounterSession').useEncounterSession as jest.Mock).mockReturnValue({
        editActiveEncounter: true,
        isLoading: false,
      });

      render(
        <ConsultationActionButton
          {...defaultProps}
        />,
      );

      const button = screen.getByTestId('consultation-action-button');
      expect(button).toHaveTextContent('CONSULTATION_ACTION_EDIT');
    });

    it('should be disabled when action area is visible', () => {
      render(
        <ConsultationActionButton
          {...defaultProps}
          isActionAreaVisible={true}
        />,
      );

      const button = screen.getByTestId('consultation-action-button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when loading', () => {
      (require('../../../hooks/useEncounterSession').useEncounterSession as jest.Mock).mockReturnValue({
        editActiveEncounter: false,
        isLoading: true,
      });

      render(
        <ConsultationActionButton
          {...defaultProps}
        />,
      );

      const button = screen.getByTestId('consultation-action-button');
      expect(button).toBeDisabled();
    });
  });

  describe('when user does NOT have Add Encounters privilege', () => {
    beforeEach(() => {
      mockUseUserPrivilege.mockReturnValue({
        userPrivileges: [
          { uuid: '1', name: 'some-other-privilege' },
        ],
        isLoading: false,
        error: null,
      } as any);

      mockHasPrivilege.mockReturnValue(false);
    });

    it('should NOT render the button', () => {
      render(
        <ConsultationActionButton
          {...defaultProps}
        />,
      );

      const button = screen.queryByTestId('consultation-action-button');
      expect(button).not.toBeInTheDocument();
    });
  });

  describe('when user has no privileges', () => {
    beforeEach(() => {
      mockUseUserPrivilege.mockReturnValue({
        userPrivileges: null,
        isLoading: false,
        error: null,
      } as any);

      mockHasPrivilege.mockReturnValue(false);
    });

    it('should NOT render the button', () => {
      render(
        <ConsultationActionButton
          {...defaultProps}
        />,
      );

      const button = screen.queryByTestId('consultation-action-button');
      expect(button).not.toBeInTheDocument();
    });
  });

  describe('privilege check', () => {
    it('should check for Add Encounters privilege', () => {
      mockUseUserPrivilege.mockReturnValue({
        userPrivileges: [
          { uuid: '1', name: CONSULTATION_PAD_PRIVILEGES.ENCOUNTER },
        ],
        isLoading: false,
        error: null,
      } as any);

      mockHasPrivilege.mockReturnValue(true);

      render(
        <ConsultationActionButton
          {...defaultProps}
        />,
      );

      expect(mockHasPrivilege).toHaveBeenCalledWith(
        expect.any(Array),
        CONSULTATION_PAD_PRIVILEGES.ENCOUNTER,
      );
    });
  });
});
