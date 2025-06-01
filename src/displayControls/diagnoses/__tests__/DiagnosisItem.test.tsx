import React from 'react';
import { render, screen } from '@testing-library/react';
import DiagnosisItem from '../DiagnosesItem';
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
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('renders the recorder information', () => {
    renderComponent();
    expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();
  });
});
