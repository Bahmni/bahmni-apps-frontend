import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { useSidebarNavigation, SidebarItem } from '@hooks/useSidebarNavigation';

// Test component to expose hook values
interface TestComponentProps {
  items: SidebarItem[];
}

const TestComponent: React.FC<TestComponentProps> = ({ items }) => {
  const { activeItemId, handleItemClick } = useSidebarNavigation(items);

  return (
    <div>
      <div data-testid="active-item-id">{activeItemId || 'none'}</div>
      <button data-testid="set-item1" onClick={() => handleItemClick('item1')}>
        Set Item 1
      </button>
      <button data-testid="set-item2" onClick={() => handleItemClick('item2')}>
        Set Item 2
      </button>
    </div>
  );
};

describe('useSidebarNavigation Hook', () => {
  const mockSidebarItems = [
    { id: 'item1', label: 'Item 1', icon: 'icon1' },
    { id: 'item2', label: 'Item 2', icon: 'icon2' },
  ];

  it('should return null activeItemId when items array is empty', () => {
    render(<TestComponent items={[]} />);
    expect(screen.getByTestId('active-item-id')).toHaveTextContent('none');
  });

  it('should use first item as default active item when no active item is set', () => {
    render(<TestComponent items={mockSidebarItems} />);
    expect(screen.getByTestId('active-item-id')).toHaveTextContent('item1');
  });

  it('should update active item when handleItemClick is called', () => {
    render(<TestComponent items={mockSidebarItems} />);

    // Initial state should use first item
    expect(screen.getByTestId('active-item-id')).toHaveTextContent('item1');

    // Update active item
    act(() => {
      screen.getByTestId('set-item2').click();
    });

    // Should reflect the new active item
    expect(screen.getByTestId('active-item-id')).toHaveTextContent('item2');
  });

  it('should maintain active item through re-renders', () => {
    const { rerender } = render(<TestComponent items={mockSidebarItems} />);

    // Set active item
    act(() => {
      screen.getByTestId('set-item2').click();
    });

    // Rerender with same props
    rerender(<TestComponent items={mockSidebarItems} />);

    // Should maintain the active item
    expect(screen.getByTestId('active-item-id')).toHaveTextContent('item2');
  });

  it('should reset to first item if active item no longer exists in items array', () => {
    const { rerender } = render(<TestComponent items={mockSidebarItems} />);

    // Set active item
    act(() => {
      screen.getByTestId('set-item2').click();
    });

    // Should show the new active item
    expect(screen.getByTestId('active-item-id')).toHaveTextContent('item2');

    // Rerender with modified items where item2 is removed
    rerender(<TestComponent items={[mockSidebarItems[0]]} />);

    // Should reset to first available item
    expect(screen.getByTestId('active-item-id')).toHaveTextContent('item1');
  });
});
