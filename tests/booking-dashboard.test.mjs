import test from 'node:test';
import assert from 'node:assert/strict';
import {monthlyBooking,bookingDaily,bookingStatus} from '../src/domain/booking.ts';
const booking=(id,allocation,utilize='true',start='2026-06-01',end='2026-06-30')=>({id,employeeId:'e1',projectId:'p1',start,end,allocation:String(allocation),utilize});
test('monthly capacity capped per day; overbooking remains independent',()=>{
 const result=monthlyBooking([booking('a',80),booking('b',50)],'e1',2026,5);
 assert.equal(result.allocation,100);assert.equal(result.billable,100);assert.equal(result.overbooked,true);
 assert.equal(bookingStatus(result.allocation,result.billable),'billable');
});
test('one overbooked day does not disappear in weekly average',()=>{
 const rows=[booking('a',80),booking('b',50,'false','2026-06-01','2026-06-01')];
 const result=monthlyBooking(rows,'e1',2026,5);
 assert.equal(result.allocation,(100+21*80)/22);
 assert.equal(result.billable,80);
 assert.deepEqual(result.overbookedDays,['2026-06-01']);
 assert.equal(bookingDaily(rows,'e1',2026,5)[0].rawAllocation,130);
});
test('non-overlapping projects do not overbook',()=>{
 const rows=[booking('a',100,'true','2026-06-01','2026-06-02'),booking('b',100,'true','2026-06-03','2026-06-05')];
 const result=monthlyBooking(rows,'e1',2026,5);
 assert.equal(result.overbooked,false);assert.equal(result.allocation,500/22);
});
test('zero allocation is valid and does not consume capacity',()=>{
 const result=monthlyBooking([booking('a',0)],'e1',2026,5);
 assert.equal(result.invalid,false);assert.equal(result.allocation,0);assert.equal(result.overbooked,false);
});
