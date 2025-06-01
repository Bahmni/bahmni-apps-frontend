import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import DiagnosesControl from '../DiagnosesControl';
import { mockDiagnosesByDate } from '@/__mocks__/diagnosisMocks';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import useDiagnoses from '@/hooks/useDiagnoses';

// Mock the useDiagnoses hook
jest.mock('@/hooks/useDiagnoses');

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

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
    expect(screen.getByText('Loading diagnoses...')).toBeInTheDocument();
  });

  it('renders error state when there is an error', () => {
    (useDiagnoses as jest.Mock).mockReturnValue({
      diagnosesByDate: [],
      isLoading: false,
      isError: true,
    });

    renderComponent();
    expect(screen.getByText('Error loading diagnoses')).toBeInTheDocument();
  });

  it('renders empty state when no diagnoses are available', () => {
    (useDiagnoses as jest.Mock).mockReturnValue({
      diagnosesByDate: [],
      isLoading: false,
      isError: false,
    });

    renderComponent();
    expect(screen.getByText('No diagnoses added for this patient')).toBeInTheDocument();
  });

  it('renders diagnoses grouped by date', () => {
    (useDiagnoses as jest.Mock).mockReturnValue({
      diagnosesByDate: mockDiagnosesByDate,
      isLoading: false,
      isError: false,
    });

    renderComponent();
    
    // Check for date groups
    expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
    expect(screen.getByText('Jan 10, 2025')).toBeInTheDocument();
    
    // Check for diagnoses
    expect(screen.getByText('Type 2 Diabetes Mellitus')).toBeInTheDocument();
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
    expect(screen.getByText('Asthma')).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    test('accessible forms pass axe', async () => {
      (useDiagnoses as jest.Mock).mockReturnValue({
        diagnosesByDate: mockDiagnosesByDate,
        isLoading: false,
        isError: false,
      });

      const { container } = renderComponent();
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
