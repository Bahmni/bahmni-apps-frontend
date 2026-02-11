import {
  Modal as CarbonModal,
  ModalProps as CarbonModalProps,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@carbon/react';
import React from 'react';
import { createPortal } from 'react-dom';

export type ModalProps = CarbonModalProps & {
  testId?: string;
};

export const Modal: React.FC<ModalProps> & {
  Header: typeof ModalHeader;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
} = ({ testId, children, ...carbonProps }) => {
  return createPortal(
    <div
      id="modal-root"
      data-testid="modal-root-test-id"
      aria-label="modal-root-aria-label"
    >
      <CarbonModal {...carbonProps} data-testid={testId}>
        {children}
      </CarbonModal>
    </div>,
    document.getElementById('main-display-area') ?? document.body,
  );
};

// Attach subcomponents to Modal
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export { ModalHeader, ModalBody, ModalFooter };
