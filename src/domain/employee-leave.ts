export const leaveTypes = ['vacation', 'personal', 'sick', 'other'] as const;
export const leaveModes = ['full', 'morning', 'afternoon', 'hourly'] as const;

const dayMilliseconds = 86_400_000;

function isDate(value: string) {
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

export function leaveMinutesInRange(row: Record<string, string>, first: string, last: string) {
  if (!validLeave(row)) return 0;
  const start = row.startDate > first ? row.startDate : first;
  const end = row.endDate < last ? row.endDate : last;
  if (start > end) return 0;
  return (((Date.parse(end) - Date.parse(start)) / dayMilliseconds) + 1) * leaveMinutesPerDay(row);
}

export function summarizeLeave(rows: Record<string, string>[], today: string) {
  const start = today.slice(0, 4) + '-01-01';
  const byType = leaveTypes.map(type => ({
    type,
    minutes: rows.filter(row => row.type === type)
      .reduce((total, row) => total + leaveMinutesInRange(row, start, today), 0)
  }));
  return { byType, total: byType.reduce((total, entry) => total + entry.minutes, 0) };
}
