import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useHeaderSideNav } from '../useHeaderSideNav';

// Mock window.innerWidth for testing
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

describe('useHeaderSideNav', () => {
  const onItemClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset any window property mocks
    jest.restoreAllMocks();
  });

  it('should initialize with provided initialExpanded value', () => {
    mockInnerWidth(1920);
    const { result } = renderHook(() => useHeaderSideNav(onItemClick, true));
    expect(result.current.isSideNavExpanded).toBe(true);
  });

  it('should call onItemClick when handleSideNavItemClick is called', () => {
    const { result } = renderHook(() => useHeaderSideNav(onItemClick));

    const event = {
      preventDefault: jest.fn(),
    } as unknown as React.MouseEvent<HTMLElement>;
    const itemId = 'test-item';

    act(() => {
      result.current.handleSideNavItemClick(event, itemId);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(onItemClick).toHaveBeenCalledWith(itemId);
  });
});
