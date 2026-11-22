import { useState } from 'react';
import { leaveCoverageDays } from '../../domain/leave-coverage';
import type { Row } from '../../domain/workbook-v1.2';
import type { LeaveTranslate } from './leave-display';

type Props = {
  employees: Row[];
  rows: Row[];
  holidays: ReadonlySet<string>;
  year: string;
  today: string;
  onOpenEmployee: (id: string) => void;
  t: LeaveTranslate;
};

export function LeaveCoverage({ employees, rows, holidays, year, today, onOpenEmployee, t }: Props) {
  const [onlyUnstaffed, setOnlyUnstaffed] = useState(false);
  const [month, setMonth] = useState('all');
  const people = new Map(employees.map(employee => [employee.id, employee.name || employee.employeeCode || employee.id]));
  const months = new Intl.DateTimeFormat(t('en-US', 'th-TH'), { month: 'long', timeZone: 'UTC' });
  const dates = new Intl.DateTimeFormat(t('en-US', 'th-TH'), {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'
  });
  const days = leaveCoverageDays(employees, rows, year, holidays)
    .filter(day => (month === 'all' || day.date.slice(5, 7) === month) && (!onlyUnstaffed || day.noCoverage))
    .sort((a, b) => {
      const pastA = a.date < today;
      const pastB = b.date < today;
      if (pastA !== pastB) return Number(pastA) - Number(pastB);
      return pastA ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    });

  const periods: Record<string, string> = {
    morning: t('Morning', 'ช่วงเช้า'),
    afternoon: t('Afternoon', 'ช่วงบ่าย'),
    full: t('Full day', 'เต็มวัน')
  };

  return <section className="leave-planning" aria-label={t('Leave conflicts', 'วันลาซ้อนและวันที่ไม่มีคนทำงาน')}>
    <div className="row">
      <h3>{t('Leave conflicts', 'วันลาซ้อนและวันที่ไม่มีคนทำงาน')}</h3>
      <div className="leave-actions">
        <label>{t('Conflict month', 'เดือนที่ต้องการดู')}{' '}
          <select value={month} onChange={event => setMonth(event.target.value)}>
            <option value="all">{t('All months', 'ทุกเดือน')}</option>
            {Array.from({ length: 12 }, (_, index) => {
              const value = String(index + 1).padStart(2, '0');
              return <option key={value} value={value}>{months.format(new Date(year + '-' + value + '-01'))}</option>;
            })}
          </select>
        </label>
        <label><input type="checkbox" checked={onlyUnstaffed} onChange={event => setOnlyUnstaffed(event.target.checked)}/>
          {t(' Only days with no coverage', ' เฉพาะวันที่ไม่มีคนทำงานทั้งวัน')}
        </label>
      </div>
    </div>
    {days.length ? <div className="scroll"><table>
      <thead><tr>
        <th>{t('Date', 'วันที่')}</th><th>{t('People on leave', 'คนที่ลา')}</th><th>{t('Staff available', 'คนที่เหลือทำงาน')}</th>
      </tr></thead>
      <tbody>{days.map(day => <tr key={day.date}>
        <td><time dateTime={day.date}>{dates.format(new Date(day.date))}</time>
          {day.date >= today && <small className="leave-secondary">{day.date === today ? t('Today', 'วันนี้') : t('Upcoming', 'ล่วงหน้า')}</small>}
        </td>
        <td><div className="leave-people">{day.absences.map(absence => {
          const slots = absence.fullDay ? periods.full : [...new Set(absence.entries.map(row => (
            row.mode === 'hourly' ? row.startTime + '–' + row.endTime : periods[row.mode]
          )))].join(', ');
          return <span key={absence.employeeId}><button type="button" className="leave-person-link"
            onClick={() => onOpenEmployee(absence.employeeId)}>{people.get(absence.employeeId)}</button>{' · ' + slots}</span>;
        })}</div></td>
        <td>{day.noCoverage ? <strong className="leave-no-coverage">{t('No one available all day', 'ไม่มีคนทำงานทั้งวัน')}</strong> : <>
          <strong>{t('Available all day', 'ทำงานได้เต็มวัน')} {day.availableAllDay}</strong>
          {!!day.partiallyAvailable && <small className="leave-secondary">
            {t('On partial leave', 'ลาบางช่วง')} {day.partiallyAvailable}
          </small>}
        </>}</td>
      </tr>)}</tbody>
    </table></div> : <p>{t('No leave conflicts found for this selection.', 'ไม่พบวันลาซ้อนหรือวันที่ไม่มีคนทำงานในช่วงที่เลือก')}</p>}
    <small>{t('Coverage uses active employees and recorded leave on company workdays.', 'คำนวณจากพนักงานที่ยังทำงานอยู่และรายการลาที่บันทึกในวันทำงานของบริษัท')}</small>
  </section>;
}
