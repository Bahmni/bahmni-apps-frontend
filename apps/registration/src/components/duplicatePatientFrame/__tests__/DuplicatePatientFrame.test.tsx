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

const FEATURE_URL = '/extn/duplicate-resolution';
const HOST_ORIGIN = window.location.origin;
const OTHER_ORIGIN = 'https://evil.example';

const FRAME_ORIGIN = 'http://dev.example.org';
const EXTERNAL_URL = `${FRAME_ORIGIN}${FEATURE_URL}`;

const renderFrame = (
  featureURL = FEATURE_URL,
  isTrustedOrigin: (origin: string) => boolean = () => true,
) => {
  const onClose = jest.fn();
  render(
    <DuplicatePatientFrame
      featureURL={featureURL}
      patients={patients}
      currentPatient={currentPatient}
      isTrustedOrigin={isTrustedOrigin}
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
    const { iframe } = renderFrame();

    expect(iframe).toHaveAttribute('src', FEATURE_URL);
  });

  it('sandboxes the iframe to scripts, same-origin and popups only', () => {
    const { iframe } = renderFrame();

    const tokens = (iframe.getAttribute('sandbox') ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .sort();

    expect(tokens).toEqual([
      'allow-popups',
      'allow-popups-to-escape-sandbox',
      'allow-same-origin',
      'allow-scripts',
    ]);
  });

  it('posts the duplicate patients to the host origin once when the iframe announces READY', () => {
    const { postMessage, contentWindow } = renderFrame();

    dispatchMessage({
      data: { type: READY_MESSAGE },
      origin: HOST_ORIGIN,
      source: contentWindow,
    });

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(
      { type: DUPLICATE_PATIENTS_MESSAGE, patients, currentPatient },
      HOST_ORIGIN,
    );
  });

  it('ignores READY from a different origin', () => {
    const { postMessage, contentWindow } = renderFrame();

    dispatchMessage({
      data: { type: READY_MESSAGE },
      origin: OTHER_ORIGIN,
      source: contentWindow,
    });

    expect(postMessage).not.toHaveBeenCalled();
  });

  it('ignores READY from another window', () => {
    const { postMessage } = renderFrame();

    dispatchMessage({
      data: { type: READY_MESSAGE },
      origin: HOST_ORIGIN,
      source: window,
    });

    expect(postMessage).not.toHaveBeenCalled();
  });

  it('calls onClose when the iframe sends CLOSE', () => {
    const { onClose, contentWindow } = renderFrame();

    dispatchMessage({
      data: { type: CLOSE_MESSAGE },
      origin: HOST_ORIGIN,
      source: contentWindow,
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores CLOSE from a different origin', () => {
    const { onClose, contentWindow } = renderFrame();

    dispatchMessage({
      data: { type: CLOSE_MESSAGE },
      origin: OTHER_ORIGIN,
      source: contentWindow,
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores CLOSE from another window', () => {
    const { onClose } = renderFrame();

    dispatchMessage({
      data: { type: CLOSE_MESSAGE },
      origin: HOST_ORIGIN,
      source: window,
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('checks the sender origin against the trusted domains and ignores READY and CLOSE when it is not trusted', () => {
    const isTrustedOrigin = jest.fn().mockReturnValue(false);
    const { postMessage, onClose, contentWindow } = renderFrame(
      EXTERNAL_URL,
      isTrustedOrigin,
    );

    dispatchMessage({
      data: { type: READY_MESSAGE },
      origin: FRAME_ORIGIN,
      source: contentWindow,
    });
    dispatchMessage({
      data: { type: CLOSE_MESSAGE },
      origin: FRAME_ORIGIN,
      source: contentWindow,
    });

    expect(isTrustedOrigin).toHaveBeenCalledWith(FRAME_ORIGIN);
    expect(postMessage).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  describe('when featureURL is on another origin', () => {
    it('posts to, and accepts READY and CLOSE only from, that origin', () => {
      const { postMessage, onClose, contentWindow } = renderFrame(EXTERNAL_URL);

      dispatchMessage({
        data: { type: READY_MESSAGE },
        origin: FRAME_ORIGIN,
        source: contentWindow,
      });
      dispatchMessage({
        data: { type: CLOSE_MESSAGE },
        origin: FRAME_ORIGIN,
        source: contentWindow,
      });

      expect(postMessage).toHaveBeenCalledTimes(1);
      expect(postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: DUPLICATE_PATIENTS_MESSAGE }),
        FRAME_ORIGIN,
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ignores READY and CLOSE from a trusted origin if that is not the iframe origin', () => {
      const trustEveryOrigin = () => true;
      const { postMessage, onClose, contentWindow } = renderFrame(
        EXTERNAL_URL,
        trustEveryOrigin,
      );

      [READY_MESSAGE, CLOSE_MESSAGE].forEach((type) => {
        dispatchMessage({
          data: { type },
          origin: HOST_ORIGIN,
          source: contentWindow,
        });
      });

      expect(postMessage).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
