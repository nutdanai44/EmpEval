import test from 'node:test';
import assert from 'node:assert/strict';
import { leaveMinutesInRange, summarizeLeave, validLeave } from '../src/domain/employee-leave.ts';
import { emptyWorkbook } from '../src/domain/schema-v1.2.ts';
import { validateWorkbook } from '../src/domain/workbook-v1.2.ts';

const leave = {
  id: 'leave-1', employeeId: 'employee-1', type: 'other', mode: 'full',
  startDate: '2025-12-31', endDate: '2026-01-03', dailyMinutes: '450'
};

test('counts only calendar dates from the start of this year through today', () => {
  const upcoming = { ...leave, startDate: '2026-01-03', endDate: '2026-01-03' };
  const summary = summarizeLeave([leave, upcoming], '2026-01-02');
  assert.equal(summary.total, 900);
  assert.equal(summary.byType.find(item => item.type === 'other').minutes, 900);
  assert.equal(leaveMinutesInRange(leave, leave.startDate, leave.endDate), 1800);
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
