import { act, render, screen } from '@testing-library/react';
import type { Patient } from 'fhir/r4';
import {
  CLOSE_MESSAGE,
  DUPLICATE_PATIENTS_MESSAGE,
  READY_MESSAGE,
} from '../../../constants/app';
import { DuplicatePatientFrame } from '../DuplicatePatientFrame';

const patients: Patient[] = [{ resourceType: 'Patient', id: 'p-1' }];
const currentPatient: Patient = { resourceType: 'Patient', id: 'current' };

const CROSS_ORIGIN = 'http://localhost:4200';
const CROSS_ORIGIN_URL = `${CROSS_ORIGIN}/iom/duplicate-resolution`;
const RELATIVE_URL = '/iom/duplicate-resolution';

const renderFrame = (featureURL = CROSS_ORIGIN_URL) => {
  const onClose = jest.fn();
  render(
    <DuplicatePatientFrame
      featureURL={featureURL}
      patients={patients}
      currentPatient={currentPatient}
      onClose={onClose}
    />,
  );
  const iframe = screen.getByTestId(
    'duplicate-patient-frame',
  ) as HTMLIFrameElement;
  const postMessage = jest.fn();
  const contentWindow = { postMessage } as unknown as MessageEventSource;
  Object.defineProperty(iframe, 'contentWindow', {
    value: contentWindow,
    configurable: true,
  });
  return { iframe, onClose, postMessage, contentWindow };
};

const dispatchMessage = (init: MessageEventInit) =>
  act(() => {
    window.dispatchEvent(new MessageEvent('message', init));
  });

describe('DuplicatePatientFrame', () => {
  it('renders an iframe pointing at the configured URL', () => {
    const { iframe } = renderFrame(RELATIVE_URL);

    expect(iframe).toHaveAttribute('src', RELATIVE_URL);
  });

  it('sandboxes the iframe to scripts and same-origin only', () => {
    const { iframe } = renderFrame();

    const tokens = (iframe.getAttribute('sandbox') ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .sort();

    expect(tokens).toEqual(['allow-same-origin', 'allow-scripts']);
  });

  it('posts the duplicate patients to the iframe origin once when the iframe announces READY', () => {
    const { postMessage, contentWindow } = renderFrame();

    dispatchMessage({
      data: { type: READY_MESSAGE },
      origin: CROSS_ORIGIN,
      source: contentWindow,
    });

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(
      { type: DUPLICATE_PATIENTS_MESSAGE, patients, currentPatient },
      CROSS_ORIGIN,
    );
  });

  it('posts to the host origin when featureURL is relative', () => {
    const { postMessage, contentWindow } = renderFrame(RELATIVE_URL);

    dispatchMessage({
      data: { type: READY_MESSAGE },
      origin: window.location.origin,
      source: contentWindow,
    });

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: DUPLICATE_PATIENTS_MESSAGE }),
      window.location.origin,
    );
  });

  it('ignores READY from a different origin', () => {
    const { postMessage, contentWindow } = renderFrame();

    dispatchMessage({
      data: { type: READY_MESSAGE },
      origin: 'https://evil.example',
      source: contentWindow,
    });

    expect(postMessage).not.toHaveBeenCalled();
  });

  it('ignores READY from another window', () => {
    const { postMessage } = renderFrame();

    dispatchMessage({
      data: { type: READY_MESSAGE },
      origin: CROSS_ORIGIN,
      source: window,
    });

    expect(postMessage).not.toHaveBeenCalled();
  });

  it('calls onClose when the iframe sends CLOSE', () => {
    const { onClose, contentWindow } = renderFrame();

    dispatchMessage({
      data: { type: CLOSE_MESSAGE },
      origin: CROSS_ORIGIN,
      source: contentWindow,
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores CLOSE from a different origin', () => {
    const { onClose, contentWindow } = renderFrame();

    dispatchMessage({
      data: { type: CLOSE_MESSAGE },
      origin: 'https://evil.example',
      source: contentWindow,
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
