import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CategoryPicker } from '../categoryPickers/types';
import { CategorySelectionModal } from '../CategorySelectionModal';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

interface FakeItem {
  id: string;
  label: string;
}

const buildPicker = (
  overrides: Partial<CategoryPicker<FakeItem>> = {},
): CategoryPicker<FakeItem> => ({
  heading: 'FAKE_HEADING',
  emptyStateMessage: 'FAKE_EMPTY_STATE',
  fetchItems: jest.fn().mockResolvedValue([]),
  getItemKey: (item) => item.id,
  renderItem: (item) => ({ primary: item.label }),
  resolveSelection: (item, context) => ({
    context: { ...context, itemId: item.id },
  }),
  ...overrides,
});

describe('CategorySelectionModal', () => {
  it('shows a loading indicator while fetchItems is pending', async () => {
    let resolveItems: (items: FakeItem[]) => void;
    const picker = buildPicker({
      fetchItems: jest.fn(
        () =>
          new Promise<FakeItem[]>((resolve) => {
            resolveItems = resolve;
          }),
      ),
    });

    render(
      <CategorySelectionModal
        open
        picker={picker}
        context={{}}
        onSelect={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(
      screen.getByText('PRINT_MODAL_LOADING_ENCOUNTERS'),
    ).toBeInTheDocument();

    resolveItems!([]);
    await waitFor(() =>
      expect(
        screen.queryByText('PRINT_MODAL_LOADING_ENCOUNTERS'),
      ).not.toBeInTheDocument(),
    );
  });

  it('shows the empty-state message when fetchItems resolves to []', async () => {
    const picker = buildPicker({ fetchItems: jest.fn().mockResolvedValue([]) });

    render(
      <CategorySelectionModal
        open
        picker={picker}
        context={{}}
        onSelect={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(await screen.findByText('FAKE_EMPTY_STATE')).toBeInTheDocument();
  });

  it('shows an error message when fetchItems rejects', async () => {
    const picker = buildPicker({
      fetchItems: jest.fn().mockRejectedValue(new Error('boom')),
    });

    render(
      <CategorySelectionModal
        open
        picker={picker}
        context={{}}
        onSelect={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(
      await screen.findByText('PRINT_MODAL_FETCH_ENCOUNTERS_ERROR'),
    ).toBeInTheDocument();
  });

  it('renders one tile per item using renderItem, and calls onSelect on click', async () => {
    const items: FakeItem[] = [
      { id: 'a', label: 'Item A' },
      { id: 'b', label: 'Item B' },
    ];
    const picker = buildPicker({
      fetchItems: jest.fn().mockResolvedValue(items),
      renderItem: (item) => ({ primary: item.label, secondary: item.id }),
    });
    const onSelect = jest.fn();

    render(
      <CategorySelectionModal
        open
        picker={picker}
        context={{}}
        onSelect={onSelect}
        onCancel={jest.fn()}
      />,
    );

    expect(await screen.findByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Item A'));
    expect(onSelect).toHaveBeenCalledWith(items[0]);
  });

  it('calls onCancel when the modal close button is clicked', async () => {
    const picker = buildPicker();
    const onCancel = jest.fn();

    render(
      <CategorySelectionModal
        open
        picker={picker}
        context={{}}
        onSelect={jest.fn()}
        onCancel={onCancel}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
