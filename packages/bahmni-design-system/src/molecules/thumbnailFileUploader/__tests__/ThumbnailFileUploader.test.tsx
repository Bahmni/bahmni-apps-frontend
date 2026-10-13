import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThumbnailFileUploader } from '../ThumbnailFileUploader';

const items = [
  {
    id: 'a',
    name: 'scan.png',
    thumbnail: <button type="button">preview a</button>,
  },
  {
    id: 'b',
    name: 'report.pdf',
    thumbnail: <button type="button">preview b</button>,
    status: 'uploading' as const,
    statusText: 'Uploading…',
  },
  {
    id: 'c',
    name: 'broken.png',
    thumbnail: <button type="button">preview c</button>,
    status: 'error' as const,
    statusText: 'Upload failed',
  },
];

const renderUploader = (
  props: Partial<React.ComponentProps<typeof ThumbnailFileUploader>> = {},
) =>
  render(
    <ThumbnailFileUploader
      id="uploader"
      testId="uploader"
      title="Upload files"
      description="Max file size is 5MB"
      buttonLabel="Upload"
      items={items}
      onFilesSelected={jest.fn()}
      onRemove={jest.fn()}
      getRemoveLabel={(name) => `Remove ${name}`}
      listLabel="Selected files"
      {...props}
    />,
  );

describe('ThumbnailFileUploader', () => {
  it('names the group by its title and describes it by its help text', () => {
    renderUploader();

    const group = screen.getByRole('group', { name: 'Upload files' });
    expect(group).toHaveAccessibleDescription('Max file size is 5MB');
  });

  it('renders a thumbnail, file name and remove button for each item', () => {
    renderUploader();

    expect(screen.getByRole('list', { name: 'Selected files' })).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('scan.png')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'preview a' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove report.pdf' }),
    ).toBeInTheDocument();
  });

  it('shows uploading and error status text', () => {
    renderUploader();

    expect(screen.getByText('Uploading…')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Upload failed');
  });

  it('does not render a list when there are no items', () => {
    renderUploader({ items: [] });

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('reports the selected files', async () => {
    const onFilesSelected = jest.fn();
    renderUploader({ items: [], onFilesSelected });
    const file = new File(['x'], 'new.png', { type: 'image/png' });

    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]');

    await userEvent.upload(input!, file);

    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it('reports the id of the item whose remove button is pressed', () => {
    const onRemove = jest.fn();
    renderUploader({ onRemove });

    fireEvent.click(screen.getByRole('button', { name: 'Remove report.pdf' }));

    expect(onRemove).toHaveBeenCalledWith('b');
  });

  it('disables picking and removing while disabled', () => {
    renderUploader({ disabled: true });

    expect(
      screen.getByRole('button', { name: 'Remove scan.png' }),
    ).toBeDisabled();
  });

  it('moves focus to the next remove button after an item is removed', () => {
    const { rerender } = renderUploader();

    fireEvent.click(screen.getByRole('button', { name: 'Remove scan.png' }));
    rerender(
      <ThumbnailFileUploader
        id="uploader"
        testId="uploader"
        buttonLabel="Upload"
        items={items.slice(1)}
        onFilesSelected={jest.fn()}
        onRemove={jest.fn()}
        getRemoveLabel={(name) => `Remove ${name}`}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Remove report.pdf' }),
    ).toHaveFocus();
  });

  describe('canBrowse', () => {
    const clickFileInput = () => {
      const input =
        document.querySelector<HTMLInputElement>('input[type="file"]')!;
      // fireEvent returns false when a listener cancelled the event.
      return fireEvent.click(input);
    };

    it('lets the file dialog open when it returns true', () => {
      renderUploader({ items: [], canBrowse: () => true });

      expect(clickFileInput()).toBe(true);
    });

    it('stops the file dialog from opening when it returns false', () => {
      const canBrowse = jest.fn().mockReturnValue(false);
      renderUploader({ items: [], canBrowse });

      expect(clickFileInput()).toBe(false);
      expect(canBrowse).toHaveBeenCalledTimes(1);
    });

    it('does not interfere with other clicks', () => {
      const canBrowse = jest.fn().mockReturnValue(false);
      renderUploader({ canBrowse });

      fireEvent.click(screen.getByRole('button', { name: 'Remove scan.png' }));

      expect(canBrowse).not.toHaveBeenCalled();
    });
  });
});
