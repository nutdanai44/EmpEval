/** Pure booking validation and monthly coverage; no spreadsheet writes. */
export type BookingRow = {id:string;employeeId:string;projectId:string;start:string;end:string;allocation:string;utilize?:string};
export type BookingIssue = {bookingId:string;code:'INVALID_DATE'|'INVALID_ALLOCATION'|'INVALID_UTILIZE'|'MISSING_REFERENCE';message:string};
const dateOK=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
export function validateBookingRows(rows:BookingRow[],employeeIds:Set<string>,projectIds:Set<string>):BookingIssue[]{
  const issues:BookingIssue[]=[];
  for(const row of rows){
    if(!dateOK(row.start)||!dateOK(row.end)||row.start>row.end)issues.push({bookingId:row.id,code:'INVALID_DATE',message:'Invalid booking date range'});
    const allocation=Number(row.allocation);
    if(row.allocation.trim()===''||!Number.isFinite(allocation)||allocation<0||allocation>100)issues.push({bookingId:row.id,code:'INVALID_ALLOCATION',message:'Allocation must be between 0 and 100'});
    if(row.utilize!==undefined&&row.utilize.trim()!==''&&!['true','false'].includes(row.utilize.toLowerCase()))issues.push({bookingId:row.id,code:'INVALID_UTILIZE',message:'Utilize must be true or false'});
    if(!employeeIds.has(row.employeeId)||!projectIds.has(row.projectId))issues.push({bookingId:row.id,code:'MISSING_REFERENCE',message:'Unknown employee or project'});
  }
  return issues;
}
/** Uses the same weekday-weighted capacity rules as the Dashboard. */
import {monthlyBooking} from './booking.ts';
export function monthlyBookingCoverage(rows:BookingRow[],employeeId:string,month:string){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Invalid month');
 const [year,m]=month.split('-').map(Number);
 const result=monthlyBooking(rows as unknown as Record<string,string>[],employeeId,year,m-1);
 return {allocation:result.allocation,billable:result.billable,available:100-result.allocation,overbooked:result.overbooked,bookingCount:rows.filter(r=>r.employeeId===employeeId&&r.start<=month+'-31'&&(r.end||r.start)>=month+'-01').length};
}
