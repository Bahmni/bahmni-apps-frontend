import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DocumentUpload } from '../DocumentUpload';
import { DocumentSaveTarget } from '../models';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  uploadDocument: jest.fn().mockResolvedValue({ url: 'patient/doc.png' }),
  saveDocument: jest.fn().mockResolvedValue({}),
}));

const mockAddNotification = jest.fn();
jest.mock('../../notification', () => ({
  useNotification: () => ({ addNotification: mockAddNotification }),
}));

jest.mock('../../activePractitioner', () => ({
  useActivePractitioner: () => ({
    practitioner: { uuid: 'practitioner-uuid' },
  }),
}));

const { uploadDocument, saveDocument } = jest.requireMock('@bahmni/services');

const EXISTING_ENCOUNTER_TARGET = { encounterUuid: 'encounter-uuid' };
const CREATE_ENCOUNTER_TARGET = {
  createEncounterInVisit: {
    visitUuid: 'visit-uuid',
    encounterTypeUuid: 'encounter-type-uuid',
    encounterTypeDisplay: 'Patient Document',
  },
};

const renderWidget = (
  onSaved = jest.fn(),
  saveTarget: DocumentSaveTarget = EXISTING_ENCOUNTER_TARGET,
) =>
  render(
    <DocumentUpload
      patientUuid="patient-uuid"
      encounterTypeName="Patient Document"
      saveTarget={saveTarget}
      documentTypes={[{ id: 'type-1', label: 'Lab Report' }]}
      onSaved={onSaved}
    />,
  );

const selectFile = (mimeType = 'image/png', sizeInBytes = 4) => {
  const input = screen.getByTestId('document-file-input');
  const file = new File([new Uint8Array(sizeInBytes)], 'doc.png', {
    type: mimeType,
  });
  fireEvent.change(input, { target: { files: [file] } });
};

describe('DocumentUpload', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the upload section', () => {
    renderWidget();
    expect(screen.getByText('Upload files')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
  });

  it('uploads bytes on file select and shows the pending row', async () => {
    renderWidget();
    selectFile();
    await waitFor(() =>
      expect(uploadDocument).toHaveBeenCalledWith(
        expect.any(File),
        'Patient Document',
        'patient-uuid',
      ),
    );
    expect(
      await screen.findByTestId('pending-document-row'),
    ).toBeInTheDocument();
  });

  it('rejects unsupported file types without uploading', () => {
    renderWidget();
    selectFile('text/plain');
    expect(uploadDocument).not.toHaveBeenCalled();
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' }),
    );
  });

  it('saves the document with the upload url and calls onSaved', async () => {
    const onSaved = jest.fn();
    renderWidget(onSaved);
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(saveDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          patientUuid: 'patient-uuid',
          url: 'patient/doc.png',
          encounterUuid: 'encounter-uuid',
        }),
      ),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('shows a success notification after saving', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      ),
    );
  });

  it('passes the create-encounter save target through when no encounter exists yet', async () => {
    renderWidget(jest.fn(), CREATE_ENCOUNTER_TARGET);
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(saveDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          patientUuid: 'patient-uuid',
          url: 'patient/doc.png',
          createEncounterInVisit: {
            visitUuid: 'visit-uuid',
            encounterTypeUuid: 'encounter-type-uuid',
            encounterTypeDisplay: 'Patient Document',
          },
        }),
      ),
    );
  });

  it('rejects a file larger than the 5MB limit without uploading', () => {
    renderWidget();
    selectFile('image/png', 6 * 1024 * 1024);

    expect(uploadDocument).not.toHaveBeenCalled();
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' }),
    );
  });

  it('renders a video tile for a video upload', async () => {
    renderWidget();
    selectFile('video/mp4');
    expect(
      await screen.findByTestId('pending-document-row'),
    ).toBeInTheDocument();
  });

  it('renders a file tile for a pdf upload', async () => {
    renderWidget();
    selectFile('application/pdf');
    expect(
      await screen.findByTestId('pending-document-row'),
    ).toBeInTheDocument();
  });

  it('notifies and shows no pending row when the byte upload fails', async () => {
    uploadDocument.mockRejectedValueOnce(new Error('Network error'));
    renderWidget();
    selectFile();

    await waitFor(() =>
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      ),
    );
    expect(
      screen.queryByTestId('pending-document-row'),
    ).not.toBeInTheDocument();
  });

  it('adds the typed note as the description on save', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByText('Add note'));
    fireEvent.change(screen.getByTestId('document-note'), {
      target: { value: 'follow up in 2 weeks' },
    });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(saveDocument).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'follow up in 2 weeks' }),
      ),
    );
  });

  it('defaults to the first document type and sends it on save', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    expect(screen.queryByText('Choose an option')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(saveDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          typeCode: 'type-1',
          typeDisplay: 'Lab Report',
        }),
      ),
    );
  });

  it('discards the pending document when the discard button is clicked', async () => {
    renderWidget();
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByLabelText('Discard'));

    expect(
      screen.queryByTestId('pending-document-row'),
    ).not.toBeInTheDocument();
    expect(saveDocument).not.toHaveBeenCalled();
  });

  it('keeps the pending selection and notifies on save failure', async () => {
    saveDocument.mockRejectedValueOnce(new Error('Network error'));
    const onSaved = jest.fn();
    renderWidget(onSaved);
    selectFile();
    await screen.findByTestId('pending-document-row');

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      ),
    );
    // no data loss: the pending row is retained so the user can retry
    expect(screen.getByTestId('pending-document-row')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
