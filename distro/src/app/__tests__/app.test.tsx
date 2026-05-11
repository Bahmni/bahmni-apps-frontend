import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import App from '../app';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getUserLoginLocation: jest.fn().mockReturnValue({
    name: 'Test Location',
    uuid: 'test-uuid',
  }),
  getAvailableLocations: jest.fn().mockResolvedValue([]),
  getCurrentUser: jest.fn().mockResolvedValue({
    uuid: 'user-uuid',
    username: 'testuser',
    display: 'Test User',
  }),
  getVisibleModules: jest.fn().mockResolvedValue([]),
}));

describe('App', () => {
  it('should render successfully', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});
