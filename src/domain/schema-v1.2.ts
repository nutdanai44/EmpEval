/** Canonical empty-workbook schema for EmpEval v1.2. No legacy migration required. */
export const sheetHeaders = {
  Employees: ['id','name','role','team','active','employeeCode'],
  Organizations: ['id','name'],
  Projects: ['id','orgId','name','periodStart','periodEnd','pmName'],
  Bookings: ['id','employeeId','projectId','start','end','allocation','role'],
  Metrics: ['id','name','description','active','sortOrder'],
  MetricAxes: ['id','metricId','name','max','weight','color','sortOrder','active'],
  EmployeeMetrics: ['employeeId','metricId','assignedAt','periodId'],
  EvaluationPeriods: ['id','name','startDate','endDate','status','metricIds'],
  Scores: ['employeeId','axisId','periodId','value','updatedAt'],
  Skills: ['id','name','category','description','target','critical'],
  EmployeeSkills: ['employeeId','skillId','level','updatedAt'],
  CertificateMaster: ['id','name','issuer','description','active'],
  Certifications: ['id','employeeId','certificateId','issued','expires','credentialUrl'],
  EmployeeComments: ['id','employeeId','author','createdAt','comment'],
  Portfolio: ['id','employeeId','projectId','summary','contribution'],
  Meta: ['key','value']
} as const;
export type SheetName = keyof typeof sheetHeaders;
export const sheetNames = Object.keys(sheetHeaders) as SheetName[];
export const emptyWorkbook = () => Object.fromEntries(sheetNames.map(name => [name, [] as Record<string,string>[]])) as Record<SheetName,Record<string,string>[]>;
export function checkWorkbookHeaders(actual: Record<string,string[]>): string[] {
  const errors:string[] = [];
  for (const name of sheetNames) {
    const expected = [...sheetHeaders[name]];
    if (!actual[name]) errors.push('Missing sheet: '+name);
    else if (JSON.stringify(actual[name]) !== JSON.stringify(expected)) errors.push('Header mismatch: '+name);
  }
  return errors;
}
