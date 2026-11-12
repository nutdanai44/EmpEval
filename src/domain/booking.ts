/** Shared booking calculations. All dates are inclusive, UTC calendar dates. */
type Row=Record<string,string>;
const validDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const workdays=(start:Date,end:Date)=>{const days:Date[]=[];for(let d=new Date(start);d<=end;d.setUTCDate(d.getUTCDate()+1)){if(d.getUTCDay()!==0&&d.getUTCDay()!==6)days.push(new Date(d));}return days};
const activeRows=(bookings:Row[],employeeId:string)=>bookings.filter(b=>b.employeeId===employeeId&&validDate(b.start||'')&&validDate(b.end||b.start||'')&&(b.end||b.start)>=b.start&&b.allocation!==''&&Number.isFinite(Number(b.allocation))&&Number(b.allocation)>=0&&Number(b.allocation)<=100&&(!b.utilize||['true','false'].includes(b.utilize.toLowerCase())));
export const bookingDaily=(bookings:Row[],employeeId:string,year:number,month:number)=>{
 const first=new Date(Date.UTC(year,month,1)),last=new Date(Date.UTC(year,month+1,0));
 const rows=activeRows(bookings,employeeId);
 return workdays(first,last).map(date=>{
  const day=date.toISOString().slice(0,10),active=rows.filter(b=>b.start<=day&&(b.end||b.start)>=day);
  const rawAllocation=active.reduce((s,b)=>s+Number(b.allocation),0);
  const rawBillable=active.filter(b=>b.utilize!=='false').reduce((s,b)=>s+Number(b.allocation),0);
  return {date:day,rawAllocation,rawBillable,allocation:Math.min(100,rawAllocation),billable:Math.min(100,rawBillable),overbooked:rawAllocation>100,bookings:active};
 });
};
export const monthlyBooking=(bookings:Row[],employeeId:string,year:number,month:number)=>{
 const rows=bookings.filter(b=>b.employeeId===employeeId);
 const invalid=rows.some(b=>!validDate(b.start||'')||!validDate(b.end||b.start||'')||(b.end||b.start)<b.start||b.allocation===''||!Number.isFinite(Number(b.allocation))||Number(b.allocation)<0||Number(b.allocation)>100||(!!b.utilize&&!['true','false'].includes(b.utilize.toLowerCase())));
 const daily=bookingDaily(bookings,employeeId,year,month),days=daily.length||1;
 return {allocation:daily.reduce((s,d)=>s+d.allocation,0)/days,billable:daily.reduce((s,d)=>s+d.billable,0)/days,invalid,hasBooking:daily.some(d=>d.bookings.length>0),overbooked:daily.some(d=>d.overbooked),overbookedDays:daily.filter(d=>d.overbooked).map(d=>d.date)};
};
export const bookingOverlaps=(bookings:Row[],employeeId:string,year:number,month:number)=>{
 const pairs:Array<{first:Row;second:Row}>=[];
 const seen=new Set<string>();
 for(const day of bookingDaily(bookings,employeeId,year,month)){
  const active=day.bookings.filter(b=>Number(b.allocation)>0);
  for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
   const a=active[i],b=active[j],key=[a.id||String(i),b.id||String(j)].sort().join('|');
   if(!seen.has(key)){seen.add(key);pairs.push({first:a,second:b});}
  }
 }
 return pairs;
};
export const bookingStatus=(allocation:number,billable:number)=>allocation<99.99999?'underallocated':billable<99.99999?'nonbillable':'billable';
