import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyWorkbook, sheetHeaders, sheetNames} from '../src/domain/schema-v1.2.ts';
import {decodeSheet, encodeSheet, encodeWorkbook, validateWorkbook} from '../src/domain/workbook-v1.2.ts';

test('all clean schema sheets encode with canonical headers',()=>{
  const workbook=emptyWorkbook();
  const payload=encodeWorkbook(workbook);
  assert.equal(payload.length,16);
  for(const entry of payload){
    const name=entry.range.split('!')[0];
    assert.deepEqual(entry.values[0],sheetHeaders[name]);
  }
  assert.equal(sheetNames.length,16);
});
test('row codec retains values and refuses wrong schema',()=>{
  const rows=[{id:'e1',name:'Person',role:'Engineer',team:'A',active:'true',employeeCode:'EMP001'}];
  const payload=encodeSheet('Employees',rows);
  assert.deepEqual(decodeSheet('Employees',payload.values),rows);
  assert.throws(()=>decodeSheet('Employees',[['id','name']]),/Unexpected schema/);
});
test('metric scores require employee assignment and stay within axis maximum',()=>{
  const w=emptyWorkbook();
  w.Employees=[{id:'e1'}];w.Metrics=[{id:'m1'}];w.MetricAxes=[{id:'a1',metricId:'m1',max:'5'}];w.EvaluationPeriods=[{id:'p1'}];
  w.Scores=[{employeeId:'e1',axisId:'a1',periodId:'p1',value:'4'}];
  assert.match(validateWorkbook(w).join(' '),/metric not assigned/);
  w.EmployeeMetrics=[{employeeId:'e1',metricId:'m1'}];
  assert.deepEqual(validateWorkbook(w),[]);
  w.Scores[0].value='6';
  assert.match(validateWorkbook(w).join(' '),/invalid value/);
});
test('certificate master and employee certificate are independent',()=>{
  const w=emptyWorkbook();
  w.Employees=[{id:'e1'}];w.CertificateMaster=[{id:'cert1',name:'AWS'}];
  assert.deepEqual(validateWorkbook(w),[]);
  w.Certifications=[{id:'owned1',employeeId:'e1',certificateId:'cert1'}];
  assert.deepEqual(validateWorkbook(w),[]);
});
