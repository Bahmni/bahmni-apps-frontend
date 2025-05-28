import React from 'react';
import { render, screen } from '@testing-library/react';
import DiagnosisItem from '../DiagnosisItem';
import { mockFormattedDiagnoses } from '@/__mocks__/diagnosisMocks';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';

describe('DiagnosisItem', () => {
  const diagnosis = mockFormattedDiagnoses[0]; // Type 2 Diabetes with notes

  const renderComponent = (props = {}) => {
    return render(
      <I18nextProvider i18n={i18n}>
        <DiagnosisItem diagnosis={diagnosis} {...props} />
      </I18nextProvider>,
    );
  };

  it('renders the diagnosis name', () => {
    renderComponent();
    expect(screen.getByText('Type 2 Diabetes Mellitus')).toBeInTheDocument();
  });

  it('renders the certainty tag', () => {
    renderComponent();
    expect(screen.getByText('DIAGNOSIS_CONFIRMED')).toBeInTheDocument();
  });

  it('renders the recorder information when showRecorder is true', () => {
    renderComponent({ showRecorder: true });
    expect(screen.getByText(/DIAGNOSIS_RECORDER: Dr. Jane Smith/i)).toBeInTheDocument();
  });

  it('does not render the recorder information when showRecorder is false', () => {
    renderComponent({ showRecorder: false });
    expect(screen.queryByText(/DIAGNOSIS_RECORDER/i)).not.toBeInTheDocument();
  });

  it('renders notes when available', () => {
    renderComponent();
    expect(screen.getByText('Patient has a family history of diabetes.')).toBeInTheDocument();
  });

  it('does not render notes section when no notes are available', () => {
    const diagnosisWithoutNotes = mockFormattedDiagnoses[1]; // Hypertension without notes
    render(
      <I18nextProvider i18n={i18n}>
        <DiagnosisItem diagnosis={diagnosisWithoutNotes} />
      </I18nextProvider>,
    );
    expect(screen.queryByText('Patient has a family history of diabetes.')).not.toBeInTheDocument();
  });
});
