import {sheetHeaders,sheetNames,type SheetName} from './schema-v1.2.ts';
import {decodeSheet,encodeWorkbook,validateWorkbook,type Workbook} from './workbook-v1.2.ts';

export type SheetsTransport = (path:string,method?:string,body?:unknown)=>Promise<any>;
const range=(s:string)=>'/values/'+encodeURIComponent(s);

/** Fetches all canonical v1.2 sheets; refuses partial or legacy workbooks. */
export async function loadWorkbook(api:SheetsTransport):Promise<{workbook:Workbook;revision:string}> {
  const result={} as Workbook;
  for(const name of sheetNames){
    const response=await api(range(name+'!A1:Z10000'));
    result[name]=decodeSheet(name,response.values||[]);
  }
  const meta=result.Meta.find(row=>row.key==='revision');
  return {workbook:result,revision:meta?.value||''};
}

/** Create the 16 empty tabs on a new spreadsheet only; never modify an existing workbook. */
export async function initializeEmptyWorkbook(api:SheetsTransport):Promise<void> {
  const info=await api('?fields=sheets.properties.title');
  const existing=new Set((info.sheets||[]).map((s:any)=>s.properties.title));
  if(sheetNames.some(name=>existing.has(name)))throw Error('Initialization refused: one or more EmpEval sheets already exist');
  await api(':batchUpdate','POST',{requests:sheetNames.map(title=>({addSheet:{properties:{title}}}))});
  const workbook=Object.fromEntries(sheetNames.map(name=>[name,[]])) as Workbook;
  workbook.Meta=[{key:'schemaVersion',value:'1.2'},{key:'revision',value:crypto.randomUUID()}];
  await api('/values:batchUpdate','POST',{valueInputOption:'RAW',data:encodeWorkbook(workbook)});
}

/** Full sheet writes are allowed only after schema validation and revision recheck.
 * Note: Google Sheets has no atomic compare-and-swap; concurrent editors remain unsupported.
 */
export async function saveWorkbook(api:SheetsTransport,workbook:Workbook,expectedRevision:string):Promise<string> {
  const errors=validateWorkbook(workbook);
  if(errors.length)throw Error('Invalid workbook: '+errors.slice(0,5).join('; '));
  const current=await loadWorkbook(api);
  if(current.revision!==expectedRevision)throw Error('Remote workbook changed; reload before saving');
  const nextRevision=crypto.randomUUID();
  const updated={...workbook,Meta:[...workbook.Meta.filter(row=>row.key!=='revision'),{key:'revision',value:nextRevision}]};
  // Overwrite only ranges that belong to the canonical schema. Clear stale rows first.
  await api('/values:batchClear','POST',{ranges:sheetNames.map(name=>name+'!A2:Z10000')});
  await api('/values:batchUpdate','POST',{valueInputOption:'RAW',data:encodeWorkbook(updated)});
  return nextRevision;
}
