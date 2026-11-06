/** EmpEval v1.2 domain helpers. Pure functions; no Google Sheets writes. */
export type RecordRow = Record<string, string>;
export type Metric = { id: string; name: string; active?: string };
export type MetricAxis = { id: string; metricId: string; name: string; max: string; active?: string };
export type EmployeeMetric = { employeeId: string; metricId: string; assignedAt?: string };
export type EvaluationScore = { employeeId: string; axisId: string; periodId: string; value: string };
export type EmployeeComment = { id: string; employeeId: string; author: string; createdAt: string; comment: string };

export function assignedAxes(employeeId: string, assignments: EmployeeMetric[], axes: MetricAxis[]): MetricAxis[] {
  const metricIds = new Set(assignments.filter(a => a.employeeId === employeeId).map(a => a.metricId));
  return axes.filter(axis => metricIds.has(axis.metricId) && axis.active !== 'false');
}

export function normalizedScore(value: string | undefined, max: string): number | null {
  if (value === undefined || value.trim() === '') return null;
  const score = Number(value), ceiling = Number(max);
  if (!Number.isFinite(score) || !Number.isFinite(ceiling) || ceiling <= 0 || score < 0 || score > ceiling) return null;
  return 100 * score / ceiling;
}

export function validateAssignments(assignments: EmployeeMetric[], employees: RecordRow[], metrics: Metric[]): string[] {
  const employeeIds = new Set(employees.map(e => e.id));
  const metricIds = new Set(metrics.map(m => m.id));
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const assignment of assignments) {
    const key = JSON.stringify([assignment.employeeId, assignment.metricId]);
    if (seen.has(key)) errors.push('Duplicate employee metric assignment: ' + key);
    seen.add(key);
    if (!employeeIds.has(assignment.employeeId)) errors.push('Unknown employee: ' + assignment.employeeId);
    if (!metricIds.has(assignment.metricId)) errors.push('Unknown metric: ' + assignment.metricId);
  }
  return errors;
}

/** Legacy Metrics rows are individual axes. Categories become metric masters. */
export function previewLegacyMetrics(rows: RecordRow[]) {
  const categoryIds = new Map<string, string>();
  const metrics: Metric[] = [];
  const axes: MetricAxis[] = [];
  for (const row of rows) {
    const category = (row.category || 'Uncategorized').trim() || 'Uncategorized';
    let groupId = categoryIds.get(category);
    if (!groupId) {
      groupId = 'legacy-group-' + (categoryIds.size + 1);
      categoryIds.set(category, groupId);
      metrics.push({ id: groupId, name: category, active: 'true' });
    }
    axes.push({ id: row.id, metricId: groupId, name: row.name, max: row.max, active: 'true' });
  }
  return { metrics, axes };
}
