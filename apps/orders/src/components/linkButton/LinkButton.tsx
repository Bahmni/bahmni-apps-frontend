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
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = newTab ? '_blank' : (targetedTab ?? '_self');
    window.open(url, target);
    onClick?.();
  };

  return (
    <Link onClick={handleClick} className={className} role={'link'}>
      {children}
    </Link>
  );
};

export default LinkButton;
