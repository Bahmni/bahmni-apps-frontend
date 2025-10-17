import { render, screen, fireEvent } from '@testing-library/react';

import Header, { BreadcrumbItem, HeaderProps } from '../Header';

describe('Header', () => {
  const mockBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/home' },
    { label: 'Current Page' },
  ];

  const defaultProps: HeaderProps = {
    breadcrumbs: mockBreadcrumbs,
  };

  it('should render breadcrumbs correctly', () => {
    render(<Header {...defaultProps} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Current Page')).toBeInTheDocument();
  });

  it('should render profile section', () => {
    render(<Header {...defaultProps} />);

    expect(screen.getByText('Hi, Profile name')).toBeInTheDocument();
  });

  describe('Button rendering', () => {
    it('should not render button when showButton is false', () => {
      render(<Header {...defaultProps} showButton={false} buttonText="Save" />);

      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });

    it('should not render button when showButton is true but buttonText is undefined', () => {
      render(<Header {...defaultProps} showButton />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should not render button when showButton is true but buttonText is empty', () => {
      render(<Header {...defaultProps} showButton buttonText="" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render button when showButton is true and buttonText is provided', () => {
      render(<Header {...defaultProps} showButton buttonText="Save Patient" />);

      expect(screen.getByText('Save Patient')).toBeInTheDocument();
    });

    it('should call onButtonClick when button is clicked', () => {
      const mockOnButtonClick = jest.fn();

      render(
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
      render(
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
      render(
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
      render(
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
      const { container } = render(
        <Header {...defaultProps} className="custom-class" />,
      );

      const headerElement = container.querySelector('.custom-class');
      expect(headerElement).toBeInTheDocument();
    });

    it('should handle undefined className gracefully', () => {
      const { container } = render(
        <Header {...defaultProps} className={undefined} />,
      );

      const headerElements = container.querySelectorAll(
        '[class*="customHeader"]',
      );
      expect(headerElements.length).toBeGreaterThan(0);
    });

    it('should handle null className gracefully', () => {
      const { container } = render(
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

      render(<Header breadcrumbs={breadcrumbsWithClick} />);

      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Create Patient')).toBeInTheDocument();
    });

    it('should render single breadcrumb item', () => {
      const singleBreadcrumb: BreadcrumbItem[] = [{ label: 'Dashboard' }];

      render(<Header breadcrumbs={singleBreadcrumb} />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Complex scenarios', () => {
    it('should render with all props provided', () => {
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

      render(<Header {...fullProps} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Current Page')).toBeInTheDocument();
      expect(screen.getByText('Complete Action')).toBeInTheDocument();
      expect(screen.getByText('Hi, Profile name')).toBeInTheDocument();
      expect(screen.getByTestId('action-button')).toBeInTheDocument();
    });

    it('should render with minimal props', () => {
      render(<Header breadcrumbs={mockBreadcrumbs} />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Current Page')).toBeInTheDocument();
      expect(screen.getByText('Hi, Profile name')).toBeInTheDocument();
    });
  });
});
