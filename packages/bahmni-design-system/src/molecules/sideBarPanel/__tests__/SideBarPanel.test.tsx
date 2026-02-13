import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SideBarPanel } from '../SideBarPanel';

expect.extend(toHaveNoViolations);

jest.mock('../styles/SideBarPanel.module.scss', () => ({
  sideBarNav: 'sideBarNav-class',
  sideBarHeader: 'sideBarHeader-class',
  title: 'title-class',
  closeIcon: 'closeIcon-class',
  sideBarChildren: 'sideBarChildren-class',
}));

describe('SideBarPanel', () => {
  const mockCloseSideBar = jest.fn();
  const defaultProps = {
    title: 'Test Sidebar',
    closeSideBar: mockCloseSideBar,
    children: <div>Test Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Paths', () => {
    it('should render correctly with required props', () => {
      render(<SideBarPanel {...defaultProps} />);

      expect(screen.getByText('Test Sidebar')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByTestId('side-bar-panel')).toBeInTheDocument();
    });

    it('should render with custom dataTestId when provided', () => {
      const customTestId = 'custom-sidebar';

      render(<SideBarPanel {...defaultProps} dataTestId={customTestId} />);

      expect(screen.getByTestId(customTestId)).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      const customClass = 'custom-sidebar-class';

      const { container } = render(
        <SideBarPanel {...defaultProps} className={customClass} />,
      );

      const sidebarElement = container.firstChild;
      expect(sidebarElement).toHaveClass('sideBarNav-class');
      expect(sidebarElement).toHaveClass(customClass);
    });

    it('should render custom ariaLabel when provided', () => {
      const customAriaLabel = 'Custom sidebar label';

      render(<SideBarPanel {...defaultProps} ariaLabel={customAriaLabel} />);

      expect(
        screen.getByRole('complementary', { name: customAriaLabel }),
      ).toBeInTheDocument();
    });

    it('should use title as aria-label when ariaLabel is not provided', () => {
      render(<SideBarPanel {...defaultProps} />);

      expect(
        screen.getByRole('complementary', { name: 'Test Sidebar' }),
      ).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      const childContent = (
        <div>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
          <button>Action Button</button>
        </div>
      );

      render(<SideBarPanel {...defaultProps}>{childContent}</SideBarPanel>);

      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Action Button' }),
      ).toBeInTheDocument();
    });

    it('should call closeSideBar when close button is clicked', () => {
      render(<SideBarPanel {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: 'Close sidebar' });
      fireEvent.click(closeButton);

      expect(mockCloseSideBar).toHaveBeenCalledTimes(1);
    });

    it('should have correct role attribute', () => {
      render(<SideBarPanel {...defaultProps} />);

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
    });

    it('should match snapshot', () => {
      const { container } = render(<SideBarPanel {...defaultProps} />);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<SideBarPanel {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper aria-label for close button', () => {
      render(<SideBarPanel {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: 'Close sidebar' });
      expect(closeButton).toHaveAttribute('aria-label', 'Close sidebar');
    });

    it('should maintain focus management with keyboard navigation', () => {
      render(<SideBarPanel {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: 'Close sidebar' });
      act(() => {
        closeButton.focus();
      });

      expect(closeButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should render with empty children', () => {
      render(
        <SideBarPanel {...defaultProps}>
          <div />
        </SideBarPanel>,
      );

      expect(screen.getByTestId('side-bar-panel')).toBeInTheDocument();
      expect(screen.getByText('Test Sidebar')).toBeInTheDocument();
    });

    it('should render with null children', () => {
      render(<SideBarPanel {...defaultProps}>{null}</SideBarPanel>);

      expect(screen.getByTestId('side-bar-panel')).toBeInTheDocument();
      expect(screen.getByText('Test Sidebar')).toBeInTheDocument();
    });

    it('should handle multiple close button clicks', () => {
      render(<SideBarPanel {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: 'Close sidebar' });
      fireEvent.click(closeButton);
      fireEvent.click(closeButton);
      fireEvent.click(closeButton);

      expect(mockCloseSideBar).toHaveBeenCalledTimes(3);
    });

    it('should render with very long title', () => {
      const longTitle = 'A'.repeat(100);

      render(<SideBarPanel {...defaultProps} title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should render with special characters in title', () => {
      const specialTitle = 'Test <>&"\'';

      render(<SideBarPanel {...defaultProps} title={specialTitle} />);

      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });
  });
});
