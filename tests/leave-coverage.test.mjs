import test from 'node:test';
import assert from 'node:assert/strict';
import { employeeLeaveTotals, leaveCoverageDays, monthlyStaffing } from '../src/domain/leave-coverage.ts';

const employees = [{ id: 'a' }, { id: 'b', active: 'true' }, { id: 'former', active: 'false' }];
const holidays = new Set(['2027-01-05']);

function leave(employeeId, startDate, endDate = startDate, fields = {}) {
  return { employeeId, startDate, endDate, mode: 'full', type: 'vacation', dailyMinutes: '480', ...fields };
}

test('counts distinct active employees by workday and flags full-day gaps', () => {
  const rows = [
    leave('a', '2027-01-01', '2027-01-05'),
    leave('a', '2027-01-04'),
    leave('b', '2027-01-04', '2027-01-05'),
    leave('former', '2027-01-01', '2027-01-05')
  ];
  const days = leaveCoverageDays(employees, rows, '2027', holidays);
  assert.deepEqual(days.map(day => day.date), ['2027-01-04']);
  assert.equal(days[0].noCoverage, true);
  assert.equal(days[0].availableAllDay, 0);
  assert.deepEqual(days[0].absences.map(person => person.employeeId), ['a', 'b']);
});

test('distinguishes a partial-day conflict from an all-day gap', () => {
  const date = '2027-01-04';
  const morning = leave('a', date, date, { mode: 'morning', dailyMinutes: '180' });
  const afternoon = leave('a', date, date, { mode: 'afternoon', dailyMinutes: '300' });
  const partial = leaveCoverageDays(employees, [morning, leave('b', date)], '2027', holidays)[0];
  assert.equal(partial.noCoverage, false);
  assert.equal(partial.partiallyAvailable, 1);
  assert.equal(partial.availableAllDay, 0);
  const full = leaveCoverageDays(employees, [morning, afternoon, leave('b', date)], '2027', holidays)[0];
  assert.equal(full.noCoverage, true);
  assert.equal(full.partiallyAvailable, 0);
});

test('includes unstaffed dates for a one-person team and no alerts for an empty active roster', () => {
  const rows = [leave('a', '2026-12-31', '2027-01-04'), leave('former', '2027-01-04')];
  const days = leaveCoverageDays([employees[0]], rows, '2027', holidays);
  assert.deepEqual(days.map(day => day.date), ['2027-01-01', '2027-01-04']);
  assert.ok(days.every(day => day.noCoverage));
  assert.deepEqual(leaveCoverageDays([employees[2]], rows, '2027', holidays), []);
});

test('calculates annual past and upcoming balances separately for each employee', () => {
  const rows = [
    leave('a', '2026-12-31', '2027-01-06'),
    leave('former', '2027-01-04', '2027-01-04', { mode: 'morning', dailyMinutes: '180' })
  ];
  const totals = employeeLeaveTotals(employees, rows, '2027', '2027-01-04', holidays);
  assert.deepEqual(totals.map(({ employee, used, planned }) => [employee.id, used, planned]), [
    ['a', 960, 480], ['b', 0, 0], ['former', 180, 0]
  ]);
});

test('monthly staffing reports the lowest full-day headcount even for one absence', () => {
  const staff = [...employees, { id: 'c', active: 'true' }];
  const rows = [
    leave('a', '2027-01-04', '2027-01-04', { mode: 'morning', dailyMinutes: '180' }),
    leave('b', '2027-01-05'),
    leave('c', '2027-01-05'),
    leave('b', '2027-02-06'),
    leave('former', '2027-02-08')
  ];
  const results = monthlyStaffing(staff, rows, '2027', holidays);
  assert.equal(results.length, 12);
  assert.deepEqual(results.slice(0, 3).map(entry => entry.minimum), [2, 3, 3]);
  assert.equal(monthlyStaffing([], rows, '2027', holidays)[0].minimum, null);
});

test('monthly staffing includes zero when all active people are on leave', () => {
  const rows = [leave('a', '2027-01-04'), leave('b', '2027-01-04')];
  assert.equal(monthlyStaffing(employees, rows, '2027', holidays)[0].minimum, 0);
});
