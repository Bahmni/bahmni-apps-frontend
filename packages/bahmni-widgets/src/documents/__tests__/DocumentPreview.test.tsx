import { fireEvent, render, screen, within } from '@testing-library/react';
import { DocumentPreview } from '../DocumentPreview';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      key === 'DOCUMENTS_ATTACHMENT_COUNTER'
        ? `Attachment ${options?.current} of ${options?.total}`
        : key,
  }),
}));

const png = (name: string) => ({
  url: `100/${name}.png`,
  contentType: 'image/png',
});
const pdf = (name: string) => ({
  url: `100/${name}.pdf`,
  contentType: 'application/pdf',
});

const renderPreview = (attachments = [png('one'), png('two'), pdf('three')]) =>
  render(
    <DocumentPreview id="doc" title="Passport" attachments={attachments} />,
  );

const open = () => fireEvent.click(screen.getByTestId('doc-test-id'));

describe('DocumentPreview', () => {
  it('shows a single thumbnail for a document with several attachments', () => {
    renderPreview();

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByTestId('doc-test-id')).toHaveTextContent('');
  });

  it('keeps the preview closed until the thumbnail is clicked', () => {
    renderPreview();

    expect(screen.queryByTestId('doc-modal-test-id')).not.toBeInTheDocument();
  });

  it('previews every attachment, in order, once the thumbnail is clicked', () => {
    renderPreview();

    open();

    const first = screen.getByTestId('doc-attachment-0-test-id');
    const second = screen.getByTestId('doc-attachment-1-test-id');
    const third = screen.getByTestId('doc-attachment-2-test-id');
    expect(within(first).getByRole('img')).toHaveAttribute(
      'src',
      expect.stringContaining('100/one.png'),
    );
    expect(within(second).getByRole('img')).toHaveAttribute(
      'src',
      expect.stringContaining('100/two.png'),
    );
    expect(within(third).getByTitle('Passport')).toHaveAttribute(
      'src',
      expect.stringContaining('100/three.pdf'),
    );
    expect(within(first).getByText('Attachment 1 of 3')).toBeInTheDocument();
    expect(within(third).getByText('Attachment 3 of 3')).toBeInTheDocument();
  });

  it('does not number a document that has a single attachment', () => {
    renderPreview([png('one')]);

    open();

    expect(screen.queryByText(/Attachment 1 of/)).not.toBeInTheDocument();
    expect(screen.getByTestId('doc-attachment-0-test-id')).toBeInTheDocument();
  });

  it('plays a video attachment inline', () => {
    renderPreview([{ url: '100/clip.mp4', contentType: 'video/mp4' }]);

    open();

    expect(screen.getByTitle('Passport').tagName).toBe('VIDEO');
  });

  it('shows an error for an attachment whose url cannot be resolved', () => {
    renderPreview([
      png('one'),
      { url: 'blob:unreachable', contentType: 'image/png' },
    ]);

    open();

    expect(
      within(screen.getByTestId('doc-attachment-1-test-id')).getByText(
        'DOCUMENTS_ERROR_LOADING_ATTACHMENT',
      ),
    ).toBeInTheDocument();
  });
});
