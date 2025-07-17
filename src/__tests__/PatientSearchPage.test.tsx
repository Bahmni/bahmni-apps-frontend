import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import PatientSearchPage from '../pages/PatientSearchPage';
import { searchPatients } from '../services/patientSearchService';
import i18n from '../setupTests.i18n';

// Mock the patient search service
jest.mock('../services/patientSearchService');
const mockSearchPatients = searchPatients as jest.MockedFunction<typeof searchPatients>;

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </BrowserRouter>
  );
};

describe('PatientSearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders patient search form', () => {
    renderWithProviders(<PatientSearchPage />);
    
    expect(screen.getByText('Patient Search')).toBeInTheDocument();
    expect(screen.getByLabelText('ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('disables search button when no criteria entered', () => {
    renderWithProviders(<PatientSearchPage />);
    
    const searchButton = screen.getByText('Search');
    expect(searchButton).toBeDisabled();
  });

  it('enables search button when criteria entered', () => {
    renderWithProviders(<PatientSearchPage />);
    
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'John' } });
    
    const searchButton = screen.getByText('Search');
    expect(searchButton).not.toBeDisabled();
  });

  it('performs search and displays results', async () => {
    const mockResults = [
      {
        uuid: 'patient-1',
        identifier: 'GAN200001',
        name: 'John Doe',
        gender: 'M',
        age: 35,
        phoneNumber: '+1234567890',
        alternatePhoneNumber: '',
        registrationDate: '2023-01-01',
        givenName: 'John',
        familyName: 'Doe',
        birthDate: '1988-01-01',
        extraIdentifier: 'GAN200001',
      },
    ];

    mockSearchPatients.mockResolvedValue(mockResults);
    
    renderWithProviders(<PatientSearchPage />);
    
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'John' } });
    
    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(mockSearchPatients).toHaveBeenCalledWith({
        identifier: '',
        name: 'John',
        phoneNumber: '',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('GAN200001')).toBeInTheDocument();
    });
  });

  it('displays no results message when search returns empty', async () => {
    mockSearchPatients.mockResolvedValue([]);
    
    renderWithProviders(<PatientSearchPage />);
    
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'NonExistent' } });
    
    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText('No patients found')).toBeInTheDocument();
    });
  });

  it('displays error message when search fails', async () => {
    mockSearchPatients.mockRejectedValue(new Error('Search failed'));
    
    renderWithProviders(<PatientSearchPage />);
    
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'John' } });
    
    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText('Search failed')).toBeInTheDocument();
    });
  });
});
