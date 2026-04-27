import { SelectableTag as CarbonSelectableTag } from '@carbon/react';
import { SelectableTagBaseProps } from '@carbon/react/es/components/Tag/SelectableTag';
import React from 'react';

export type SelectableTagProps = SelectableTagBaseProps & {
  testId?: string;
};

export const SelectableTag: React.FC<SelectableTagProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonSelectableTag {...carbonProps} data-testid={testId} />;
};
