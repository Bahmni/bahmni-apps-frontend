import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from '../Sidebar';

// Mock the CSS module
jest.mock('../styles/Sidebar.module.scss', () => ({
  sidebar: 'sidebar-mock',
  sidebarItem: 'sidebarItem-mock',
  active: 'active',
  label: 'label-mock',
}));

// Mock SidebarItem to make testing simpler
jest.mock('../SidebarItem', () => {
  return function MockSidebarItem(props: {
    id: string;
    icon: string;
    label: string;
    active?: boolean;
  }) {
    return (
      <div
        data-testid={`sidebar-item-${props.id}`}
        data-active={props.active ? 'true' : 'false'}
      >
        {props.label}
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

  it('passes correct props to each SidebarItem', () => {
    render(<Sidebar items={defaultItems} />);

    const item1 = screen.getByTestId('sidebar-item-item1');
    expect(item1).toHaveAttribute('data-active', 'true');
    expect(item1).toHaveTextContent('Item 1');

    const item2 = screen.getByTestId('sidebar-item-item2');
    expect(item2).toHaveAttribute('data-active', 'false');
    expect(item2).toHaveTextContent('Item 2');
  });

  it('applies custom className when provided', () => {
    render(<Sidebar items={defaultItems} className="custom-class" />);

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('custom-class');
  });

  it('renders correctly with empty items array', () => {
    render(<Sidebar items={[]} />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.queryByTestId(/sidebar-item-/)).not.toBeInTheDocument();
  });
});
