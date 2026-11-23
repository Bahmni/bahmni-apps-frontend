import { FhirExportTask } from '@bahmni/services';
import { hasPendingTasks } from '../useFhirExportTasks';

const task = (status: FhirExportTask['status']): FhirExportTask => ({
  id: status,
  userName: 'superman',
  triggeredDate: '',
  startDate: '',
  endDate: '',
  anonymised: true,
  status,
});

describe('hasPendingTasks', () => {
  it('is false when there are no tasks', () => {
    expect(hasPendingTasks(undefined)).toBe(false);
    expect(hasPendingTasks([])).toBe(false);
  });

  it('is false when every task reached a final status', () => {
    expect(
      hasPendingTasks([
        task('completed'),
        task('failed'),
        task('rejected'),
        task('cancelled'),
      ]),
    ).toBe(false);
  });

  it.each(['requested', 'accepted', 'in-progress'] as const)(
    'is true while a task is %s',
    (status) => {
      expect(hasPendingTasks([task('completed'), task(status)])).toBe(true);
    },
  );
});
