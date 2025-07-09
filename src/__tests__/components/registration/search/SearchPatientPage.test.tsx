import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { SearchPatientPage } from '@/components/registration/search/SearchPatientPage';
import { SearchService } from '@/services/registration/SearchService';
import { useSearchStore } from '@/stores/registration/useSearchStore';

jest.mock('@/services/registration/SearchService');
jest.mock('@/stores/registration/useSearchStore');

describe('SearchPatientPage', () => {
  it('should search for patients when the search button is clicked', async () => {
    const searchResults = [
      { id: '1', name: [{ text: 'Test Patient' }], identifier: [{ value: '123' }], gender: 'Male', birthDate: '2000-01-01', address: [{ text: '123 Main St' }] },
    ];
    (SearchService.search as jest.Mock).mockResolvedValue(searchResults);
    const setSearchResults = jest.fn();
    (useSearchStore as unknown as jest.Mock).mockReturnValue({ searchResults: [], setSearchResults });

    const { getByLabelText, getByText } = render(<SearchPatientPage />);

    fireEvent.change(getByLabelText('Search by Name or ID'), { target: { value: 'test' } });
    fireEvent.click(getByText('Search'));

    await waitFor(() => {
      expect(SearchService.search).toHaveBeenCalledWith({ q: 'test' });
      expect(setSearchResults).toHaveBeenCalledWith(searchResults);
    });
  });
});
