import test from 'node:test';
import assert from 'node:assert/strict';
import { leaveMinutesInRange, summarizeLeave, validLeave } from '../src/domain/employee-leave.ts';
import { emptyWorkbook } from '../src/domain/schema-v1.2.ts';
import { validateWorkbook } from '../src/domain/workbook-v1.2.ts';

const leave = {
  id: 'leave-1', employeeId: 'employee-1', type: 'other', mode: 'full',
  startDate: '2025-12-31', endDate: '2026-01-03', dailyMinutes: '450'
};

test('counts only workdays from the start of this year through today', () => {
  const upcoming = { ...leave, startDate: '2026-01-03', endDate: '2026-01-03' };
  const summary = summarizeLeave([leave, upcoming], '2026-01-02');
  assert.equal(summary.total, 900);
  assert.equal(summary.byType.find(item => item.type === 'other').minutes, 900);
  assert.equal(leaveMinutesInRange(leave, leave.startDate, leave.endDate), 1350);
});

test('uses actual morning and afternoon durations and calculates hourly leave', () => {
  const oneDay = { ...leave, startDate: '2026-01-02', endDate: '2026-01-02' };
  const morning = { ...oneDay, type: 'vacation', mode: 'morning', dailyMinutes: '180' };
  const afternoon = { ...oneDay, type: 'personal', mode: 'afternoon', dailyMinutes: '300' };
  const hourly = { ...oneDay, type: 'sick', mode: 'hourly', startTime: '14:00', endTime: '15:30' };
  const summary = summarizeLeave([morning, afternoon, hourly], '2026-01-02');
  assert.deepEqual(summary.byType.map(entry => entry.minutes), [180, 300, 90, 0]);
  assert.equal(summary.total, 570);
});

test('rejects invalid dates, duration, modes and employee references', () => {
  assert.equal(validLeave({ ...leave, startDate: '2025-11-31' }), false);
  assert.equal(validLeave({ ...leave, endDate: '2025-12-30' }), false);
  assert.equal(validLeave({ ...leave, dailyMinutes: '0' }), false);
  assert.equal(validLeave({ ...leave, type: 'unknown' }), false);
  assert.equal(validLeave({ ...leave, mode: 'hourly', startTime: '14:00', endTime: '15:30' }), false);
  assert.equal(validLeave({ ...leave, endDate: leave.startDate, mode: 'hourly', startTime: '15:30', endTime: '14:00' }), false);
  const workbook = emptyWorkbook();
  workbook.EmployeeLeaves = [leave];
  assert.match(validateWorkbook(workbook).join('\n'), /invalid employeeId/);
  workbook.Employees = [{ id: leave.employeeId }];
  assert.deepEqual(validateWorkbook(workbook), []);
});

test('Friday to Monday excludes weekends and company holidays only once', () => {
  const range = { ...leave, startDate: '2026-01-30', endDate: '2026-02-02', dailyMinutes: '480' };
  assert.equal(leaveMinutesInRange(range, range.startDate, range.endDate), 960);
  const holidays = new Set(['2026-01-31', '2026-02-02']);
  assert.equal(leaveMinutesInRange(range, range.startDate, range.endDate, holidays), 480);
  const hourly = { ...range, mode: 'hourly', startDate: range.endDate, startTime: '09:00', endTime: '10:00' };
  assert.equal(leaveMinutesInRange(hourly, range.startDate, range.endDate, holidays), 0);
});

test('allocates leave to the month it falls in and retains the leave type', () => {
  const range = { ...leave, startDate: '2026-01-30', endDate: '2026-02-03', dailyMinutes: '480' };
  const sick = { ...range, type: 'sick', startDate: '2026-02-02', endDate: '2026-02-02', dailyMinutes: '120' };
  const summary = summarizeLeave([range, sick], '2026-02-02');
  assert.equal(summary.months.length, 12);
  assert.deepEqual(summary.months[0].byType.map(item => item.minutes), [0, 0, 0, 480]);
  assert.deepEqual(summary.months[1].byType.map(item => item.minutes), [0, 0, 120, 480]);
  assert.equal(summary.total, 1080);
  assert.equal(summarizeLeave([range, sick], '2026-02-02', new Set(['2026-02-02'])).total, 480);
});

test('validates calendar dates and refuses duplicate company holidays', () => {
  const workbook = emptyWorkbook();
  workbook.CompanyHolidays = [{ id: 'holiday-1', date: '2026-02-02', name: 'Company holiday' }];
  assert.deepEqual(validateWorkbook(workbook), []);
  workbook.CompanyHolidays.push({ id: 'holiday-2', date: '2026-02-02', name: 'Duplicate holiday' });
  workbook.CompanyHolidays.push({ id: 'holiday-3', date: '2026-02-30', name: 'Invalid holiday' });
  assert.match(validateWorkbook(workbook).join(' '), /CompanyHolidays: duplicate key/);
  assert.match(validateWorkbook(workbook).join(' '), /CompanyHolidays row 4: invalid holiday/);
});
