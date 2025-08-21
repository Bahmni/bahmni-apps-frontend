import { BAHMNI_HOME_PATH } from '@bahmni-frontend/bahmni-services';
import { render, screen } from '@testing-library/react';
import PatientSearchPage from '../PatientSearchPage';

describe('PatientSearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the Header with Breadcrumbs component', () => {
    render(<PatientSearchPage />);
    expect(
      screen.getByRole('banner', { name: 'registration-search-page-header' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Registration')).toBeInTheDocument();
  });

  it('should render breadcumb with Home page link', async () => {
    render(<PatientSearchPage />);
    const homeButton = screen.getByRole('link', { name: 'Home' });
    expect(homeButton).toBeInTheDocument();
    expect(homeButton).toHaveAttribute('href', BAHMNI_HOME_PATH);
  });
});
