export const leaveTypes = ['vacation', 'personal', 'sick', 'other'] as const;
export const leaveModes = ['full', 'morning', 'afternoon', 'hourly'] as const;

export const leaveDayMinutes = 8 * 60;
const dayMilliseconds = 86_400_000;

export function isDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function timeMinutes(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return NaN;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function leaveMinutesPerDay(row: Record<string, string>) {
  return row.mode === 'hourly'
    ? timeMinutes(row.endTime) - timeMinutes(row.startTime)
    : Number(row.dailyMinutes);
}

export function validLeave(row: Record<string, string>) {
  const minutes = leaveMinutesPerDay(row);
  return leaveTypes.some(type => type === row.type) &&
    leaveModes.some(mode => mode === row.mode) &&
    isDate(row.startDate) && isDate(row.endDate) && row.startDate <= row.endDate &&
    (row.mode !== 'hourly' || row.startDate === row.endDate) &&
    Number.isInteger(minutes) && minutes > 0 && minutes <= 1440;
}

function isWeekday(weekday: number) {
  return weekday > 0 && weekday < 6;
}

function workdaysInRange(start: string, end: string, holidays: ReadonlySet<string>) {
  const firstDate = new Date(start);
  const days = (Date.parse(end) - firstDate.getTime()) / dayMilliseconds + 1;
  const firstWeekday = firstDate.getUTCDay();
  let workdays = Math.floor(days / 7) * 5;
  for (let offset = 0; offset < days % 7; offset++) {
    if (isWeekday((firstWeekday + offset) % 7)) workdays++;
  }
  for (const date of holidays) {
    if (date >= start && date <= end && isWeekday(new Date(date).getUTCDay())) workdays--;
  }
  return workdays;
}

export function leaveMinutesInRange(
  row: Record<string, string>, first: string, last: string, holidays: ReadonlySet<string> = new Set()
) {
  if (!validLeave(row)) return 0;
  const start = row.startDate > first ? row.startDate : first;
  const end = row.endDate < last ? row.endDate : last;
  if (start > end) return 0;
  return workdaysInRange(start, end, holidays) * leaveMinutesPerDay(row);
}

export function leaveYears(rows: Record<string, string>[]) {
  const years = new Set<number>();
  for (const row of rows) {
    if (!validLeave(row)) continue;
    const first = Number(row.startDate.slice(0, 4));
    const last = Number(row.endDate.slice(0, 4));
    for (let year = first; year <= last; year++) years.add(year);
  }
  return [...years];
}

export function summarizeLeave(
  rows: Record<string, string>[], today: string, holidays: ReadonlySet<string> = new Set(),
  year = today.slice(0, 4)
) {
  const months = Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, '0');
    const start = year + '-' + month + '-01';
    const nextMonth = new Date(start);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1, 0);
    const monthEnd = nextMonth.toISOString().slice(0, 10);
    const byType = leaveTypes.map(type => {
      let minutes = 0;
      let used = 0;
      for (const row of rows) {
        if (row.type !== type) continue;
        minutes += leaveMinutesInRange(row, start, monthEnd, holidays);
        used += leaveMinutesInRange(row, start, monthEnd < today ? monthEnd : today, holidays);
      }
      return { type, minutes, used };
    });
    return { month: start, byType };
  });
  const byType = leaveTypes.map((type, index) => {
    const minutes = months.reduce((total, month) => total + month.byType[index].used, 0);
    const allMinutes = months.reduce((total, month) => total + month.byType[index].minutes, 0);
    return { type, minutes, planned: allMinutes - minutes };
  });
  return {
    months,
    byType,
    total: byType.reduce((total, entry) => total + entry.minutes, 0),
    plannedTotal: byType.reduce((total, entry) => total + entry.planned, 0)
  };
}
