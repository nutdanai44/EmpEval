> Updated decision (2026-11-06): The user confirms there is no existing production data to preserve. Build the v1.2 Sheets schema directly; no legacy migration or backfill is required. Legacy preview utilities are optional and must not block the new implementation. Initialize empty tabs with v1.2 headers, and replace legacy full-sheet save before connecting the new UI. Do not assume that demo seed data is production data.

# EmpEval v1.2 — implementation plan

Status: foundation in progress. Do not deploy or migrate production Sheets until CI and data-backup checks pass.

## Contract
- Employees can be assigned zero or more metrics. Assigning a metric exposes **all** its axes; unassigned metrics are not scored and missing scores are not zero.
- Metrics are master records; each metric has multiple metric axes. A metric may be archived but not hard-deleted when referenced.
- Skills and certificate catalogs are independent master records. Employee skill levels and earned certificates are edited from Employee details only. A certificate does not automatically grant a skill.
- Comments are append-only history with author and timestamp; editing/deleting requires explicit policy.
- Projects and Organizations are separate tabs; Projects retain orgId, project ID and free-text pmName.
- Booking availability is workday-weighted monthly, for current month plus six future months.
- Dashboard overview remains unchanged.

## Target Sheets
Existing: Employees, Organizations, Projects, Bookings, Skills, EmployeeSkills, Certifications, Metrics, Scores, Portfolio, Meta.
Add: MetricAxes, EmployeeMetrics, EvaluationPeriods, CertificateMaster, EmployeeComments.
Optional later: CertificateSkills (no dependency required).

| Sheet | Columns |
| --- | --- |
| Metrics | id, name, description, active, sortOrder |
| MetricAxes | id, metricId, name, max, weight, color, sortOrder, active |
| EmployeeMetrics | employeeId, metricId, assignedAt |
| EvaluationPeriods | id, name, startDate, endDate, status |
| Scores | employeeId, axisId, periodId, value, updatedAt |
| Skills | id, name, category, description, target, critical |
| EmployeeSkills | employeeId, skillId, level, updatedAt |
| CertificateMaster | id, name, issuer, description, active |
| Certifications | id, employeeId, certificateId, issued, expires, credentialUrl |
| EmployeeComments | id, employeeId, author, createdAt, comment |
| Projects | id, orgId, name, periodStart, periodEnd, pmName |

## Superseded legacy migration notes — not required for this empty-data rollout
1. Back up the entire spreadsheet and capture original headers, row counts, revision.
2. Read all existing Metrics and Scores before any modifications. Legacy Metrics rows represent axes; group by category into new Metrics, preserving axis ID as MetricAxes.id. Create one EmployeeMetrics assignment per employee/category with an existing score. Preserve every original score, and attach an explicit legacy EvaluationPeriod.
3. Deduplicate existing Certifications by normalized (name, issuer) into CertificateMaster, retaining each employee's original issued/expires fields.
4. Add new Sheets and headers; do **not** use the existing save() batchClear against a migrated workbook until the frontend understands all new tables. The current client writes full sheets and would otherwise overwrite or lose new schema columns.
5. Validate row counts, unique composite keys, referential integrity, and score bounds. Abort on ambiguity and retain backups.
6. Roll out read-only migration preview first, then apply with explicit confirmation and verification.

## Implementation phases
1. Domain model, migration preview and tests; no production writes.
2. Schema-aware Sheets repository with header-based parsing, version check and safe writes.
3. Metrics master CRUD and axis editor; employee metric assignments and period scores.
4. Employee skills, certificates and append-only comments.
5. Standalone Skills/Certificates catalogs, Projects/Organizations tabs, booking refinements.
6. Browser regression, data integrity tests, CI, then merge to main and deploy.

## Acceptance checks
- Two employees can have different assigned metric sets; radar excludes unassigned metrics and does not treat missing scores as 0.
- Assigning a metric makes all active axes available.
- Employee skill and certificate changes never mutate master records.
- Certificate may have no related skill; skill may have no certificate.
- Comments retain chronological history and author.
- Projects display pmName and orgId; no data lost on save/reload.
- Legacy score values and original certificate ownership survive migration.
- Build, unit tests, Playwright smoke and Google Sheets integration checks pass before merge.
