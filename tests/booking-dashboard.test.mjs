import test from 'node:test';
import assert from 'node:assert/strict';
import {monthlyBooking,bookingStatus} from '../src/domain/booking.ts';
const booking=(id,allocation,utilize='true')=>({id,employeeId:'e1',projectId:'p1',start:'2026-06-01',end:'2026-06-30',allocation:String(allocation),utilize});
test('shared dashboard calculation flags full-month overbooking instead of capping at 100',()=>{
 const result=monthlyBooking([booking('b1',80),booking('b2',50)],'e1',2026,5);
 assert.equal(result.allocation,130);
 assert.equal(result.billable,130);
 assert.equal(bookingStatus(result.allocation,result.billable),'overbooked');
});
test('non-billable allocation contributes to coverage but not utilization',()=>{
 const result=monthlyBooking([booking('b1',60),booking('b2',40,'false')],'e1',2026,5);
 assert.equal(result.allocation,100);
 assert.equal(result.billable,60);
 assert.equal(bookingStatus(result.allocation,result.billable),'nonbillable');
});
test('partial-month bookings are prorated by weekdays',()=>{
 const result=monthlyBooking([{...booking('b1',100),start:'2026-06-01',end:'2026-06-05'}],'e1',2026,5);
 assert.equal(result.allocation,100*5/22);
});
