import {useState} from 'react';
import type {Workbook} from '../../domain/workbook-v1.2';
import {displayMetricScore,metricAverage} from '../../domain/metric-scoring';
import './metric-comparison.css';

type Props={data:Workbook;lang:'en'|'th'};
export function MetricComparisonPage({data,lang}:Props){
 const t=(en:string,th:string)=>lang==='th'?th:en;
 const [periodId,setPeriodId]=useState('');
 const [metricSelection,setMetricSelection]=useState<string[]|null>(null);
 const [selected,setSelected]=useState<string[]|null>(null);
 const [reverse,setReverse]=useState(false),[showAverage,setShowAverage]=useState(true),[sort,setSort]=useState('name');
 const [metricQuery,setMetricQuery]=useState('');
 const periods=data.EvaluationPeriods;
 const chosenPeriod=periods.some(p=>p.id===periodId)?periodId:periods.find(p=>!['closed','completed','done','archived'].includes((p.status||'').toLowerCase()))?.id||periods[0]?.id||'';
 const period=periods.find(p=>p.id===chosenPeriod);
 const periodMetricIds=new Set((period?.metricIds||'').split(',').map(s=>s.trim()).filter(Boolean));
 const metrics=data.Metrics.filter(m=>periodMetricIds.has(m.id));
 const selectedIds=metricSelection===null?metrics.map(m=>m.id):metricSelection.filter(id=>periodMetricIds.has(id));
 const chosenMetrics=metrics.filter(m=>selectedIds.includes(m.id));
 const groups=chosenMetrics.map(m=>({metric:m,axes:data.MetricAxes.filter(a=>a.metricId===m.id&&a.active!=='false').sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0))}));
 const assignedIds=new Set(data.EmployeeMetrics.filter(a=>a.periodId===chosenPeriod&&selectedIds.includes(a.metricId)).map(a=>a.employeeId));
 const employees=data.Employees.filter(e=>assignedIds.has(e.id));
 const visible=employees.filter(e=>selected===null||selected.includes(e.id));
 const rows=visible.map(employee=>{
   const groupScores=groups.map(g=>{
     const assigned=data.EmployeeMetrics.some(a=>a.employeeId===employee.id&&a.metricId===g.metric.id&&a.periodId===chosenPeriod);
     const scores=g.axes.map(axis=>{const raw=assigned?data.Scores.find(s=>s.employeeId===employee.id&&s.axisId===axis.id&&s.periodId===chosenPeriod)?.value:undefined;return {value:displayMetricScore(raw,axis.max,reverse),max:Number(axis.max)};});
     return {scores,average:metricAverage(scores)};
   });
   const average=metricAverage(groupScores.flatMap(g=>g.scores));
   return {employee,groupScores,average};
 }).sort((a,b)=>sort==='name'?a.employee.name.localeCompare(b.employee.name):sort==='avg-desc'?(b.average??-1)-(a.average??-1):(a.average??-1)-(b.average??-1));
 const changePeriod=(id:string)=>{setPeriodId(id);setMetricSelection(null);setSelected(null);setMetricQuery('')};
 const toggleMetric=(id:string,checked:boolean)=>{setMetricSelection(checked?[...selectedIds,id]:selectedIds.filter(x=>x!==id));setSelected(null)};
 const filteredMetrics=metrics.filter(m=>m.name.toLowerCase().includes(metricQuery.toLowerCase()));
 return <div className="metric-compare-page">
 <section className="panel metric-compare-section"><div className="row"><div><h2>{t('Metric Comparison','เปรียบเทียบตัวชี้วัด')}</h2><p>{t('Select metrics and employees to compare scores.','เลือกตัวชี้วัดและพนักงานที่ต้องการเปรียบเทียบคะแนน')}</p></div><span className="metric-compare-readonly">{t('Read-only','ดูข้อมูลเท่านั้น')}</span></div>
 <div className="metric-compare-controls"><label>{t('Evaluation Period','รอบประเมิน')}<select aria-label="Comparison evaluation period" value={chosenPeriod} onChange={e=>changePeriod(e.target.value)}>{periods.map(p=><option key={p.id} value={p.id}>{p.name||p.id}</option>)}</select></label><label>{t('Sort','เรียงตาม')}<select aria-label="Comparison sort" value={sort} onChange={e=>setSort(e.target.value)}><option value="name">{t('Employee name','ชื่อพนักงาน')}</option><option value="avg-desc">{t('Average: high to low','เฉลี่ย: มากไปน้อย')}</option><option value="avg-asc">{t('Average: low to high','เฉลี่ย: น้อยไปมาก')}</option></select></label></div></section>
 <section className="panel metric-compare-section"><div className="row"><h3>{t('1. Select Metrics','1. เลือกตัวชี้วัด')} ({selectedIds.length}/{metrics.length})</h3><div className="metric-compare-actions"><button type="button" onClick={()=>{setMetricSelection(null);setSelected(null)}}>{t('Select all','เลือกทั้งหมด')}</button><button type="button" onClick={()=>{setMetricSelection([]);setSelected(null)}}>{t('Clear','ล้าง')}</button></div></div>
 <div className="metric-compare-search-wrap"><input className="metric-compare-search" type="search" aria-label="Search comparison metrics" placeholder={t('Search by metric name…','ค้นหาชื่อตัวชี้วัด…')} value={metricQuery} onChange={e=>setMetricQuery(e.target.value)}/>{metricQuery&&<button type="button" className="metric-compare-clear-search" onClick={()=>setMetricQuery('')}>{t('Clear search','ล้างคำค้น')}</button>}</div>
 <div className="metric-compare-metric-list">{filteredMetrics.map(m=><label key={m.id} title={m.name}><input type="checkbox" checked={selectedIds.includes(m.id)} onChange={e=>toggleMetric(m.id,e.target.checked)}/><span>{m.name}</span></label>)}</div>{filteredMetrics.length===0&&<p className="metric-compare-note">{t('No matching metrics.','ไม่พบตัวชี้วัดที่ตรงกับคำค้น')}</p>}
 </section>
 <section className="panel metric-compare-section"><div className="row"><h3>{t('2. Select Employees','2. เลือกพนักงาน')} ({visible.length}/{employees.length})</h3><label className="metric-compare-selectall"><input type="checkbox" checked={employees.length>0&&visible.length===employees.length} onChange={e=>setSelected(e.target.checked?null:[])}/>{t('Select All','เลือกทั้งหมด')}</label></div>
 <div className="metric-compare-checks">{employees.map(e=><label key={e.id}><input type="checkbox" checked={selected===null||selected.includes(e.id)} onChange={event=>{const current=selected===null?employees.map(x=>x.id):selected;setSelected(event.target.checked?[...current,e.id]:current.filter(id=>id!==e.id))}}/><span title={e.name}>{e.name}</span></label>)}</div></section>
 <section className="panel metric-compare-section"><div className="row"><h3>{t('3. Score Comparison','3. ตารางเปรียบเทียบคะแนน')}</h3><span className="metric-compare-readonly">{chosenMetrics.length} {t('metrics','ตัวชี้วัด')}</span></div>
 <div className="metric-compare-options"><label><input type="checkbox" checked={reverse} onChange={e=>setReverse(e.target.checked)}/>{t('Reverse Score (Lower is Better)','กลับทิศคะแนน (น้อยดีกว่า)')}</label><label><input type="checkbox" checked={showAverage} onChange={e=>setShowAverage(e.target.checked)}/>{t('Show Average (%)','แสดงค่าเฉลี่ย (%)')}</label></div>
 {!chosenPeriod?<p>{t('No evaluation periods available.','ยังไม่มีรอบการประเมิน')}</p>:!chosenMetrics.length?<p>{t('Select at least one metric.','เลือกตัวชี้วัดอย่างน้อยหนึ่งรายการ')}</p>:!employees.length?<p>{t('No employees assigned to the selected metrics.','ไม่มีพนักงานที่ได้รับมอบหมายตัวชี้วัดที่เลือก')}</p>:<div className="metric-compare-groups">{groups.map((group,index)=><section className="metric-compare-block" key={group.metric.id}><div className="metric-compare-block-heading"><h4 title={group.metric.name}>{group.metric.name}</h4><span>{group.axes.length} {t('sub metrics','หัวข้อย่อย')}</span></div><div className="metric-compare-scroll"><table><thead><tr><th className="metric-compare-name">{t('Employee','ชื่อ นามสกุล')}</th>{group.axes.map(axis=><th key={axis.id} className="metric-compare-axis" title={axis.name}><span>{axis.name}</span><small>Max {axis.max}</small></th>)}{showAverage&&<th className="metric-compare-average">{t('Average (%)','เฉลี่ย (%)')}</th>}</tr></thead><tbody>{rows.map(row=><tr key={row.employee.id}><th scope="row" className="metric-compare-name" title={row.employee.name}>{row.employee.name}</th>{row.groupScores[index].scores.map((s,j)=><td key={group.axes[j].id}>{s.value===null?'—':Number(s.value.toFixed(2))}</td>)}{showAverage&&<td className="metric-compare-average">{row.groupScores[index].average===null?'—':row.groupScores[index].average!.toFixed(1)+'%'}</td>}</tr>)}</tbody></table>{!rows.length&&<p>{t('Select employees to compare.','เลือกพนักงานที่ต้องการเปรียบเทียบ')}</p>}</div></section>)}</div>}
 <p className="metric-compare-note">{t('Sub metric headers wrap across lines. Reverse affects display only; missing scores are excluded from averages.','หัวข้อย่อยแสดงได้หลายบรรทัด Reverse เปลี่ยนเฉพาะการแสดงผล และไม่รวมคะแนนที่ขาดในการเฉลี่ย')}</p></section>
 </div>;
}
