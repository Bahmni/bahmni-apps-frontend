import { registerSearchWidget } from '../registry';
import SearchPatient from './SearchPatient';

registerSearchWidget({
  key: 'defaultSearch',
  component: SearchPatient,
});

export { default as SearchPatient } from './SearchPatient';
export type { PatientSearchViewModel } from './utils';
