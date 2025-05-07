import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../Sidebar';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
// Mock the CSS module
jest.mock('../styles/Sidebar.module.scss', () => ({
  sidebar: 'sidebar-mock',
  sidebarItem: 'sidebarItem-mock',
  active: 'active',
  label: 'label-mock',
}));

// Mock Carbon components
jest.mock('@carbon/react', () => {
  return {
    SideNav: ({
      children,
      className,
      'data-testid': dataTestId,
    }: {
      children: React.ReactNode;
      className?: string;
      'data-testid'?: string;
    }) => (
      <nav className={className} data-testid={dataTestId}>
        {children}
      </nav>
    ),
    SideNavItems: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="side-nav-items">{children}</div>
    ),
    SideNavLink: ({
      children,
      renderIcon,
      href,
      onClick,
      isActive,
      'data-testid': dataTestId,
    }: {
      children: React.ReactNode;
      renderIcon?: () => React.ReactNode;
      href?: string;
      onClick?: (e: React.MouseEvent) => void;
      isActive?: boolean;
      'data-testid'?: string;
    }) => {
      const Icon = renderIcon ? renderIcon() : null;
      return (
        <a
          href={href}
          onClick={onClick}
          data-testid={dataTestId}
          data-active={isActive ? 'true' : 'false'}
          role="link"
          aria-current={isActive ? 'page' : undefined}
        >
          {Icon}
          <span>{children}</span>
        </a>
      );
    },
  };
});

// Mock BahmniIcon to make testing simpler
jest.mock('@components/common/bahmniIcon/BahmniIcon', () => {
  return function BahmniIcon(props: {
    id: string;
    name: string;
    color: string;
    size: string;
  }) {
    return (
      <div
        data-testid={`${props.id}`}
        data-icon-name={props.name}
        data-color={props.color}
      >
        Icon Mock
      </div>
    );
  };
});

describe('Sidebar', () => {
  const defaultItems = [
    {
      id: 'item1',
      icon: 'fa-clipboard-list',
      label: 'Item 1',
      active: true,
    },
    {
      id: 'item2',
      icon: 'fa-heartbeat',
      label: 'Item 2',
    },
  ];

  it('renders with a list of items', () => {
    render(<Sidebar items={defaultItems} />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-item-item1')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-item-item2')).toBeInTheDocument();
  });

  it('passes correct props to each SideNavLink', () => {
    render(<Sidebar items={defaultItems} />);

    const item1 = screen.getByTestId('sidebar-item-item1');
    expect(item1).toHaveAttribute('data-active', 'true');
    expect(item1).toHaveAttribute('aria-current', 'page');
    expect(item1).toHaveTextContent('Item 1');

    const item2 = screen.getByTestId('sidebar-item-item2');
    expect(item2).toHaveAttribute('data-active', 'false');
    expect(item2).not.toHaveAttribute('aria-current', 'page');
    expect(item2).toHaveTextContent('Item 2');
  });

  it('renders correctly with empty items array', () => {
    render(<Sidebar items={[]} />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.queryByTestId(/sidebar-item-/)).not.toBeInTheDocument();
  });

  it('calls action when item is clicked', () => {
    const mockAction = jest.fn();
    const itemsWithAction = [
      { ...defaultItems[0], action: mockAction },
      defaultItems[1],
    ];

    render(<Sidebar items={itemsWithAction} />);

    // Click the first item
    fireEvent.click(screen.getByTestId('sidebar-item-item1'));

    // Check that the action was called
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  describe('Accessibility', () => {
    test('accessible forms pass axe', async () => {
      const { container } = render(<Sidebar items={defaultItems} />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
