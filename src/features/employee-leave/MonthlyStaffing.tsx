import { monthlyStaffing } from '../../domain/leave-coverage';
import type { Row } from '../../domain/workbook-v1.2';
import type { LeaveTranslate } from './leave-display';
import './employee-leave.css';

type Props = {
  employees: Row[];
  rows: Row[];
  holidays: Row[];
  year: number;
  t: LeaveTranslate;
};

export function MonthlyStaffing({ employees, rows, holidays, year, t }: Props) {
  const locale = t('en-US', 'th-TH');
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  const yearText = String(year).padStart(4, '0');
  const months = monthlyStaffing(employees, rows, yearText, new Set(holidays.map(row => row.date)));

  return <section className="panel" aria-labelledby="dashboard-staffing-title">
    <h2 id="dashboard-staffing-title">{t('Staff available by month', 'คนที่เหลือทำงานรายเดือน')} · {year}</h2>
    <p>{t('Lowest full-day headcount on a workday. Yellow means fewer than 3 people.',
      'จำนวนคนที่ทำงานได้เต็มวันต่ำสุดในแต่ละเดือน สีเหลืองเมื่อเหลือน้อยกว่า 3 คน')}</p>
    <dl className="monthly-staffing">
      {months.map(({ month, minimum }) => {
        const low = minimum !== null && minimum < 3;
        const date = new Date(yearText + '-' + String(month + 1).padStart(2, '0') + '-01');
        return <div key={month} className={low ? 'monthly-staffing-low' : undefined}>
          <dt>{monthLabel.format(date)}</dt>
          <dd>{minimum ?? '—'}</dd>
        </div>;
      })}
    </dl>
  </section>;
}
