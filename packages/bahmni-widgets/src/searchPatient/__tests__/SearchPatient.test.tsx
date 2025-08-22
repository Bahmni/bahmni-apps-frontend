import { render, screen } from '@testing-library/react';
import SearchPatient from '../SearchPatient';
import '@testing-library/jest-dom';

describe('SearchPatient', () => {
  it('should render the searchbar and the search button', () => {
    render(<SearchPatient />);
    expect(screen.getByTestId('search-patient-seachbar')).toBeInTheDocument();
    expect(
      screen.getByTestId('search-patient-search-button'),
    ).toBeInTheDocument();
  });
});
