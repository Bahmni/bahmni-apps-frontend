import { render, screen } from '@testing-library/react';
import { CsvUpload } from '../CsvUpload';

jest.mock('../../components/AdminLayout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-layout-test-id">{children}</div>
  ),
}));

describe('CsvUpload', () => {
  it('renders the placeholder page inside the admin layout', () => {
    render(<CsvUpload />);

    const layout = screen.getByTestId('admin-layout-test-id');
    const page = screen.getByTestId('admin-csv-upload-page-test-id');
    expect(layout).toContainElement(page);
    expect(screen.getByText('CSV Upload')).toBeInTheDocument();
    expect(
      screen.getByText('CSV bulk upload is coming soon.'),
    ).toBeInTheDocument();
  });
});
