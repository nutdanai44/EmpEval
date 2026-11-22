import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: 'inherit' });
let browser;
try {
  const url = 'http://127.0.0.1:4173/EmpEval/';
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(url); if (r.ok) { ready = true; break; } } catch {}
    await delay(500);
  }
  if (!ready) throw Error('Vite preview server did not start');
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400 && new URL(r.url()).origin === new URL(url).origin) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Dashboard', level: 1 }).waitFor({timeout:10000});
  // v1.3 dashboard: command center, global filters, KPI and insight sections.
  await page.getByRole('heading', { name: 'Team Command Center' }).waitFor();
  for (const label of ['Dashboard year','Dashboard month','Dashboard evaluation period']) {
    await page.getByRole('combobox', {name:label}).waitFor();
  }
  for (const heading of ['Action Center','Booking Coverage','Evaluation Progress','Team Skills','Employee roster']) {
    await page.getByRole('heading', {name:heading,exact:true}).waitFor();
  }
  await page.getByRole('button', {name:/Employees.*Team members/}).waitFor();
  await page.getByRole('button', {name:/Fully billable.*100% billable/}).waitFor();
  await page.getByRole('button', {name:/Evaluation pending.*Assigned, incomplete/}).waitFor();
  await page.getByRole('button', {name:/Invalid bookings.*Needs correction/}).waitFor();
  await page.getByText('No pending edits').waitFor();
  // With an empty workbook the Action Center must not show unnecessary pagination.
  const actionCenterPages = page.getByRole('navigation', {name:'Action Center pages'});
  if (await actionCenterPages.count() !== 0) throw Error('Unexpected Action Center pagination with no alerts');
  await page.getByRole('combobox', {name:'Dashboard month'}).selectOption('0');
  await page.getByRole('combobox', {name:'Dashboard month'}).selectOption('10');
  await page.getByRole('button', {name:/Invalid bookings.*Needs correction/}).click();
  // Verify the KPI applies its intended roster filter, then clear it using another KPI.
  await page.getByRole('combobox', {name:'Filter booking status'}).waitFor({timeout:10000});
  const selectedBookingFilter = await page.getByRole('combobox', {name:'Filter booking status'}).inputValue();
  if (selectedBookingFilter !== 'invalid') throw Error('Invalid bookings KPI did not apply filter: '+selectedBookingFilter);
  await page.getByRole('button', {name:/Employees.*Team members/}).click();
  const bookingFilter = await page.getByRole('combobox', {name:'Filter booking status'}).inputValue();
  if (bookingFilter !== 'all') throw Error('Employees KPI did not clear booking filter: '+bookingFilter);
  await page.getByRole('button', {name:'Metric Comparison',exact:true}).click();
  await page.getByRole('heading', {name:'Metric Comparison', level:1}).waitFor();
  await page.getByRole('heading', {name:/Select Metrics/}).waitFor();
  await page.getByRole('heading', {name:/Score Comparison/}).waitFor();
  await page.getByRole('button', {name:'Dashboard',exact:true}).click();
  await page.getByRole('heading', {name:'Team Command Center'}).waitFor();
  await page.getByRole('button', { name: 'Employees', exact: true }).click();
  await page.getByRole('heading', { name: 'Employee performance comparison' }).waitFor();
  await page.getByRole('button', { name: '+ Add employee' }).click();
  await page.getByRole('tab', { name: 'Metrics' }).click();
  await page.getByRole('heading', { name: 'Assigned metrics' }).waitFor();
  await page.getByRole('tab', { name: 'Skills', exact: true }).click();
  await page.getByRole('combobox', { name: 'Assign skill' }).waitFor();
  await page.getByRole('tab', { name: 'Certificates', exact: true }).click();
  await page.getByRole('button', { name: '+ Add earned certificate' }).waitFor();
  await page.getByRole('tab', { name: 'Comments' }).click();
  await page.getByRole('textbox', { name: 'New comment' }).fill('Initial review');
  await page.getByRole('button', { name: '+ Add comment' }).click();
  await page.getByText('Initial review').waitFor();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByRole('textbox', { name: 'Edit comment' }).fill('Updated review');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('Updated review').waitFor();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByText('Updated review').waitFor({ state: 'detached' });
  await page.clock.setFixedTime(new Date('2026-02-03T12:00:00Z'));
  await page.getByRole('button', { name: 'Company Holidays', exact: true }).click();
  const holidays = page.getByRole('region', { name: 'Holiday calendar' });
  await holidays.getByRole('button', { name: '+ Add holiday' }).click();
  await holidays.getByLabel('Holiday date').fill('2026-02-02');
  await holidays.getByLabel('Holiday name').fill('Test company holiday');
  await holidays.getByRole('button', { name: 'Done' }).click();
  await holidays.getByText('Test company holiday', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Employees', exact: true }).click();
  await page.getByRole('tab', { name: 'Leave', exact: true }).click();
  const leave = page.getByRole('region', { name: 'Employee leave' });
  await leave.getByRole('button', { name: '+ Add leave' }).click();
  if (await leave.getByLabel('Hours per day').inputValue() !== '8') throw Error('Invalid default full-day hours');
  await leave.getByLabel('First date').fill('2026-01-30');
  await leave.getByLabel('Last date (optional)', { exact: true }).fill('2026-02-02');
  await leave.getByRole('button', { name: 'Done' }).click();
  const total = leave.locator('.leave-total');
  if (await total.textContent() !== '1 day') throw Error('Weekend or company holiday counted as leave');
  await leave.getByRole('region', { name: 'Monthly leave summary' }).getByText('8 hours = 1 day').waitFor();
  page.once('dialog', dialog => dialog.accept());
  await leave.getByRole('button', { name: 'Delete', exact: true }).click();
  await leave.getByRole('button', { name: '+ Add leave' }).click();
  await leave.getByLabel('Leave type').selectOption('other');
  await leave.getByLabel('Duration type').selectOption('morning');
  if (await leave.getByLabel('Hours per day').inputValue() !== '3') throw Error('Invalid default morning hours');
  if (await leave.getByLabel('Duration type').locator('option[value=hourly]').count()) throw Error('Hourly leave is still selectable');
  await leave.getByLabel('Minutes per day').fill('15');
  await leave.getByLabel('Details (optional)', { exact: true }).fill('Test leave');
  await leave.getByRole('button', { name: 'Done' }).click();
  if (await total.textContent() !== '0.406 days') throw Error('Unexpected morning leave total');
  await leave.getByRole('button', { name: 'Edit', exact: true }).click();
  if (await leave.getByLabel('Minutes per day').inputValue() !== '15') throw Error('Saved custom minutes were overwritten');
  await leave.getByLabel('Duration type').selectOption('afternoon');
  if (await leave.getByLabel('Hours per day').inputValue() !== '5') throw Error('Invalid default afternoon hours');
  if (await leave.getByLabel('Minutes per day').inputValue() !== '0') throw Error('Previous duration was carried over');
  await leave.getByRole('button', { name: 'Done' }).click();
  if (await total.textContent() !== '0.625 days') throw Error('Unexpected afternoon leave total');
  page.once('dialog', dialog => dialog.accept());
  await leave.getByRole('button', { name: 'Delete', exact: true }).click();
  if (await total.textContent() !== '0 days') throw Error('Deleted leave still contributes to the total');
  await leave.getByRole('button', { name: '+ Add leave' }).click();
  await leave.getByLabel('First date').fill('2027-01-04');
  await leave.getByRole('button', { name: 'Done' }).click();
  if (await leave.getByLabel('Leave year').inputValue() !== '2027') throw Error('Future leave year was not selected');
  await leave.getByText('Upcoming leave · 1 day', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await page.getByRole('combobox', { name: 'Dashboard year' }).selectOption('2027');
  const staffing = page.getByRole('region', { name: 'Dates everyone is on leave · 2027' });
  const sharedDate = staffing.getByRole('row').filter({ has: page.locator('time[datetime="2027-01-04"]') });
  await sharedDate.getByText('No one available all day', { exact: true }).waitFor();
  if (!(await sharedDate.getAttribute('class'))?.includes('shared-leave-low')) throw Error('Low staffing was not highlighted');
  const teamLeave = page.getByRole('region', { name: 'Team leave summary' });
  if (await teamLeave.count()) throw Error('Leave details are still shown on the dashboard overview');
  await page.getByRole('tab', { name: 'Team leave', exact: true }).click();
  await staffing.waitFor({ state: 'detached' });

  await teamLeave.getByRole('heading', { name: 'Team leave summary · 2027' }).waitFor();
  if (await teamLeave.locator('dd').allTextContents().then(values => values.join(',')) !== '1 day,0 days,1 day') {
    throw Error('Unexpected team leave totals');
  }
  const conflicts = teamLeave.getByRole('region', { name: 'Leave conflicts' });
  await conflicts.getByRole('checkbox', { name: 'Only days with no coverage' }).check();
  await conflicts.getByText('No one available all day', { exact: true }).waitFor();
  const balances = teamLeave.getByRole('region', { name: 'Leave by employee' });
  await balances.getByRole('row', { name: /New Employee.*0 days.*1 day/ }).waitFor();
  await conflicts.getByRole('button', { name: 'New Employee', exact: true }).click();
  await page.getByRole('tab', { name: 'Leave', exact: true, selected: true }).waitFor();


  await page.getByRole('button', { name: 'Projects', exact: true }).click();
  await page.getByRole('tab', { name: 'Organizations' }).click();
  await page.getByRole('heading', { name: 'Organizations', level: 2 }).waitFor();
  await page.getByRole('button', { name: 'Q-Pref Settings', exact: true }).click();
  await page.getByRole('tab', { name: 'Metric', exact: true }).click();
  await page.getByRole('heading', { name: 'Metric catalog' }).waitFor();
  await page.getByRole('tab', { name: 'Q-Pref Period Time' }).click();
  await page.getByRole('heading', { name: 'Evaluation periods' }).waitFor();
  await page.getByRole('button', { name: 'Skills', exact: true }).click();
  await page.getByRole('heading', { name: 'Skill catalog · master data only' }).waitFor();
  await page.getByRole('button', { name: 'Certificates', exact: true }).click();
  await page.getByRole('heading', { name: 'Certificate catalog · master data only' }).waitFor();
  if (errors.length) throw Error('Browser errors:\n' + errors.join('\n'));
  console.log('PASS: app rendered, navigation worked, no browser exceptions or missing assets');
} finally {
  await browser?.close();
  server.kill();
}
