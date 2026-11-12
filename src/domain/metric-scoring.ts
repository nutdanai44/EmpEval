export type MetricRow=Record<string,string>;
export function displayMetricScore(raw:string|undefined,maxValue:string,reverse:boolean):number|null{
 if(raw===undefined||raw.trim()==='')return null;
 const value=Number(raw),max=Number(maxValue);
 if(!Number.isFinite(value)||!Number.isFinite(max)||max<=0||value<0||value>max)return null;
 return reverse?max-value:value;
}
export function metricAverage(scores:Array<{value:number|null;max:number}>):number|null{
 const valid=scores.filter((s):s is {value:number;max:number}=>s.value!==null&&Number.isFinite(s.value)&&Number.isFinite(s.max)&&s.max>0);
 return valid.length?valid.reduce((sum,s)=>sum+s.value/s.max*100,0)/valid.length:null;
}
