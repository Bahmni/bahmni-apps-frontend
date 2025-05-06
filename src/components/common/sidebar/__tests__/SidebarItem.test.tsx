import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SidebarItem from '../SidebarItem';

// Mock the CSS module
jest.mock('../styles/Sidebar.module.scss', () => ({
  sidebarItem: 'sidebarItem-mock',
  active: 'active',
  label: 'label-mock',
}));

// Mock BahmniIcon to make testing simpler
jest.mock('@components/common/bahmniIcon/BahmniIcon.tsx', () => {
  return function BahmniIcon(props: {
    id: string;
    name: string;
    color: string;
    size: string;
  }) {
    return (
      <div data-testid={`${props.id}`} data-color={props.color}>
        Icon Mock
      </div>
    );
  };
});

describe('SidebarItem', () => {
  const defaultProps = {
    id: 'test-item',
    icon: 'fa-clipboard-list',
    label: 'Test Item',
  };

  it('renders with required props', () => {
    render(<SidebarItem {...defaultProps} />);

    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-icon-test-item')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-item-test-item')).toBeInTheDocument();
  });

  it('applies active styling when active', () => {
    render(<SidebarItem {...defaultProps} active={true} />);

    const sidebarItem = screen.getByTestId('sidebar-item-test-item');
    expect(sidebarItem).toHaveClass('active');
  });

  it('does not apply active styling when not active', () => {
    render(<SidebarItem {...defaultProps} active={false} />);

    const sidebarItem = screen.getByTestId('sidebar-item-test-item');
    expect(sidebarItem).not.toHaveClass('active');
  });

  it('calls action when clicked', () => {
    const mockAction = jest.fn();
    render(<SidebarItem {...defaultProps} action={mockAction} />);

    fireEvent.click(screen.getByTestId('sidebar-item-test-item'));
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('does not throw error when clicked without action', () => {
    render(<SidebarItem {...defaultProps} />);

    // This should not throw any error
    expect(() => {
      fireEvent.click(screen.getByTestId('sidebar-item-test-item'));
    }).not.toThrow();
  });

  it('passes correct color to icon based on active state', () => {
    const { rerender } = render(
      <SidebarItem {...defaultProps} active={true} />,
    );

    const activeIcon = screen.getByTestId('sidebar-icon-test-item');
    expect(activeIcon).toHaveAttribute('data-color', 'var(--cds-link-primary)');

    rerender(<SidebarItem {...defaultProps} active={false} />);
    const inactiveIcon = screen.getByTestId('sidebar-icon-test-item');
    expect(inactiveIcon).toHaveAttribute(
      'data-color',
      'var(--cds-text-secondary)',
    );
  });
});
