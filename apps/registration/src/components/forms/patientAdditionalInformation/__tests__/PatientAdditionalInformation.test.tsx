import { useTranslation } from '@bahmni-frontend/bahmni-services';
import { render, fireEvent, screen } from '@testing-library/react';
import { createRef } from 'react';
import '@testing-library/jest-dom';
import { AdditionalData } from '../../../../models/patient';
import {
  PatientAdditionalInformation,
  PatientAdditionalInformationRef,
} from '../PatientAdditionalInformation';

// Mock the translation hook to return the key
jest.mock('@bahmni-frontend/bahmni-services', () => ({
  useTranslation: jest.fn(),
}));

describe('PatientAdditionalInformation', () => {
  const mockT = jest.fn((key: string) => key);

  beforeEach(() => {
    (useTranslation as jest.Mock).mockReturnValue({ t: mockT });
  });

  it('renders correctly with initial data', () => {
    const initialData: AdditionalData = { email: 'test@example.com' };
    render(<PatientAdditionalInformation initialData={initialData} />);

    const emailInput = screen.getByLabelText(
      'CREATE_PATIENT_EMAIL',
    ) as HTMLInputElement;
    expect(emailInput).toBeInTheDocument();
    expect(emailInput.value).toBe(initialData.email);
  });

  it('updates email field on change and clears error', () => {
    render(<PatientAdditionalInformation />);
    const emailInput = screen.getByLabelText(
      'CREATE_PATIENT_EMAIL',
    ) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    expect(emailInput.value).toBe('new@example.com');
  });

  it('returns true for valid or empty email and no error shown', () => {
    const ref = createRef<PatientAdditionalInformationRef>();
    render(<PatientAdditionalInformation ref={ref} />);

    const emailInput = screen.getByLabelText(
      'CREATE_PATIENT_EMAIL',
    ) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });

    const isValid = ref.current?.validate();
    expect(isValid).toBe(true);
    expect(
      screen.queryByText('CREATE_PATIENT_VALIDATION_EMAIL_INVALID'),
    ).not.toBeInTheDocument();
  });

  it('exposes getData ref method to return current form data', () => {
    const ref = createRef<PatientAdditionalInformationRef>();
    render(<PatientAdditionalInformation ref={ref} />);

    const emailInput = screen.getByLabelText(
      'CREATE_PATIENT_EMAIL',
    ) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'data@example.com' } });

    const data = ref.current?.getData();
    expect(data).toEqual({ email: 'data@example.com' });
  });
});
