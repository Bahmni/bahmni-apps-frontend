import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import type { ContactData } from '../../../../models/patient';
import { PatientContactInformation } from '../PatientContactInformation';
import type { PatientContactInformationRef } from '../PatientContactInformation';

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('PatientContactInformation', () => {
  let ref: React.RefObject<PatientContactInformationRef | null>;

  beforeEach(() => {
    ref = React.createRef<PatientContactInformationRef | null>();
  });

  describe('Rendering', () => {
    it('should render contact information fields', () => {
      render(<PatientContactInformation ref={ref} />);

      expect(
        screen.getByLabelText('CREATE_PATIENT_PHONE_NUMBER'),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('CREATE_PATIENT_ALT_PHONE_NUMBER'),
      ).toBeInTheDocument();
    });
  });

  describe('Phone Number Validation', () => {
    it('should accept valid numeric phone numbers', () => {
      render(<PatientContactInformation ref={ref} />);
      const phoneInput = screen.getByLabelText(
        'CREATE_PATIENT_PHONE_NUMBER',
      ) as HTMLInputElement;

      fireEvent.change(phoneInput, { target: { value: '1234567890' } });
      expect(phoneInput.value).toBe('1234567890');
    });

    it('should accept plus sign at the beginning', () => {
      render(<PatientContactInformation ref={ref} />);
      const phoneInput = screen.getByLabelText(
        'CREATE_PATIENT_PHONE_NUMBER',
      ) as HTMLInputElement;

      fireEvent.change(phoneInput, { target: { value: '+911234567890' } });
      expect(phoneInput.value).toBe('+911234567890');
    });

    it('should reject letters', () => {
      render(<PatientContactInformation ref={ref} />);
      const phoneInput = screen.getByLabelText(
        'CREATE_PATIENT_PHONE_NUMBER',
      ) as HTMLInputElement;

      fireEvent.change(phoneInput, { target: { value: '123abc456' } });
      expect(phoneInput.value).toBe('');
    });

    it('should reject spaces', () => {
      render(<PatientContactInformation ref={ref} />);
      const phoneInput = screen.getByLabelText(
        'CREATE_PATIENT_PHONE_NUMBER',
      ) as HTMLInputElement;

      fireEvent.change(phoneInput, { target: { value: '123 456 7890' } });
      expect(phoneInput.value).toBe('');
    });

    it('should reject special characters except plus', () => {
      render(<PatientContactInformation ref={ref} />);
      const phoneInput = screen.getByLabelText(
        'CREATE_PATIENT_PHONE_NUMBER',
      ) as HTMLInputElement;

      fireEvent.change(phoneInput, { target: { value: '123-456-7890' } });
      expect(phoneInput.value).toBe('');
    });

    it('should reject multiple plus signs', () => {
      render(<PatientContactInformation ref={ref} />);
      const phoneInput = screen.getByLabelText(
        'CREATE_PATIENT_PHONE_NUMBER',
      ) as HTMLInputElement;

      fireEvent.change(phoneInput, { target: { value: '++123' } });
      expect(phoneInput.value).toBe('');
    });

    it('should reject plus sign in the middle', () => {
      render(<PatientContactInformation ref={ref} />);
      const phoneInput = screen.getByLabelText(
        'CREATE_PATIENT_PHONE_NUMBER',
      ) as HTMLInputElement;

      fireEvent.change(phoneInput, { target: { value: '123+456' } });
      expect(phoneInput.value).toBe('');
    });
  });

  describe('getData Method', () => {
    it('should return empty data when no input provided', () => {
      render(<PatientContactInformation ref={ref} />);

      const data = ref.current?.getData();

      expect(data).toEqual({
        phoneNumber: '',
        altPhoneNumber: '',
      });
    });

    it('should return current phone number', () => {
      render(<PatientContactInformation ref={ref} />);

      const phoneInput = screen.getByLabelText('CREATE_PATIENT_PHONE_NUMBER');
      fireEvent.change(phoneInput, { target: { value: '1234567890' } });

      const data = ref.current?.getData();

      expect(data).toEqual({
        phoneNumber: '1234567890',
        altPhoneNumber: '',
      });
    });

    it('should return both phone numbers', () => {
      render(<PatientContactInformation ref={ref} />);

      const phoneInput = screen.getByLabelText('CREATE_PATIENT_PHONE_NUMBER');
      const altPhoneInput = screen.getByLabelText(
        'CREATE_PATIENT_ALT_PHONE_NUMBER',
      );

      fireEvent.change(phoneInput, { target: { value: '1234567890' } });
      fireEvent.change(altPhoneInput, { target: { value: '0987654321' } });

      const data = ref.current?.getData();

      expect(data).toEqual({
        phoneNumber: '1234567890',
        altPhoneNumber: '0987654321',
      });
    });

    it('should return initial data when provided', () => {
      const initialData: ContactData = {
        phoneNumber: '1234567890',
        altPhoneNumber: '0987654321',
      };

      render(<PatientContactInformation ref={ref} initialData={initialData} />);

      const data = ref.current?.getData();

      expect(data).toEqual(initialData);
    });

    it('should return updated data after changes', () => {
      render(<PatientContactInformation ref={ref} />);

      const phoneInput = screen.getByLabelText('CREATE_PATIENT_PHONE_NUMBER');

      fireEvent.change(phoneInput, { target: { value: '1111111111' } });
      let data = ref.current?.getData();
      expect(data?.phoneNumber).toBe('1111111111');

      fireEvent.change(phoneInput, { target: { value: '2222222222' } });
      data = ref.current?.getData();
      expect(data?.phoneNumber).toBe('2222222222');
    });
  });
});
