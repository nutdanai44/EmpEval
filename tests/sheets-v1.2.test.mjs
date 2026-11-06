import test from 'node:test';
import assert from 'node:assert/strict';
import {initializeEmptyWorkbook,loadWorkbook,saveWorkbook} from '../src/domain/sheets-v1.2.ts';
import {sheetHeaders,sheetNames,emptyWorkbook} from '../src/domain/schema-v1.2.ts';

test('new empty spreadsheet initializes all 16 tabs and canonical headers',async()=>{
  const calls=[];
  const api=async(path,method='GET',body)=>{calls.push({path,method,body});if(path==='?fields=sheets.properties.title')return {sheets:[]};return {}};
  await initializeEmptyWorkbook(api);
  assert.equal(calls[1].body.requests.length,16);
  assert.equal(calls[2].body.data.length,16);
  assert.deepEqual(calls[2].body.data.find(d=>d.range==='Scores!A1').values[0],sheetHeaders.Scores);
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
