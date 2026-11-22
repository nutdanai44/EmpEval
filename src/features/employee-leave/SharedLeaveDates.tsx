import { allStaffLeaveDays } from '../../domain/leave-coverage';
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

export function SharedLeaveDates({ employees, rows, holidays, year, t }: Props) {
  const dates = new Intl.DateTimeFormat(t('en-US', 'th-TH'), {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'
  });
  const days = allStaffLeaveDays(employees, rows, String(year).padStart(4, '0'), new Set(holidays.map(row => row.date)));

  return <section className="panel" aria-labelledby="dashboard-shared-leave-title">
    <h2 id="dashboard-shared-leave-title">{t('Dates everyone is on leave', 'วันที่พนักงานทุกคนลาตรงกัน')} · {year}</h2>
    {days.length ? <div className="scroll"><table>
      <thead><tr><th>{t('Date', 'วันที่')}</th><th>{t('Staff available', 'คนที่เหลือทำงาน')}</th></tr></thead>
      <tbody>{days.map(({ date, remaining }) => <tr key={date} className={remaining < 3 ? 'shared-leave-low' : undefined}>
        <td><time dateTime={date}>{dates.format(new Date(date))}</time></td>
        <td>{remaining === 0 ? t('No one available all day', 'ไม่มีคนทำงานทั้งวัน')
          : t('Available for part of the day', 'ทำงานได้บางช่วง') + ' · ' + remaining + t(' people', ' คน')}</td>
      </tr>)}</tbody>
    </table></div> : <p>{t('No workdays when everyone is on leave.', 'ไม่มีวันทำงานที่พนักงานทุกคนลาตรงกัน')}</p>}
  </section>;
}
