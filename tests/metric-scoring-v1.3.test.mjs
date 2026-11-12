import test from 'node:test';
import assert from 'node:assert/strict';
import {displayMetricScore,metricAverage} from '../src/domain/metric-scoring.ts';

test('reverse score follows a 1-based scale, 1→5, 2→4, 3→3',()=>{
 assert.equal(displayMetricScore('1','5',true),5);
 assert.equal(displayMetricScore('2','5',true),4);
 assert.equal(displayMetricScore('3','5',true),3);
 assert.equal(displayMetricScore('4','5',true),2);
 assert.equal(displayMetricScore('5','5',true),1);
 assert.equal(displayMetricScore('2','5',false),2);
 assert.equal(displayMetricScore('','5',true),null);
 assert.equal(displayMetricScore('6','5',true),null);
});
test('weighted average uses axis weights, not equal weighting or percentages',()=>{
 const result=metricAverage([{value:5,max:5,weight:50},{value:3,max:5,weight:30},{value:4,max:5,weight:20}]);
 assert.deepEqual(result,{score:4.2,max:5});
});
test('missing scores and nonpositive weights do not affect weighted average',()=>{
 assert.deepEqual(metricAverage([{value:4,max:5,weight:2},{value:null,max:5,weight:10},{value:1,max:5,weight:0}]),{score:4,max:5});
 assert.equal(metricAverage([{value:null,max:5,weight:1}]),null);
});
test('weighted maximum is preserved for mixed axis scales',()=>{
 const result=metricAverage([{value:4,max:5,weight:3},{value:8,max:10,weight:1}]);
 assert.deepEqual(result,{score:5,max:6.25});
});
