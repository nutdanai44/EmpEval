import { useState } from 'react';
import { employeeLeaveTotals } from '../../domain/leave-coverage';
import { LeaveCoverage } from './LeaveCoverage';
import { summarizeLeave } from '../../domain/employee-leave';
import type { Row } from '../../domain/workbook-v1.2';
import { LeaveSummaryChart } from './LeaveSummaryChart';
import { formatLeaveDays, leaveTypeLabels, localDate, type LeaveTranslate } from './leave-display';

type Props = {
  employees: Row[];
  rows: Row[];
  holidays: Row[];
  year: number;
  onOpenEmployee: (id: string) => void;
  t: LeaveTranslate;
};

export function DashboardLeaveSummary({ employees, rows, holidays, year, onOpenEmployee, t }: Props) {
  const dates = new Set(holidays.map(row => row.date));
  const [team, setTeam] = useState('');
  const teams = [...new Set(employees.map(employee => employee.team).filter(Boolean))].sort();
  const scope = teams.includes(team) ? team : '';
  const people = employees.filter(employee => !scope || employee.team === scope);
  const ids = new Set(people.map(employee => employee.id));
  const leaveRows = rows.filter(row => ids.has(row.employeeId));
  const today = localDate();
  const yearText = String(year).padStart(4, '0');
  const summary = summarizeLeave(leaveRows, today, dates, yearText);
  const perEmployee = employeeLeaveTotals(people, leaveRows, yearText, today, dates)
    .sort((a, b) => b.used - a.used || b.planned - a.planned ||
      (a.employee.name || '').localeCompare(b.employee.name || ''));
  const totals = [
    { label: t('Total leave', 'วันลารวม'), minutes: summary.total + summary.plannedTotal },
    { label: t('Leave used', 'ลาแล้ว'), minutes: summary.total },
    { label: t('Upcoming leave', 'ลาล่วงหน้า'), minutes: summary.plannedTotal }
  ];

  return <section className="panel employee-leave" aria-label={t('Team leave summary', 'สรุปวันลารวมของทีม')}>
    <div className="row">
      <h2>{t('Team leave summary', 'สรุปวันลารวมของทีม')} · {year}</h2>
      <label>{t('Leave team', 'ทีม')}{' '}
        <select value={scope} onChange={event => setTeam(event.target.value)}>
          <option value="">{t('All teams', 'ทุกทีม')}</option>
          {teams.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
    </div>
    <dl className="leave-breakdown">
      {totals.map(({ label, minutes }) => <div key={label}>
        <dt>{label}</dt><dd>{formatLeaveDays(minutes, t)}</dd>
      </div>)}
    </dl>
    <LeaveCoverage employees={people} rows={leaveRows} holidays={dates} year={yearText} today={today}
      onOpenEmployee={onOpenEmployee} t={t}/>
    <section className="leave-planning" aria-label={t('Leave by employee', 'สรุปวันลารายคน')}>
      <h3>{t('Leave by employee', 'สรุปวันลารายคน')}</h3>
      {perEmployee.length ? <div className="scroll"><table>
        <thead><tr>
          <th>{t('Employee', 'พนักงาน')}</th><th>{t('Leave used', 'ลาแล้ว')}</th>
          <th>{t('Upcoming leave', 'ลาล่วงหน้า')}</th><th>{t('Total leave', 'วันลารวม')}</th>
        </tr></thead>
        <tbody>{perEmployee.map(({ employee, used, planned }) => <tr key={employee.id}>
          <th scope="row"><button type="button" className="leave-person-link" onClick={() => onOpenEmployee(employee.id)}>
            {employee.name || employee.employeeCode || employee.id}
          </button>{employee.active === 'false' && <small className="leave-secondary">{t('Inactive', 'พนักงานไม่อยู่ในสถานะทำงาน')}</small>}</th>
          <td>{formatLeaveDays(used, t)}</td><td>{formatLeaveDays(planned, t)}</td><td>{formatLeaveDays(used + planned, t)}</td>
        </tr>)}</tbody>
      </table></div> : <p>{t('No employees found.', 'ไม่พบพนักงาน')}</p>}
    </section>
    <LeaveSummaryChart months={summary.months} types={leaveTypeLabels(t)} t={t}/>
  </section>;
}
