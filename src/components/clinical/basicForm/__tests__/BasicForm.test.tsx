import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import BasicForm from '../BasicForm';
import { useTranslation } from 'react-i18next';

// Mock the hooks
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

// Configure jest-axe
expect.extend(toHaveNoViolations);

describe('BasicForm', () => {
  // Common setup
  const mockTranslation = {
    t: jest.fn((key) => key),
  };

  const mockPractitioner = {
    id: 'practitioner-uuid', // Changed from uuid to id to match FormattedPractitioner interface
    display: 'Dr. Smith',
    fullName: 'Dr. John Smith',
  };

  const mockVisitTypes = [
    { uuid: '345', name: 'Visit Type 1' },
    { uuid: '678', name: 'Visit Type 2' },
  ];

  const mockEncounterTypes = [
    { uuid: '789', name: 'Encounter Type 1' },
    { uuid: '012', name: 'Encounter Type 2' },
  ];

  const mockLocation = {
    uuid: '123',
    display: 'Location 1',
    links: [], // Added links property to match OpenMRSLocation interface
  };
  const defaultDate = '16/05/2025';

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock implementations
    (useTranslation as jest.Mock).mockReturnValue(mockTranslation);
  });

  const renderBasicForm = (props = {}) => {
    const defaultProps = {
      practitioner: mockPractitioner,
      visitTypes: mockVisitTypes,
      visitTypeSelected: mockVisitTypes[0],
      encounterTypes: mockEncounterTypes,
      encounterTypeSelected: mockEncounterTypes[0],
      location: mockLocation,
      locationSelected: mockLocation,
      defaultDate,
    };

    return render(<BasicForm {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('should match snapshot', () => {
      // Act
      const { container } = renderBasicForm();

      // Assert
      expect(container).toMatchSnapshot();
    });

    it('should render all form fields with correct data', () => {
      // Act
      renderBasicForm();

      // Assert
      expect(screen.getByText('LOCATION')).toBeInTheDocument();
      expect(screen.getByText('ENCOUNTER_TYPE')).toBeInTheDocument();
      expect(screen.getByText('VISIT_TYPE')).toBeInTheDocument();
      expect(screen.getByText('CONSULTATION_DATE')).toBeInTheDocument();
      expect(
        screen.getByText('SELECT_CONSULTATION_DATE_HELPER'),
      ).toBeInTheDocument();
      expect(screen.getByText('PRACTITIONER')).toBeInTheDocument();
    });

    it('should render all form fields as disabled', () => {
      // Act
      renderBasicForm();

      // Assert
      // Use role selectors to find the elements by their roles and accessible names
      const locationDropdown = screen.getByRole('combobox', {
        name: /LOCATION/i,
      });
      const encounterTypeDropdown = screen.getByRole('combobox', {
        name: /ENCOUNTER_TYPE/i,
      });
      const visitTypeDropdown = screen.getByRole('combobox', {
        name: /VISIT_TYPE/i,
      });
      const datePickerInput = screen.getByLabelText(/CONSULTATION_DATE/i);
      const practitionerDropdown = screen.getByRole('combobox', {
        name: /PRACTITIONER/i,
      });

      expect(locationDropdown).toBeDisabled();
      expect(encounterTypeDropdown).toBeDisabled();
      expect(visitTypeDropdown).toBeDisabled();
      expect(datePickerInput).toBeDisabled();
      expect(practitionerDropdown).toBeDisabled();
    });

    it('should not render Visit Type dropdown when visitTypeSelected is not provided', () => {
      // Act
      renderBasicForm({ visitTypeSelected: null });

      // Assert
      expect(screen.queryByText('VISIT_TYPE')).not.toBeInTheDocument();
    });

    it('should not render Practitioner dropdown when practitioner is not provided', () => {
      // Act
      renderBasicForm({ practitioner: null });

      // Assert
      expect(screen.queryByText('PRACTITIONER')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should not have any accessibility violations', async () => {
      // Act
      const { container } = renderBasicForm();

      // Assert
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have appropriate ARIA attributes on all form elements', () => {
      // Act
      renderBasicForm();

      // Assert
      // Check that all interactive elements have accessible properties
      expect(
        screen.getByRole('combobox', { name: /LOCATION/i }),
      ).toHaveAttribute('disabled');
      expect(
        screen.getByRole('combobox', { name: /ENCOUNTER_TYPE/i }),
      ).toHaveAttribute('disabled');
      expect(
        screen.getByRole('combobox', { name: /VISIT_TYPE/i }),
      ).toHaveAttribute('disabled');
      expect(screen.getByLabelText(/CONSULTATION_DATE/i)).toHaveAttribute(
        'disabled',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays for dropdowns', () => {
      // Act
      renderBasicForm({
        visitTypes: [],
        encounterTypes: [],
      });

      // Assert
      expect(
        screen.getByRole('combobox', { name: /ENCOUNTER_TYPE/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /VISIT_TYPE/i }),
      ).toBeInTheDocument();
    });

    it('should handle undefined location', () => {
      // Act
      renderBasicForm({
        location: undefined,
        locationSelected: undefined,
      });

      // Assert
      expect(
        screen.getByRole('combobox', { name: /LOCATION/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering', () => {
    describe('Visit Type Dropdown', () => {
      it('should render Visit Type dropdown when visitTypeSelected is provided', () => {
        // Act
        renderBasicForm({
          visitTypeSelected: mockVisitTypes[0],
        });

        // Assert
        expect(screen.getByText('VISIT_TYPE')).toBeInTheDocument();
        const visitTypeDropdown = screen.getByRole('combobox', {
          name: /VISIT_TYPE/i,
        });
        expect(visitTypeDropdown).toBeInTheDocument();
        expect(visitTypeDropdown).toBeDisabled();
      });

      it('should not render Visit Type dropdown when visitTypeSelected is null', () => {
        // Act
        renderBasicForm({
          visitTypeSelected: null,
        });

        // Assert
        expect(screen.queryByText('VISIT_TYPE')).not.toBeInTheDocument();
        expect(
          screen.queryByRole('combobox', { name: /VISIT_TYPE/i }),
        ).not.toBeInTheDocument();
      });

      it('should not render Visit Type dropdown when visitTypeSelected is undefined', () => {
        // Act
        renderBasicForm({
          visitTypeSelected: undefined,
        });

        // Assert
        expect(screen.queryByText('VISIT_TYPE')).not.toBeInTheDocument();
        expect(
          screen.queryByRole('combobox', { name: /VISIT_TYPE/i }),
        ).not.toBeInTheDocument();
      });

      it('should render Visit Type dropdown when visitTypeSelected is an empty object', () => {
        // Act
        renderBasicForm({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          visitTypeSelected: {} as any, // Empty object cast as Concept
        });

        // Assert
        expect(screen.getByText('VISIT_TYPE')).toBeInTheDocument();
        const visitTypeDropdown = screen.getByRole('combobox', {
          name: /VISIT_TYPE/i,
        });
        expect(visitTypeDropdown).toBeInTheDocument();
      });
    });

    describe('Practitioner Dropdown', () => {
      it('should render Practitioner dropdown when practitioner is provided', () => {
        // Act
        renderBasicForm({
          practitioner: mockPractitioner,
        });

        // Assert
        expect(screen.getByText('PRACTITIONER')).toBeInTheDocument();
        const practitionerDropdown = screen.getByRole('combobox', {
          name: /PRACTITIONER/i,
        });
        expect(practitionerDropdown).toBeInTheDocument();
        expect(practitionerDropdown).toBeDisabled();
      });

      it('should not render Practitioner dropdown when practitioner is null', () => {
        // Act
        renderBasicForm({
          practitioner: null,
        });

        // Assert
        expect(screen.queryByText('PRACTITIONER')).not.toBeInTheDocument();
        expect(
          screen.queryByRole('combobox', { name: /PRACTITIONER/i }),
        ).not.toBeInTheDocument();
      });

      it('should not render Practitioner dropdown when practitioner is undefined', () => {
        // Act
        renderBasicForm({
          practitioner: undefined,
        });

        // Assert
        expect(screen.queryByText('PRACTITIONER')).not.toBeInTheDocument();
        expect(
          screen.queryByRole('combobox', { name: /PRACTITIONER/i }),
        ).not.toBeInTheDocument();
      });

      it('should render Practitioner dropdown when practitioner is an empty object', () => {
        // Act
        renderBasicForm({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          practitioner: {} as any, // Empty object cast as FormattedPractitioner
        });

        // Assert
        expect(screen.getByText('PRACTITIONER')).toBeInTheDocument();
        const practitionerDropdown = screen.getByRole('combobox', {
          name: /PRACTITIONER/i,
        });
        expect(practitionerDropdown).toBeInTheDocument();
      });
    });

    describe('Combined Conditional Rendering', () => {
      it('should render both conditionally rendered components when both conditions are met', () => {
        // Act
        renderBasicForm({
          visitTypeSelected: mockVisitTypes[0],
          practitioner: mockPractitioner,
        });

        // Assert
        // Visit Type should be rendered
        expect(screen.getByText('VISIT_TYPE')).toBeInTheDocument();
        expect(
          screen.getByRole('combobox', { name: /VISIT_TYPE/i }),
        ).toBeInTheDocument();

        // Practitioner should be rendered
        expect(screen.getByText('PRACTITIONER')).toBeInTheDocument();
        expect(
          screen.getByRole('combobox', { name: /PRACTITIONER/i }),
        ).toBeInTheDocument();
      });

      it('should not render either component when both conditions are not met', () => {
        // Act
        renderBasicForm({
          visitTypeSelected: null,
          practitioner: null,
        });

        // Assert
        // Visit Type should not be rendered
        expect(screen.queryByText('VISIT_TYPE')).not.toBeInTheDocument();
        expect(
          screen.queryByRole('combobox', { name: /VISIT_TYPE/i }),
        ).not.toBeInTheDocument();

        // Practitioner should not be rendered
        expect(screen.queryByText('PRACTITIONER')).not.toBeInTheDocument();
        expect(
          screen.queryByRole('combobox', { name: /PRACTITIONER/i }),
        ).not.toBeInTheDocument();
      });

      it('should render only Visit Type when only visitTypeSelected is provided', () => {
        // Act
        renderBasicForm({
          visitTypeSelected: mockVisitTypes[0],
          practitioner: null,
        });

        // Assert
        // Visit Type should be rendered
        expect(screen.getByText('VISIT_TYPE')).toBeInTheDocument();
        expect(
          screen.getByRole('combobox', { name: /VISIT_TYPE/i }),
        ).toBeInTheDocument();

        // Practitioner should not be rendered
        expect(screen.queryByText('PRACTITIONER')).not.toBeInTheDocument();
        expect(
          screen.queryByRole('combobox', { name: /PRACTITIONER/i }),
        ).not.toBeInTheDocument();
      });

      it('should render only Practitioner when only practitioner is provided', () => {
        // Act
        renderBasicForm({
          visitTypeSelected: null,
          practitioner: mockPractitioner,
        });

        // Assert
        // Visit Type should not be rendered
        expect(screen.queryByText('VISIT_TYPE')).not.toBeInTheDocument();
        expect(
          screen.queryByRole('combobox', { name: /VISIT_TYPE/i }),
        ).not.toBeInTheDocument();

        // Practitioner should be rendered
        expect(screen.getByText('PRACTITIONER')).toBeInTheDocument();
        expect(
          screen.getByRole('combobox', { name: /PRACTITIONER/i }),
        ).toBeInTheDocument();
      });
    });
  });
});
