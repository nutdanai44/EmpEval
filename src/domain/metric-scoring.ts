export type MetricRow=Record<string,string>;
export function displayMetricScore(raw:string|undefined,maxValue:string,reverse:boolean):number|null{
 if(raw===undefined||raw.trim()==='')return null;
 const value=Number(raw),max=Number(maxValue);
 if(!Number.isFinite(value)||!Number.isFinite(max)||max<=0||value<0||value>max)return null;
 // Metric scales are 1..max; reverse 1->max, 2->max-1, etc.
 return reverse?max+1-value:value;
}
/** Weighted score on the axes' native scale. Missing/invalid scores and non-positive weights are excluded. */
export function metricAverage(scores:Array<{value:number|null;max:number;weight:number}>):{score:number;max:number}|null{
 const valid=scores.filter((s):s is {value:number;max:number;weight:number}=>s.value!==null&&Number.isFinite(s.value)&&Number.isFinite(s.max)&&s.max>0&&Number.isFinite(s.weight)&&s.weight>0);
 if(!valid.length)return null;
 const totalWeight=valid.reduce((sum,s)=>sum+s.weight,0);
 return {
  score:valid.reduce((sum,s)=>sum+s.value*s.weight,0)/totalWeight,
  max:valid.reduce((sum,s)=>sum+s.max*s.weight,0)/totalWeight
 };
}
