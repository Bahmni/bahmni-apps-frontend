import { Link } from '@bahmni/design-system';
import { formatUrl } from '@bahmni/services';
import React from 'react';

interface LinkButtonProps {
  href?: string;
  forwardUrl?: string;
  newTab?: boolean;
  targetedTab?: string;
  onClick?: () => void;
  id?: string;
  className: string;
  children?: React.ReactNode;
}

const LinkButton: React.FC<LinkButtonProps> = ({
  href,
  newTab,
  targetedTab,
  onClick,
  forwardUrl,
  id,
  className,
  children,
}) => {
  let url = href;
  if (forwardUrl && id) {
    url =
      window.location.origin + formatUrl(forwardUrl, { patientUuid: id }, true);
  }
  const target = newTab ? '_blank' : targetedTab;
  const handleClick = () => {
    onClick?.();
  };

  return (
    <Link
      href={url}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      onClick={handleClick}
      className={className}
    >
      {children}
    </Link>
  );
};

export default LinkButton;
