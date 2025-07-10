import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientCard } from '../PatientCard';
import { PatientSearchResult } from '../../../../types/registration';

// Mock patient data
const mockPatient: PatientSearchResult = {
  uuid: 'patient-123',
  display: 'John Doe',
  identifiers: [
    {
      uuid: 'id-1',
      identifier: 'BAH001234',
      identifierType: {
        uuid: 'type-1',
        name: 'Bahmni ID',
        display: 'Bahmni ID',
      },
      preferred: true,
    },
    {
      uuid: 'id-2',
      identifier: 'NAT567890',
      identifierType: {
        uuid: 'type-2',
        name: 'National ID',
        display: 'National ID',
      },
      preferred: false,
    },
  ],
  person: {
    uuid: 'person-123',
    display: 'John Doe',
    gender: 'M',
    age: 35,
    birthdate: '1988-05-15',
    birthdateEstimated: false,
    names: [
      {
        uuid: 'name-1',
        display: 'John Doe',
        givenName: 'John',
        middleName: 'Michael',
        familyName: 'Doe',
        preferred: true,
      },
    ],
    addresses: [
      {
        uuid: 'address-1',
        display: '123 Main St, Springfield, IL 62701',
        address1: '123 Main St',
        address2: 'Apt 4B',
        cityVillage: 'Springfield',
        stateProvince: 'Illinois',
        country: 'USA',
        postalCode: '62701',
        preferred: true,
      },
    ],
  },
  voided: false,
  links: [],
};

const mockPatientMinimal: PatientSearchResult = {
  uuid: 'patient-456',
  display: 'Jane Smith',
  identifiers: [
    {
      uuid: 'id-3',
      identifier: 'BAH005678',
      identifierType: {
        uuid: 'type-1',
        name: 'Bahmni ID',
        display: 'Bahmni ID',
      },
      preferred: true,
    },
  ],
  person: {
    uuid: 'person-456',
    display: 'Jane Smith',
    gender: 'F',
    age: undefined,
    birthdate: undefined,
    birthdateEstimated: false,
    names: [
      {
        uuid: 'name-2',
        display: 'Jane Smith',
        givenName: 'Jane',
        familyName: 'Smith',
        preferred: true,
      },
    ],
    addresses: [],
  },
  voided: false,
  links: [],
};

describe('PatientCard', () => {
  const defaultProps = {
    patient: mockPatient,
    onSelect: jest.fn(),
    isSelected: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render patient name', () => {
      render(<PatientCard {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render primary identifier', () => {
      render(<PatientCard {...defaultProps} />);
      expect(screen.getByText('BAH001234')).toBeInTheDocument();
    });

    it('should render patient gender and age', () => {
      render(<PatientCard {...defaultProps} />);
      expect(screen.getByText('Male, 35 years')).toBeInTheDocument();
    });

    it('should render patient address', () => {
      render(<PatientCard {...defaultProps} />);
      expect(screen.getByText('123 Main St, Springfield, IL 62701')).toBeInTheDocument();
    });

    it('should render clickable card', () => {
      render(<PatientCard {...defaultProps} />);
      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Patient Photo', () => {
    it('should render photo placeholder when no photo', () => {
      render(<PatientCard {...defaultProps} />);
      const avatar = screen.getByTestId('patient-avatar');
      expect(avatar).toBeInTheDocument();
    });

    it('should render photo when provided', () => {
      const patientWithPhoto = {
        ...mockPatient,
        photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...',
      };
      render(<PatientCard {...defaultProps} patient={patientWithPhoto} />);
      const photo = screen.getByAltText('John Doe');
      expect(photo).toBeInTheDocument();
    });

    it('should render fallback avatar on photo error', () => {
      const patientWithPhoto = {
        ...mockPatient,
        photo: 'invalid-photo-url',
      };
      render(<PatientCard {...defaultProps} patient={patientWithPhoto} />);
      const avatar = screen.getByTestId('patient-avatar');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Gender Display', () => {
    it('should display Male for gender M', () => {
      render(<PatientCard {...defaultProps} />);
      expect(screen.getByText('Male, 35 years')).toBeInTheDocument();
    });

    it('should display Female for gender F', () => {
      const femalePatient = { ...mockPatient, person: { ...mockPatient.person, gender: 'F' as const } };
      render(<PatientCard {...defaultProps} patient={femalePatient} />);
      expect(screen.getByText('Female, 35 years')).toBeInTheDocument();
    });

    it('should display Other for gender O', () => {
      const otherPatient = { ...mockPatient, person: { ...mockPatient.person, gender: 'O' as const } };
      render(<PatientCard {...defaultProps} patient={otherPatient} />);
      expect(screen.getByText('Other, 35 years')).toBeInTheDocument();
    });
  });

  describe('Age and Birthdate Display', () => {
    it('should display age when available', () => {
      render(<PatientCard {...defaultProps} />);
      expect(screen.getByText('Male, 35 years')).toBeInTheDocument();
    });

    it('should display birthdate when age is not available', () => {
      const patientWithoutAge = {
        ...mockPatient,
        person: { ...mockPatient.person, age: undefined },
      };
      render(<PatientCard {...defaultProps} patient={patientWithoutAge} />);
      expect(screen.getByText(/Born.*1988/)).toBeInTheDocument();
    });

    it('should handle missing age and birthdate', () => {
      render(<PatientCard {...defaultProps} patient={mockPatientMinimal} />);
      expect(screen.getByText('Female')).toBeInTheDocument();
    });
  });

  describe('Address Display', () => {
    it('should display full address when available', () => {
      render(<PatientCard {...defaultProps} />);
      expect(screen.getByText('123 Main St, Springfield, IL 62701')).toBeInTheDocument();
    });

    it('should handle missing address', () => {
      render(<PatientCard {...defaultProps} patient={mockPatientMinimal} />);
      expect(screen.queryByTestId('patient-address')).not.toBeInTheDocument();
    });

    it('should display partial address', () => {
      const patientPartialAddress = {
        ...mockPatient,
        person: {
          ...mockPatient.person,
          addresses: [
            {
              uuid: 'address-1',
              display: 'Springfield',
              address1: undefined,
              address2: undefined,
              cityVillage: 'Springfield',
              stateProvince: undefined,
              country: undefined,
              postalCode: undefined,
              preferred: true,
            },
          ],
        },
      };
      render(<PatientCard {...defaultProps} patient={patientPartialAddress} />);
      expect(screen.getByText('Springfield')).toBeInTheDocument();
    });
  });

  describe('Identifier Display', () => {
    it('should display preferred identifier', () => {
      render(<PatientCard {...defaultProps} />);
      expect(screen.getByText('BAH001234')).toBeInTheDocument();
    });

    it('should display first identifier when none preferred', () => {
      const patientNoPreferred = {
        ...mockPatient,
        identifiers: mockPatient.identifiers.map((id) => ({ ...id, preferred: false })),
      };
      render(<PatientCard {...defaultProps} patient={patientNoPreferred} />);
      expect(screen.getByText('BAH001234')).toBeInTheDocument();
    });

    it('should handle no identifiers', () => {
      const patientNoIds = { ...mockPatient, identifiers: [] };
      render(<PatientCard {...defaultProps} patient={patientNoIds} />);
      expect(screen.queryByTestId('patient-identifier')).not.toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('should show selected state when isSelected is true', () => {
      render(<PatientCard {...defaultProps} isSelected={true} />);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('selected');
    });

    it('should not show selected state when isSelected is false', () => {
      render(<PatientCard {...defaultProps} isSelected={false} />);
      const card = screen.getByRole('button');
      expect(card).not.toHaveClass('selected');
    });
  });

  describe('User Interactions', () => {
    it('should call onSelect when card is clicked', async () => {
      const user = userEvent.setup();
      render(<PatientCard {...defaultProps} />);

      const card = screen.getByRole('button');
      await user.click(card);

      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockPatient);
    });

    it('should call onSelect when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<PatientCard {...defaultProps} />);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');

      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockPatient);
    });

    it('should call onSelect when Space key is pressed', async () => {
      const user = userEvent.setup();
      render(<PatientCard {...defaultProps} />);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard(' ');

      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockPatient);
    });

    it('should handle disabled state', () => {
      render(<PatientCard {...defaultProps} disabled={true} />);
      const card = screen.getByRole('button');
      expect(card).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PatientCard {...defaultProps} />);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('John Doe'));
    });

    it('should be keyboard navigable', () => {
      render(<PatientCard {...defaultProps} />);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper role', () => {
      render(<PatientCard {...defaultProps} />);
      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should handle loading state', () => {
      render(<PatientCard {...defaultProps} isLoading={true} />);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('loading');
    });
  });

  describe('Hover State', () => {
    it('should handle hover state', async () => {
      const user = userEvent.setup();
      render(<PatientCard {...defaultProps} />);

      const card = screen.getByRole('button');
      await user.hover(card);

      expect(card).toHaveClass('hover');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long names', () => {
      const longNamePatient = {
        ...mockPatient,
        display: 'Very Long Patient Name That Should Be Truncated Properly',
        person: {
          ...mockPatient.person,
          display: 'Very Long Patient Name That Should Be Truncated Properly',
          names: [
            {
              uuid: 'name-1',
              display: 'Very Long Patient Name That Should Be Truncated Properly',
              givenName: 'Very Long Given Name',
              familyName: 'Very Long Family Name',
              preferred: true,
            },
          ],
        },
      };
      render(<PatientCard {...defaultProps} patient={longNamePatient} />);
      expect(screen.getByText('Very Long Patient Name That Should Be Truncated Properly')).toBeInTheDocument();
    });

    it('should handle missing person name', () => {
      const noNamePatient = {
        ...mockPatient,
        person: { ...mockPatient.person, names: [] },
      };
      render(<PatientCard {...defaultProps} patient={noNamePatient} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument(); // Should fall back to display
    });
  });
});
