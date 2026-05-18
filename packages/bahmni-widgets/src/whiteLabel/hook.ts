import { createConfigHook } from '../configProvider';
import { WhiteLabelContext } from './context';
import { type WhiteLabelContextType } from './models';

export const useWhiteLabel = createConfigHook<WhiteLabelContextType>(
  WhiteLabelContext,
  'useWhiteLabel',
  'WhiteLabelProvider',
);
