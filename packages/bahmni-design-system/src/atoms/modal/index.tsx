import {
  Modal as CarbonModal,
  ModalProps as CarbonModalProps,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@carbon/react';
import React from 'react';

export type ModalProps = CarbonModalProps & {
  testId?: string;
};

export const Modal: React.FC<ModalProps> & {
  Header: typeof ModalHeader;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
} = ({ testId, children, ...carbonProps }) => {
  return (
    <CarbonModal {...carbonProps} data-testid={testId}>
      {children}
    </CarbonModal>
  );
};

// Attach subcomponents to Modal
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export { ModalHeader, ModalBody, ModalFooter };
