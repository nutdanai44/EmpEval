/** Pure booking validation and monthly coverage; no spreadsheet writes. */
export type BookingRow = {id:string;employeeId:string;projectId:string;start:string;end:string;allocation:string;utilize?:string};
export type BookingIssue = {bookingId:string;code:'INVALID_DATE'|'INVALID_ALLOCATION'|'INVALID_UTILIZE'|'MISSING_REFERENCE';message:string};
const dateOK=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
const utilized=(value:string|undefined)=>value===undefined||value.trim()===''||value.toLowerCase()==='true';
export function validateBookingRows(rows:BookingRow[],employeeIds:Set<string>,projectIds:Set<string>):BookingIssue[]{
  const issues:BookingIssue[]=[];
  for(const row of rows){
    if(!dateOK(row.start)||!dateOK(row.end)||row.start>row.end)issues.push({bookingId:row.id,code:'INVALID_DATE',message:'Invalid booking date range'});
    const allocation=Number(row.allocation);
    if(row.allocation.trim()===''||!Number.isFinite(allocation)||allocation<=0||allocation>100)issues.push({bookingId:row.id,code:'INVALID_ALLOCATION',message:'Allocation must be greater than 0 and at most 100'});
    if(row.utilize!==undefined&&row.utilize.trim()!==''&&!['true','false'].includes(row.utilize.toLowerCase()))issues.push({bookingId:row.id,code:'INVALID_UTILIZE',message:'Utilize must be true or false'});
    if(!employeeIds.has(row.employeeId)||!projectIds.has(row.projectId))issues.push({bookingId:row.id,code:'MISSING_REFERENCE',message:'Unknown employee or project'});
  }
  return issues;
}
/** Month is YYYY-MM. Overlapping bookings count once per booking for that month.
 * Allocation is coverage; utilized allocation is billable. Both may exceed 100 and should be flagged.
 */
export function monthlyBookingCoverage(rows:BookingRow[],employeeId:string,month:string){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Invalid month');
  const first=month+'-01';
  const [year,m]=month.split('-').map(Number);
  const last=new Date(Date.UTC(year,m,0)).toISOString().slice(0,10);
  const active=rows.filter(row=>row.employeeId===employeeId&&dateOK(row.start)&&dateOK(row.end)&&row.start<=row.end&&row.start<=last&&row.end>=first&&row.allocation.trim()!==''&&Number.isFinite(Number(row.allocation))&&Number(row.allocation)>0&&Number(row.allocation)<=100&&(!row.utilize||['true','false'].includes(row.utilize.toLowerCase())));
  const allocation=active.reduce((sum,row)=>sum+Number(row.allocation),0);
  const billable=active.filter(row=>utilized(row.utilize)).reduce((sum,row)=>sum+Number(row.allocation),0);
  return {allocation,billable,available:Math.max(0,100-allocation),overbooked:allocation>100,bookingCount:active.length};
}
