import test from 'node:test';
import assert from 'node:assert/strict';
import { assignedAxes, normalizedScore, previewLegacyMigration, validateAssignments } from '../src/domain/empeval-v1.2.ts';

test('assignment exposes every active axis for only the assigned metric', () => {
  const axes = [
    {id:'a1',metricId:'m1',name:'Teamwork',max:'5'},
    {id:'a2',metricId:'m1',name:'Ownership',max:'5'},
    {id:'a3',metricId:'m2',name:'Delivery',max:'10'},
    {id:'a4',metricId:'m1',name:'Retired',max:'5',active:'false'}
  ];
  assert.deepEqual(assignedAxes('e1',[{employeeId:'e1',metricId:'m1'},{employeeId:'e2',metricId:'m2'}],axes).map(a=>a.id),['a1','a2']);
  assert.deepEqual(assignedAxes('e3',[],axes),[]);
});
test('missing scores are not zero and out-of-range scores are invalid', () => {
  assert.equal(normalizedScore('', '5'),null);
  assert.equal(normalizedScore(undefined, '5'),null);
  assert.equal(normalizedScore('0', '5'),0);
  assert.equal(normalizedScore('4', '5'),80);
  assert.equal(normalizedScore('6', '5'),null);
});
test('legacy migration retains scores, groups axes, deduplicates certificate catalog', () => {
  const result=previewLegacyMigration({
    employees:[{id:'e1'}],
    metrics:[{id:'a1',name:'Teamwork',category:'Vision',max:'5'},{id:'a2',name:'Ownership',category:'Vision',max:'5'}],
    scores:[{employeeId:'e1',metricId:'a1',value:'4'},{employeeId:'e1',metricId:'a2',value:'5'}],
    certifications:[{id:'c1',employeeId:'e1',name:'AWS',issuer:'Amazon'},{id:'c2',employeeId:'e1',name:'aws',issuer:'amazon'}]
  });
  assert.equal(result.metrics.length,1);
  assert.equal(result.axes.length,2);
  assert.equal(result.assignments.length,1);
  assert.equal(result.scoreCount,2);
  assert.equal(result.certificateMaster.length,1);
  assert.equal(result.earnedCertificates.length,2);
  assert.equal(result.safeToApply,true);
});
test('unknown references block migration and duplicate assignments fail validation',()=>{
  const result=previewLegacyMigration({employees:[{id:'e1'}],metrics:[],scores:[{employeeId:'e1',metricId:'missing',value:'2'}],certifications:[]});
  assert.equal(result.safeToApply,false);
  assert.equal(validateAssignments([{employeeId:'e1',metricId:'m1'},{employeeId:'e1',metricId:'m1'}],[{id:'e1'}],[{id:'m1',name:'Metric'}]).length,1);
});
