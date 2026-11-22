import { leaveMinutesInRange, validLeave } from './employee-leave.ts';
import type { Row } from './workbook-v1.2.ts';

export function employeeLeaveTotals(
  employees: Row[], rows: Row[], year: string, today: string, holidays: ReadonlySet<string>
) {
  const start = year + '-01-01';
  const end = year + '-12-31';
  const usedThrough = today < end ? today : end;
  return employees.map(employee => {
    let total = 0;
    let used = 0;
    for (const row of rows) {
      if (row.employeeId !== employee.id) continue;
      total += leaveMinutesInRange(row, start, end, holidays);
      used += leaveMinutesInRange(row, start, usedThrough, holidays);
    }
    return { employee, used, planned: total - used };
  });
}

export function leaveCoverageDays(employees: Row[], rows: Row[], year: string, holidays: ReadonlySet<string>) {
  const activeIds = new Set(employees.filter(employee => employee.active !== 'false').map(employee => employee.id));
  const first = year + '-01-01';
  const last = year + '-12-31';
  const leaveByDate = new Map<string, Map<string, Row[]>>();
  for (const row of rows) {
    if (!activeIds.has(row.employeeId) || !validLeave(row)) continue;
    const start = row.startDate > first ? row.startDate : first;
    const end = row.endDate < last ? row.endDate : last;
    for (const day = new Date(start); day <= new Date(end); day.setUTCDate(day.getUTCDate() + 1)) {
      const date = day.toISOString().slice(0, 10);
      if (day.getUTCDay() === 0 || day.getUTCDay() === 6 || holidays.has(date)) continue;
      const byEmployee = leaveByDate.get(date) ?? new Map<string, Row[]>();
      const entries = byEmployee.get(row.employeeId) ?? [];
      entries.push(row);
      byEmployee.set(row.employeeId, entries);
      leaveByDate.set(date, byEmployee);
    }
  }

  return Array.from(leaveByDate, ([date, byEmployee]) => {
    const absences = Array.from(byEmployee, ([employeeId, entries]) => {
      const modes = new Set(entries.map(row => row.mode));
      const fullDay = modes.has('full') || (modes.has('morning') && modes.has('afternoon'));
      return { employeeId, entries, fullDay };
    });
    const fullDayCount = absences.filter(absence => absence.fullDay).length;

    return {
      date,
      absences,
      noCoverage: fullDayCount === activeIds.size,
      availableAllDay: activeIds.size - absences.length,
      partiallyAvailable: absences.length - fullDayCount
    };
  }).filter(day => day.noCoverage || day.absences.length > 1);
}
