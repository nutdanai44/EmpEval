import test from 'node:test';
import assert from 'node:assert/strict';
import {initializeEmptyWorkbook,loadWorkbook,saveWorkbook} from '../src/domain/sheets-v1.2.ts';
import {sheetHeaders,sheetNames,emptyWorkbook} from '../src/domain/schema-v1.2.ts';

test('new empty spreadsheet initializes all schema tabs and canonical headers',async()=>{
  const calls=[];
  const api=async(path,method='GET',body)=>{calls.push({path,method,body});if(path==='?fields=sheets.properties.title')return {sheets:[]};return {}};
  await initializeEmptyWorkbook(api);
  assert.equal(calls[1].body.requests.length,sheetNames.length);
  assert.equal(calls[2].body.data.length,sheetNames.length);
  assert.deepEqual(calls[2].body.data.find(d=>d.range==='Scores!A1').values[0],sheetHeaders.Scores);
  assert.deepEqual(calls[2].body.data.find(d=>d.range==='BookingSkills!A1').values[0],sheetHeaders.BookingSkills);
});
test('initialization refuses a spreadsheet with any existing EmpEval tab',async()=>{
  const api=async()=>({sheets:[{properties:{title:'Employees'}}]});
  await assert.rejects(()=>initializeEmptyWorkbook(api),/refused/);
});
test('loading refuses missing headers rather than silently losing data',async()=>{
  const api=async()=>({values:[]});
  await assert.rejects(()=>loadWorkbook(api),/Missing header row/);
});
test('save refuses invalid references before any remote mutation',async()=>{
  const w=emptyWorkbook();w.EmployeeMetrics=[{employeeId:'missing',metricId:'missing'}];
  let calls=0;const api=async()=>{calls++;return {}};
  await assert.rejects(()=>saveWorkbook(api,w,''),/Invalid workbook/);
  assert.equal(calls,0);
});
test('loads older workbooks and creates durable leave and holiday tabs on save', async () => {
  const sheets = new Map(sheetNames.filter(name => !['EmployeeLeaves', 'CompanyHolidays'].includes(name))
    .map(name => [name, [[...sheetHeaders[name]]]]));
  sheets.get('Employees').push(['employee-1']);
  const api = async (path, method = 'GET', body) => {
    if (path === '?fields=sheets.properties.title') {
      return { sheets: [...sheets.keys()].map(title => ({ properties: { title } })) };
    }
    if (path.startsWith('/values/')) {
      return { values: sheets.get(decodeURIComponent(path.split('/').at(-1)).split('!')[0]) };
    }
    if (path === ':batchUpdate') {
      for (const request of body.requests) sheets.set(request.addSheet.properties.title, []);
    }
    if (path === '/values:batchUpdate') {
      for (const entry of body.data) sheets.set(entry.range.split('!')[0], entry.values);
    }
    return {};
  };
  const { workbook, revision } = await loadWorkbook(api);
  assert.deepEqual(workbook.EmployeeLeaves, []);
  workbook.EmployeeLeaves = [{
    id: 'leave-1', employeeId: 'employee-1', type: 'other', mode: 'morning',
    startDate: '2026-02-01', endDate: '2026-02-01', startTime: '', endTime: '',
    dailyMinutes: '195', detail: 'Test entry'
  }];
  assert.deepEqual(workbook.CompanyHolidays, []);
  workbook.CompanyHolidays = [{ id: 'holiday-1', date: '2026-02-02', name: 'Test holiday' }];
  const savedRevision = await saveWorkbook(api, workbook, revision);
  const reloaded = await loadWorkbook(api);
  assert.deepEqual(reloaded.workbook.EmployeeLeaves, workbook.EmployeeLeaves);
  assert.deepEqual(reloaded.workbook.CompanyHolidays, workbook.CompanyHolidays);
  assert.equal(reloaded.revision, savedRevision);
});
