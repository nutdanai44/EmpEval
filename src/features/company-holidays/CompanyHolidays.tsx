import { useState, type FormEvent } from 'react';
import type { Row } from '../../domain/workbook-v1.2';
import { isDate } from '../../domain/employee-leave';

type Props = {
  rows: Row[];
  onChange: (rows: Row[]) => void;
  t: (en: string, th: string) => string;
};

export function CompanyHolidays({ rows, onChange, t }: Props) {
  const currentYear = String(new Date().getFullYear());
  const [year, setYear] = useState(currentYear);
  const years = [...new Set([currentYear, year, ...rows.filter(row => isDate(row.date)).map(row => row.date.slice(0, 4))])]
    .sort((a, b) => b.localeCompare(a));
  const holidays = rows.filter(row => row.date?.startsWith(year + '-'))
    .sort((a, b) => a.date.localeCompare(b.date));
  const [draft, setDraft] = useState<Row | null>(null);
  const [error, setError] = useState('');

  function edit(row: Row | null) {
    setDraft(row);
    setError('');
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const fields = new FormData(event.currentTarget);
    const date = String(fields.get('date') || '');
    const name = String(fields.get('name') || '').trim();
    if (!isDate(date) || !name) {
      setError(t('Enter a date and holiday name.', 'ระบุวันที่และชื่อวันหยุด'));
      return;
    }
    if (rows.some(row => row.date === date && row.id !== draft.id)) {
      setError(t('A holiday already exists on this date.', 'มีวันหยุดในวันที่นี้แล้ว'));
      return;
    }
    const holiday = { id: draft.id || crypto.randomUUID(), date, name };
    onChange(draft.id ? rows.map(row => row.id === holiday.id ? holiday : row) : [...rows, holiday]);
    setYear(date.slice(0, 4));
    edit(null);
  }

  return <section className="panel employee-leave" aria-label={t('Holiday calendar', 'ปฏิทินวันหยุด')}>
    <div className="row">
      <h2>{t('Company holiday calendar', 'ปฏิทินวันหยุดบริษัท')}</h2>
      <div className="leave-actions">
        <label>{t('Holiday year', 'ปีของวันหยุด')}{' '}
          <select value={year} disabled={!!draft} onChange={event => setYear(event.target.value)}>
            {years.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button type="button" disabled={!!draft} onClick={() => edit({ id: '', date: '', name: '' })}>
          {t('+ Add holiday', '+ เพิ่มวันหยุด')}
        </button>
      </div>
    </div>
    {draft && <form className="leave-form" onSubmit={submit} key={draft.id || 'new'}>
      <div className="leave-fields">
        <label>{t('Holiday date', 'วันที่หยุด')}
          <input name="date" type="date" defaultValue={draft.date} required />
        </label>
        <label>{t('Holiday name', 'ชื่อวันหยุด')}
          <input name="name" defaultValue={draft.name} required />
        </label>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="leave-actions">
        <button type="submit">{t('Done', 'เสร็จสิ้น')}</button>
        <button type="button" onClick={() => edit(null)}>{t('Cancel', 'ยกเลิก')}</button>
      </div>
    </form>}
    {holidays.length ? <div className="scroll"><table>
      <thead><tr><th>{t('Date', 'วันที่')}</th><th>{t('Holiday name', 'ชื่อวันหยุด')}</th><th>{t('Actions', 'การดำเนินการ')}</th></tr></thead>
      <tbody>{holidays.map(row => <tr key={row.id}>
        <td>{row.date}</td><td>{row.name}</td>
        <td><div className="leave-actions">
          <button type="button" disabled={!!draft} onClick={() => edit(row)}>{t('Edit', 'แก้ไข')}</button>
          <button type="button" disabled={!!draft} onClick={() => {
            if (window.confirm(t('Delete this holiday?', 'ลบวันหยุดนี้หรือไม่?'))) {
              onChange(rows.filter(holiday => holiday.id !== row.id));
            }
          }}>{t('Delete', 'ลบ')}</button>
        </div></td>
      </tr>)}</tbody>
    </table></div> : <p>{t('No company holidays in this year.', 'ยังไม่มีวันหยุดบริษัทในปีนี้')}</p>}
  </section>;
}
