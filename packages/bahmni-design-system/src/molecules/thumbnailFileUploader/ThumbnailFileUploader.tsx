import { Close } from '@carbon/icons-react';
import { FileUploaderButton } from '@carbon/react';
import React, { useEffect, useRef } from 'react';
import { IconButton } from '../../atoms/iconButton';
import { InlineLoading } from '../../atoms/inlineLoading';
import styles from './styles/ThumbnailFileUploader.module.scss';

export interface ThumbnailFileUploaderItem {
  id: string;
  name: string;
  /** Clickable preview of the file, e.g. a tile that opens the file in a modal. */
  thumbnail: React.ReactNode;
  status?: 'uploading' | 'error';
  /** Text shown for the status, e.g. "Uploading…" or the upload error. */
  statusText?: string;
}

export interface ThumbnailFileUploaderProps {
  id: string;
  title?: string;
  description?: string;
  buttonLabel: string;
  /** Extensions (".pdf") or MIME types handed to the file input's accept filter. */
  accept?: string[];
  multiple?: boolean;
  disabled?: boolean;
  items: ThumbnailFileUploaderItem[];
  onFilesSelected: (files: File[]) => void;
  /** Return false to keep the file dialog from opening, e.g. while a precondition is unmet. */
  canBrowse?: () => boolean;
  onRemove: (id: string) => void;
  getRemoveLabel: (name: string) => string;
  listLabel?: string;
  testId?: string;
}

export const ThumbnailFileUploader: React.FC<ThumbnailFileUploaderProps> = ({
  id,
  title,
  description,
  buttonLabel,
  accept,
  multiple = true,
  disabled = false,
  items,
  onFilesSelected,
  canBrowse,
  onRemove,
  getRemoveLabel,
  listLabel,
  testId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const focusIndexAfterRemoval = useRef<number | null>(null);
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  // A removed item takes its remove button with it, so focus moves on to the nearest remaining
  // item, or back to the upload button once the list is empty.
  useEffect(() => {
    const index = focusIndexAfterRemoval.current;
    if (index === null) return;
    focusIndexAfterRemoval.current = null;
    const removeButtons = containerRef.current?.querySelectorAll<HTMLElement>(
      'button[data-remove-file]',
    );
    if (removeButtons?.length) {
      removeButtons[Math.min(index, removeButtons.length - 1)].focus();
    } else {
      containerRef.current
        ?.querySelector<HTMLElement>('[role="button"]')
        ?.focus();
    }
  }, [items.length]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  // The file dialog is opened by a click on the hidden input, whether from the button or from the
  // keyboard, so that is the one place it can be stopped.
  const handleClickCapture = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target instanceof HTMLInputElement && target.type === 'file') {
      if (canBrowse && !canBrowse()) {
        event.preventDefault();
      }
    }
  };

  const handleRemove = (index: number, itemId: string) => {
    focusIndexAfterRemoval.current = index;
    onRemove(itemId);
  };

  return (
    <div
      ref={containerRef}
      id={id}
      className={styles.container}
      data-testid={testId}
      role="group"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      onClickCapture={handleClickCapture}
    >
      {title && (
        <p id={titleId} className={styles.title}>
          {title}
        </p>
      )}
      {description && (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      )}
      <FileUploaderButton
        labelText={buttonLabel}
        buttonKind="primary"
        size="lg"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        disableLabelChanges
        onChange={handleChange}
        data-testid={testId ? `${testId}-button` : undefined}
      />
      {items.length > 0 && (
        <ul className={styles.list} aria-label={listLabel}>
          {items.map((item, index) => (
            <li
              key={item.id}
              className={styles.item}
              data-testid={testId ? `${testId}-item` : undefined}
            >
              <div className={styles.thumbnail}>{item.thumbnail}</div>
              <div className={styles.fileInfo}>
                <span className={styles.fileName} title={item.name}>
                  {item.name}
                </span>
                {item.status === 'uploading' && (
                  <InlineLoading
                    className={styles.status}
                    description={item.statusText}
                  />
                )}
                {item.status === 'error' && (
                  <span role="alert" className={styles.error}>
                    {item.statusText}
                  </span>
                )}
              </div>
              <IconButton
                data-remove-file
                label={getRemoveLabel(item.name)}
                kind="ghost"
                size="md"
                disabled={disabled}
                onClick={() => handleRemove(index, item.id)}
              >
                <Close />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ThumbnailFileUploader;
