import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUploader, FileUploaderButton, FileUploaderItem } from '../index';

describe('FileUploader', () => {
  it('renders the carbon uploader with its label and a test id', () => {
    render(
      <FileUploader
        testId="uploader"
        labelTitle="Upload files"
        buttonLabel="Choose"
      />,
    );

    expect(screen.getByTestId('uploader')).toBeInTheDocument();
    expect(screen.getByText('Upload files')).toBeInTheDocument();
  });
});

describe('FileUploaderButton', () => {
  it('shows its label and reports the selected files', async () => {
    const onChange = jest.fn();
    render(
      <FileUploaderButton
        labelText="Upload"
        accept={['.png']}
        multiple
        disableLabelChanges
        onChange={onChange}
      />,
    );
    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]')!;

    expect(screen.getAllByText('Upload').length).toBeGreaterThan(0);
    expect(input).toHaveAttribute('accept', '.png');
    expect(input).toHaveAttribute('multiple');

    await userEvent.upload(
      input,
      new File(['x'], 'a.png', { type: 'image/png' }),
    );

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('is disabled when asked to be', () => {
    render(<FileUploaderButton labelText="Upload" disabled />);

    expect(document.querySelector('input[type="file"]')).toBeDisabled();
  });
});

describe('FileUploaderItem', () => {
  it('shows the file name and removes it', () => {
    const onDelete = jest.fn();
    render(
      <FileUploaderItem
        testId="item"
        uuid="u1"
        name="scan.png"
        status="edit"
        iconDescription="Remove"
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('scan.png')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Remove/ }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('shows the error of an invalid file', () => {
    render(
      <FileUploaderItem
        uuid="u1"
        name="scan.png"
        status="edit"
        invalid
        errorSubject="Upload failed"
        errorBody="Server said no"
      />,
    );

    expect(screen.getByText('Upload failed')).toBeInTheDocument();
    expect(screen.getByText('Server said no')).toBeInTheDocument();
  });
});
