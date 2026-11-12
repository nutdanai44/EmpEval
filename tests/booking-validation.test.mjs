import test from 'node:test';
import assert from 'node:assert/strict';
import {monthlyBookingCoverage,validateBookingRows} from '../src/domain/booking-validation.ts';
const row=(overrides={})=>({id:'b1',employeeId:'e1',projectId:'p1',start:'2026-01-01',end:'2026-03-31',allocation:'50',utilize:'true',...overrides});
test('allocation and billable are distinct',()=>{
 const rows=[row(),row({id:'b2',allocation:'30',utilize:'false'})];
 assert.deepEqual(monthlyBookingCoverage(rows,'e1','2026-02'),{allocation:80,billable:50,available:20,overbooked:false,bookingCount:2});
 assert.equal(monthlyBookingCoverage(rows,'e1','2026-04').allocation,0);
});
test('overbooking alert is independent of capped allocation',()=>{
 const summary=monthlyBookingCoverage([row({allocation:'80'}),row({id:'b2',allocation:'50'})],'e1','2026-01');
 assert.equal(summary.allocation,100);assert.equal(summary.overbooked,true);
});
test('invalid references, dates, allocation and utilize are reported',()=>{
 const issues=validateBookingRows([row({start:'2026-02-30',allocation:'',utilize:'maybe',projectId:'unknown'})],new Set(['e1']),new Set(['p1']));
 assert.deepEqual(issues.map(i=>i.code),['INVALID_DATE','INVALID_ALLOCATION','INVALID_UTILIZE','MISSING_REFERENCE']);
});
test('zero allocation is a valid future assignment',()=>{
 assert.deepEqual(validateBookingRows([row({allocation:'0'})],new Set(['e1']),new Set(['p1'])),[]);
});
test('weekend-only booking contributes no weekday capacity',()=>{
 const result=monthlyBookingCoverage([row({start:'2026-01-31',end:'2026-02-01',allocation:'25',utilize:'false'})],'e1','2026-02');
 assert.equal(result.allocation,0);assert.equal(result.billable,0);
});
