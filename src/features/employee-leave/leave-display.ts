import { leaveDayMinutes } from '../../domain/employee-leave';

export type LeaveTranslate = (en: string, th: string) => string;

export function localDate() {
  const today = new Date();
  return [today.getFullYear(), today.getMonth() + 1, today.getDate()]
    .map(value => String(value).padStart(2, '0')).join('-');
}

export function formatLeaveDays(minutes: number, t: LeaveTranslate) {
  const days = new Intl.NumberFormat(t('en-US', 'th-TH'), { maximumFractionDigits: 3 });
  return days.format(minutes / leaveDayMinutes) + t(minutes === leaveDayMinutes ? ' day' : ' days', ' วัน');
}

export function leaveTypeLabels(t: LeaveTranslate): Record<string, string> {
  return {
    vacation: t('Vacation', 'พักร้อน'),
    personal: t('Personal leave', 'ลากิจ'),
    sick: t('Sick leave', 'ลาป่วย'),
    other: t('Other leave', 'ลาอื่น ๆ')
  };
}
