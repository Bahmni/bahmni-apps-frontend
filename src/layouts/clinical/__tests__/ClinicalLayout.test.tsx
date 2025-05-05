import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ClinicalLayout from '../ClinicalLayout';

// Mock the Header component
jest.mock('@components/clinical/header/Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">Mock Header</div>;
  };
});

// Mock component to be used as children
const MockChild = () => <div data-testid="mock-child">Mock Child</div>;
describe('ClinicalLayout Component', () => {
  test('renders the Header component', () => {
    render(
      <BrowserRouter>
        <ClinicalLayout>
          <MockChild />
        </ClinicalLayout>
      </BrowserRouter>,
    );

    // Check if the Header component is rendered
    const header = screen.getByTestId('mock-header');
    expect(header).toBeInTheDocument();
  });

  test('renders children content', () => {
    render(
      <BrowserRouter>
        <ClinicalLayout>
          <MockChild />
        </ClinicalLayout>
      </BrowserRouter>,
    );

    // Check if children are rendered
    const childContent = screen.getByTestId('mock-child');
    expect(childContent).toBeInTheDocument();
    expect(childContent).toHaveTextContent('Mock Child');
  });
});
