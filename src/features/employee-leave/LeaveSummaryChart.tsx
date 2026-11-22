import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { leaveDayMinutes, leaveTypes, type summarizeLeave } from '../../domain/employee-leave';

type Props = {
  months: ReturnType<typeof summarizeLeave>['months'];
  types: Record<string, string>;
  t: (en: string, th: string) => string;
};

const colors = ['#3b61d1', '#087e82', '#ad507b', '#ae6b23'];

export function LeaveSummaryChart({ months, types, t }: Props) {
  const locale = t('en-US', 'th-TH');
  const monthFormat = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  const days = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format;
  const unit = t('days', 'วัน');
  const data = months.map(({ month, byType }) => ({
    month: monthFormat.format(new Date(month)),
    ...Object.fromEntries(byType.map(({ type, minutes }) => [type, minutes / leaveDayMinutes]))
  }));

  return <section className="leave-monthly-summary" aria-label={t('Monthly leave summary', 'สรุปวันลารายเดือน')}>
    <h3>{t('Monthly leave by type', 'วันลารายเดือนแยกตามประเภท')}</h3>
    <small>{t('8 hours = 1 day', '8 ชั่วโมง = 1 วัน')}</small>
    <div className="scroll">
      <div className="leave-chart">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
            <XAxis dataKey="month" interval={0} fontSize={12}/>
            <YAxis width={55} unit={' ' + unit} fontSize={12} tickFormatter={days}/>
            <Tooltip formatter={value => days(Number(value)) + ' ' + unit}
              labelFormatter={(label, payload) => {
                const total = payload.reduce((sum, item) => sum + Number(item.value || 0), 0);
                return label + ' · ' + t('Total', 'รวม') + ' ' + days(total) + ' ' + unit;
              }}/>
            <Legend wrapperStyle={{ fontSize: 12 }}/>
            {leaveTypes.map((type, index) => <Bar key={type} dataKey={type} name={types[type]}
              stackId="leave" fill={colors[index]} isAnimationActive={false}/>)}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </section>;
}
