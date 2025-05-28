import React from 'react';
import { render, screen } from '@testing-library/react';
import DiagnosesControl from '../DiagnosesControl';
import { mockDiagnosesByDate } from '@/__mocks__/diagnosisMocks';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import useDiagnoses from '@/hooks/useDiagnoses';

// Mock the useDiagnoses hook
jest.mock('@/hooks/useDiagnoses');

describe('DiagnosesControl', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <I18nextProvider i18n={i18n}>
        <DiagnosesControl />
      </I18nextProvider>,
    );
  };

  it('renders loading state when data is loading', () => {
    (useDiagnoses as jest.Mock).mockReturnValue({
      diagnosesByDate: [],
      isLoading: true,
      isError: false,
    });

    renderComponent();
    expect(screen.getByText('DIAGNOSIS_LOADING')).toBeInTheDocument();
  });

  it('renders error state when there is an error', () => {
    (useDiagnoses as jest.Mock).mockReturnValue({
      diagnosesByDate: [],
      isLoading: false,
      isError: true,
    });

    renderComponent();
    expect(screen.getByText('DIAGNOSIS_ERROR_LOADING')).toBeInTheDocument();
  });

  it('renders empty state when no diagnoses are available', () => {
    (useDiagnoses as jest.Mock).mockReturnValue({
      diagnosesByDate: [],
      isLoading: false,
      isError: false,
    });

    renderComponent();
    expect(screen.getByText('DIAGNOSIS_NO_DIAGNOSES')).toBeInTheDocument();
  });

  it('renders diagnoses grouped by date and recorder', () => {
    (useDiagnoses as jest.Mock).mockReturnValue({
      diagnosesByDate: mockDiagnosesByDate,
      isLoading: false,
      isError: false,
    });

    renderComponent();
    
    // Check for date groups
    expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
    expect(screen.getByText('Jan 10, 2025')).toBeInTheDocument();
    
    // Check for recorder groups
    expect(screen.getAllByText('Dr. Jane Smith')).toHaveLength(1);
    expect(screen.getAllByText('Dr. Robert Johnson')).toHaveLength(1);
    
    // Check for diagnoses
    expect(screen.getByText('Type 2 Diabetes Mellitus')).toBeInTheDocument();
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
    expect(screen.getByText('Asthma')).toBeInTheDocument();
  });
});
