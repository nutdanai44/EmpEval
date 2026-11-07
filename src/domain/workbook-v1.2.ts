import {sheetHeaders, sheetNames, type SheetName} from './schema-v1.2.ts';
export type Row = Record<string,string>;
export type Workbook = Record<SheetName,Row[]>;
export type ValuesPayload = {range:string;values:string[][]};

export function decodeSheet(name:SheetName, values:string[][]):Row[] {
  const expected=[...sheetHeaders[name]];
  if (!values.length) throw new Error('Missing header row: '+name);
  if (JSON.stringify(values[0])!==JSON.stringify(expected)) throw new Error('Unexpected schema: '+name+'. Expected columns: '+expected.join(', ')+'. Found: '+values[0].join(', ')+'. No data was changed. Correct the header row in Google Sheets before Reload.');
  return values.slice(1).filter(row=>row.some(cell=>cell!==''&&cell!==undefined)).map(row=>Object.fromEntries(expected.map((h,i)=>[h,String(row[i]??'')])));
}
export function encodeSheet(name:SheetName, rows:Row[]):ValuesPayload {
  const cols=[...sheetHeaders[name]];
  return {range:name+'!A1',values:[cols,...rows.map(row=>cols.map(col=>String(row[col]??'')))]};
}
export function encodeWorkbook(workbook:Workbook):ValuesPayload[] {
  return sheetNames.map(name=>encodeSheet(name,workbook[name]));
}
export function validateWorkbook(workbook:Workbook):string[] {
  const errors:string[]=[];
  const ids=(name:SheetName)=>new Set(workbook[name].map(row=>row.id));
  const employees=ids('Employees'),metrics=ids('Metrics'),axes=ids('MetricAxes'),skills=ids('Skills'),certs=ids('CertificateMaster'),projects=ids('Projects'),orgs=ids('Organizations'),periods=ids('EvaluationPeriods');
  const check=(sheet:SheetName,field:string,valid:Set<string>)=>{
    for(const [i,row] of workbook[sheet].entries())if(!valid.has(row[field]))errors.push(sheet+' row '+(i+2)+': invalid '+field+' '+row[field]);
  };
  check('MetricAxes','metricId',metrics);
  check('EmployeeMetrics','employeeId',employees);check('EmployeeMetrics','metricId',metrics);check('EmployeeMetrics','periodId',periods);
  check('Scores','employeeId',employees);check('Scores','axisId',axes);check('Scores','periodId',periods);
  check('EmployeeSkills','employeeId',employees);check('EmployeeSkills','skillId',skills);
  check('Certifications','employeeId',employees);check('Certifications','certificateId',certs);
  check('EmployeeComments','employeeId',employees);
  check('Projects','orgId',orgs);
  check('Bookings','employeeId',employees);check('Bookings','projectId',projects);
  check('Portfolio','employeeId',employees);check('Portfolio','projectId',projects);
  for(const name of sheetNames){
    const cols=[...sheetHeaders[name]];
    if(!cols.includes('id'))continue;
    const seen=new Set<string>();
    for(const row of workbook[name]){
      if(!row.id)errors.push(name+': missing id');
      else if(seen.has(row.id))errors.push(name+': duplicate id '+row.id);
      seen.add(row.id);
    }
  }
  const unique=(name:SheetName,fields:string[])=>{
    const seen=new Set<string>();
    for(const row of workbook[name]){
      const key=JSON.stringify(fields.map(f=>row[f]));
      if(seen.has(key))errors.push(name+': duplicate key '+key);
      seen.add(key);
    }
  };
  unique('EmployeeMetrics',['employeeId','metricId','periodId']);
  unique('EmployeeSkills',['employeeId','skillId']);
  unique('Scores',['employeeId','axisId','periodId']);
  for(const axis of workbook.MetricAxes){
    if(!(Number(axis.max)>0))errors.push('MetricAxes: invalid max for '+axis.id);
  }
  for(const score of workbook.Scores){
    const axis=workbook.MetricAxes.find(a=>a.id===score.axisId);
    if(axis&&(score.value===''||!Number.isFinite(Number(score.value))||Number(score.value)<0||Number(score.value)>Number(axis.max)))errors.push('Scores: invalid value for '+score.axisId);
    if(axis&&!workbook.EmployeeMetrics.some(m=>m.employeeId===score.employeeId&&m.metricId===axis.metricId&&m.periodId===score.periodId))errors.push('Scores: metric not assigned for '+score.employeeId);
  }
  return errors;
}
