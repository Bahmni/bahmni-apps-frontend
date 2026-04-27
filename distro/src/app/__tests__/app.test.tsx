import { render, waitFor } from '@testing-library/react';
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
}));

describe('App', () => {
  it('should render successfully', async () => {
    const { baseElement } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(baseElement).toBeTruthy();
    });
  });
});
