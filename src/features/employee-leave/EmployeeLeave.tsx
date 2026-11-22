import { useState, type FormEvent } from 'react';
import { leaveMinutesInRange, leaveModes, leaveTypes, summarizeLeave, validLeave } from '../../domain/employee-leave';
import type { Row } from '../../domain/workbook-v1.2';
import './employee-leave.css';

type Translate = (en: string, th: string) => string;
type Props = {
  employeeId: string;
  rows: Row[];
  onChange: (rows: Row[]) => void;
  t: Translate;
};

function formatDuration(minutes: number, t: Translate) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  const parts = [];
  if (hours) parts.push(hours + t(' hr', ' ชม.'));
  if (remaining || !hours) parts.push(remaining + t(' min', ' นาที'));
  return parts.join(' ');
}

function localDate() {
  const today = new Date();
  return [today.getFullYear(), today.getMonth() + 1, today.getDate()]
    .map(value => String(value).padStart(2, '0')).join('-');
}

export function EmployeeLeave({ employeeId, rows, onChange, t }: Props) {
  const [draft, setDraft] = useState<Row | null>(null);
  const [error, setError] = useState('');
  const [month, setMonth] = useState('');
  const today = localDate();
  const employeeRows = rows.filter(row => row.employeeId === employeeId);
  const summary = summarizeLeave(employeeRows, today);
  const types: Record<string, string> = {
    vacation: t('Vacation', 'พักร้อน'),
    personal: t('Personal leave', 'ลากิจ'),
    sick: t('Sick leave', 'ลาป่วย'),
    other: t('Other leave', 'ลาอื่น ๆ')
  };
  const modes: Record<string, string> = {
    full: t('Full day', 'เต็มวัน'),
    morning: t('Morning', 'ครึ่งวันเช้า'),
    afternoon: t('Afternoon', 'ครึ่งวันบ่าย'),
    hourly: t('By time', 'รายชั่วโมง')
  };
  const records = employeeRows.filter(row => !month ||
    row.startDate.slice(0, 7) <= month && row.endDate.slice(0, 7) >= month)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  function edit(row: Row | null) {
    setDraft(row);
    setError('');
  }

  function setField(field: string, value: string) {
    setDraft(current => current && { ...current, [field]: value });
    setError('');
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const values = new FormData(event.currentTarget);
    const hourly = draft.mode === 'hourly';
    const row = {
      ...draft,
      id: draft.id || crypto.randomUUID(),
      endDate: hourly ? draft.startDate : draft.endDate || draft.startDate,
      dailyMinutes: hourly ? '' : String(Number(values.get('hours')) * 60 + Number(values.get('minutes'))),
      startTime: hourly ? draft.startTime : '',
      endTime: hourly ? draft.endTime : '',
      detail: draft.type === 'other' ? draft.detail.trim() : ''
    };
    if (!validLeave(row)) {
      setError(t('Check the dates and enter a positive leave duration.', 'ตรวจสอบวันที่และระบุระยะเวลาลามากกว่า 0 นาที'));
      return;
    }
    onChange(draft.id ? rows.map(item => item.id === row.id ? row : item) : [...rows, row]);
    edit(null);
  }

  return <section className="panel employee-leave" aria-label={t('Employee leave', 'วันลาพนักงาน')}>
    <div className="row">
      <div>
        <h3>{t('Leave used this year', 'ใช้วันลาปีนี้')} · {today.slice(0, 4)}</h3>
        <strong className="leave-total">{formatDuration(summary.total, t)}</strong>
      </div>
      <button type="button" disabled={!!draft} onClick={() => edit({
        employeeId, type: 'vacation', mode: 'full', startDate: today, endDate: '',
        startTime: '', endTime: '', dailyMinutes: '', detail: ''
      })}>{t('+ Add leave', '+ เพิ่มวันลา')}</button>
    </div>
    <dl className="leave-breakdown">
      {summary.byType.map(({ type, minutes }) => <div key={type}>
        <dt>{types[type]}</dt><dd>{formatDuration(minutes, t)}</dd>
      </div>)}
    </dl>
    {draft && <form className="leave-form" onSubmit={submit} key={draft.id || 'new'}>
      <h3>{draft.id ? t('Edit leave', 'แก้ไขวันลา') : t('Add leave', 'เพิ่มวันลา')}</h3>
      <div className="leave-fields">
        <label>{t('Leave type', 'ประเภทลา')}
          <select value={draft.type} onChange={event => setField('type', event.target.value)}>
            {leaveTypes.map(type => <option key={type} value={type}>{types[type]}</option>)}
          </select>
        </label>
        <label>{t('Duration type', 'ช่วงที่ลา')}
          <select value={draft.mode} onChange={event => setField('mode', event.target.value)}>
            {leaveModes.map(mode => <option key={mode} value={mode}>{modes[mode]}</option>)}
          </select>
        </label>
        <label>{draft.mode === 'hourly' ? t('Date', 'วันที่ลา') : t('First date', 'วันแรกที่ลา')}
          <input type="date" value={draft.startDate} required onChange={event => setField('startDate', event.target.value)}/>
        </label>
        {draft.mode === 'hourly' ? <>
          <label>{t('Start time', 'เวลาเริ่ม')}
            <input type="time" required value={draft.startTime} onChange={event => setField('startTime', event.target.value)}/>
          </label>
          <label>{t('End time', 'เวลาสิ้นสุด')}
            <input type="time" required value={draft.endTime} onChange={event => setField('endTime', event.target.value)}/>
          </label>
        </> : <>
          <label>{t('Last date (optional)', 'วันสุดท้ายที่ลา (ถ้ามี)')}
            <input type="date" min={draft.startDate} value={draft.endDate} onChange={event => setField('endDate', event.target.value)}/>
          </label>
          <label>{t('Hours per day', 'ชั่วโมงต่อวัน')}
            <input type="number" name="hours" min="0" max="24" defaultValue={Math.floor(Number(draft.dailyMinutes) / 60)}/>
          </label>
          <label>{t('Minutes per day', 'นาทีต่อวัน')}
            <input type="number" name="minutes" min="0" max="59" defaultValue={Number(draft.dailyMinutes) % 60}/>
          </label>
        </>}
      </div>
      {draft.mode !== 'hourly' && <small>{t('A date range counts every date in the range. Enter separate records if daily hours differ.', 'ช่วงวันที่ลานับทุกวันในช่วงนั้น หากชั่วโมงลาแต่ละวันต่างกัน ให้เพิ่มแยกเป็นรายวัน')}</small>}
      {draft.type === 'other' && <label>{t('Details (optional)', 'รายละเอียด (ถ้ามี)')}
        <input value={draft.detail} onChange={event => setField('detail', event.target.value)}/>
      </label>}
      {error && <p role="alert">{error}</p>}
      <div className="leave-actions">
        <button type="submit">{t('Done', 'เสร็จสิ้น')}</button>
        <button type="button" onClick={() => edit(null)}>{t('Cancel', 'ยกเลิก')}</button>
      </div>
    </form>}
    <div className="row leave-history">
      <h3>{t('Leave history', 'ประวัติวันลา')}</h3>
      <div className="leave-actions">
        <input aria-label={t('Filter leave by month', 'กรองวันลาตามเดือน')} type="month" value={month} onChange={event => setMonth(event.target.value)}/>
        {month && <button type="button" onClick={() => setMonth('')}>{t('All months', 'ทุกเดือน')}</button>}
      </div>
    </div>
    {records.length ? <div className="scroll"><table>
      <thead><tr>
        <th>{t('Date', 'วันที่')}</th><th>{t('Leave type', 'ประเภทลา')}</th>
        <th>{t('Duration', 'ระยะเวลาลา')}</th><th>{t('Actions', 'การดำเนินการ')}</th>
      </tr></thead>
      <tbody>{records.map(row => <tr key={row.id}>
        <td>{row.startDate}{row.startDate !== row.endDate && ' – ' + row.endDate}
          {row.endDate > today && <small className="leave-secondary">{t('Includes upcoming dates', 'มีวันลาล่วงหน้า')}</small>}
        </td>
        <td>{types[row.type]} · {modes[row.mode]}
          {row.type === 'other' && row.detail && <small className="leave-secondary">{row.detail}</small>}
        </td>
        <td>{formatDuration(leaveMinutesInRange(row, row.startDate, row.endDate), t)}
          {row.mode === 'hourly' && <small className="leave-secondary">{row.startTime}–{row.endTime}</small>}
        </td>
        <td><div className="leave-actions">
          <button type="button" disabled={!!draft} onClick={() => edit(row)}>{t('Edit', 'แก้ไข')}</button>
          <button type="button" disabled={!!draft} onClick={() => {
            if (window.confirm(t('Delete this leave record?', 'ลบรายการวันลานี้หรือไม่?'))) {
              onChange(rows.filter(item => item.id !== row.id));
            }
          }}>{t('Delete', 'ลบ')}</button>
        </div></td>
      </tr>)}</tbody>
    </table></div> : <p>{t('No leave records found.', 'ไม่พบรายการวันลา')}</p>}
  </section>;
}
