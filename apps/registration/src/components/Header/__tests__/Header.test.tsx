import { getCurrentUser } from '@bahmni-frontend/bahmni-services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import Header, { BreadcrumbItem, HeaderProps } from '../Header';

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  getCurrentUser: jest.fn(),
}));

describe('Header', () => {
  let queryClient: QueryClient;

  const mockBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/home' },
    { label: 'Current Page' },
  ];

  const defaultProps: HeaderProps = {
    breadcrumbs: mockBreadcrumbs,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    (getCurrentUser as jest.Mock).mockResolvedValue({
      username: 'testuser',
      uuid: 'test-uuid',
    });
  });

  const renderWithClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  };

  it('should render breadcrumbs correctly', () => {
    renderWithClient(<Header {...defaultProps} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Current Page')).toBeInTheDocument();
  });

  it('should render profile section', async () => {
    renderWithClient(<Header {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Hi, testuser')).toBeInTheDocument();
    });
  });

  describe('Button rendering', () => {
    it('should not render button when showButton is false', () => {
      renderWithClient(
        <Header {...defaultProps} showButton={false} buttonText="Save" />,
      );

      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });

    it('should not render button when showButton is true but buttonText is undefined', () => {
      renderWithClient(<Header {...defaultProps} showButton />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should not render button when showButton is true but buttonText is empty', () => {
      renderWithClient(<Header {...defaultProps} showButton buttonText="" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render button when showButton is true and buttonText is provided', () => {
      renderWithClient(
        <Header {...defaultProps} showButton buttonText="Save Patient" />,
      );

      expect(screen.getByText('Save Patient')).toBeInTheDocument();
    });

    it('should call onButtonClick when button is clicked', () => {
      const mockOnButtonClick = jest.fn();

      renderWithClient(
        <Header
          {...defaultProps}
          showButton
          buttonText="Submit"
          onButtonClick={mockOnButtonClick}
        />,
      );

      const button = screen.getByText('Submit');
      fireEvent.click(button);

      expect(mockOnButtonClick).toHaveBeenCalledTimes(1);
    });

    it('should render disabled button when buttonDisabled is true', () => {
      renderWithClient(
        <Header
          {...defaultProps}
          showButton
          buttonText="Save"
          buttonDisabled
        />,
      );

      const button = screen.getByText('Save');
      expect(button).toBeDisabled();
    });

    it('should render enabled button when buttonDisabled is false', () => {
      renderWithClient(
        <Header
          {...defaultProps}
          showButton
          buttonText="Save"
          buttonDisabled={false}
        />,
      );

      const button = screen.getByText('Save');
      expect(button).not.toBeDisabled();
    });

    it('should pass buttonTestId to button', () => {
      renderWithClient(
        <Header
          {...defaultProps}
          showButton
          buttonText="Save"
          buttonTestId="save-button"
        />,
      );

      expect(screen.getByTestId('save-button')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('should apply custom className when provided', () => {
      const { container } = renderWithClient(
        <Header {...defaultProps} className="custom-class" />,
      );

      const headerElement = container.querySelector('.custom-class');
      expect(headerElement).toBeInTheDocument();
    });

    it('should handle undefined className gracefully', () => {
      const { container } = renderWithClient(
        <Header {...defaultProps} className={undefined} />,
      );

      const headerElements = container.querySelectorAll(
        '[class*="customHeader"]',
      );
      expect(headerElements.length).toBeGreaterThan(0);
    });

    it('should handle null className gracefully', () => {
      const { container } = renderWithClient(
        <Header {...defaultProps} className={null as any} />,
      );

      const headerElements = container.querySelectorAll(
        '[class*="customHeader"]',
      );
      expect(headerElements.length).toBeGreaterThan(0);
    });
  });

  describe('Breadcrumbs with onClick', () => {
    it('should render breadcrumbs with onClick handlers', () => {
      const mockOnClick = jest.fn();
      const breadcrumbsWithClick: BreadcrumbItem[] = [
        { label: 'Search', onClick: mockOnClick },
        { label: 'Create Patient' },
      ];

      renderWithClient(<Header breadcrumbs={breadcrumbsWithClick} />);

      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Create Patient')).toBeInTheDocument();
    });

    it('should render single breadcrumb item', () => {
      const singleBreadcrumb: BreadcrumbItem[] = [{ label: 'Dashboard' }];

      renderWithClient(<Header breadcrumbs={singleBreadcrumb} />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Complex scenarios', () => {
    it('should render with all props provided', async () => {
      const mockOnButtonClick = jest.fn();
      const fullProps: HeaderProps = {
        breadcrumbs: mockBreadcrumbs,
        showButton: true,
        buttonText: 'Complete Action',
        buttonDisabled: false,
        onButtonClick: mockOnButtonClick,
        buttonTestId: 'action-button',
        className: 'full-props-class',
      };

      renderWithClient(<Header {...fullProps} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Current Page')).toBeInTheDocument();
      expect(screen.getByText('Complete Action')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Hi, testuser')).toBeInTheDocument();
      });
      expect(screen.getByTestId('action-button')).toBeInTheDocument();
    });

    it('should render with minimal props', async () => {
      renderWithClient(<Header breadcrumbs={mockBreadcrumbs} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Current Page')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Hi, testuser')).toBeInTheDocument();
      });
    });
  });
});
