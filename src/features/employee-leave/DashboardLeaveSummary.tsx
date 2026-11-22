import { summarizeLeave } from '../../domain/employee-leave';
import type { Row } from '../../domain/workbook-v1.2';
import { LeaveSummaryChart } from './LeaveSummaryChart';
import { formatLeaveDays, leaveTypeLabels, localDate, type LeaveTranslate } from './leave-display';

type Props = {
  rows: Row[];
  holidays: Row[];
  year: number;
  t: LeaveTranslate;
};

export function DashboardLeaveSummary({ rows, holidays, year, t }: Props) {
  const dates = new Set(holidays.map(row => row.date));
  const summary = summarizeLeave(rows, localDate(), dates, String(year).padStart(4, '0'));
  const totals = [
    { label: t('Total leave', 'วันลารวม'), minutes: summary.total + summary.plannedTotal },
    { label: t('Leave used', 'ลาแล้ว'), minutes: summary.total },
    { label: t('Upcoming leave', 'ลาล่วงหน้า'), minutes: summary.plannedTotal }
  ];

  return <section className="panel employee-leave" aria-label={t('Team leave summary', 'สรุปวันลารวมของทีม')}>
    <h2>{t('Team leave summary', 'สรุปวันลารวมของทีม')} · {year}</h2>
    <dl className="leave-breakdown">
      {totals.map(({ label, minutes }) => <div key={label}>
        <dt>{label}</dt><dd>{formatLeaveDays(minutes, t)}</dd>
      </div>)}
    </dl>
    <LeaveSummaryChart months={summary.months} types={leaveTypeLabels(t)} t={t}/>
  </section>;
}
