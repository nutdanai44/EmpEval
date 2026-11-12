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
  await page.getByRole('combobox', {name:'Dashboard month'}).selectOption('0');
  await page.getByRole('combobox', {name:'Dashboard month'}).selectOption('10');
  await page.getByRole('button', {name:/Invalid bookings.*Needs correction/}).click();
  await page.getByRole('button', {name:'Reset filters'}).click();
  await page.getByRole('button', {name:'Metric Comparison'}).click();
  await page.getByRole('heading', {name:'Metric Comparison'}).waitFor();
  await page.getByRole('heading', {name:/Select Metrics/}).waitFor();
  await page.getByRole('heading', {name:/Score Comparison/}).waitFor();
  await page.getByRole('button', {name:'Dashboard',exact:true}).click();
  await page.getByRole('heading', {name:'Team Command Center'}).waitFor();
  await page.getByRole('button', { name: 'Employees' }).click();
  await page.getByRole('heading', { name: 'Employee performance comparison' }).waitFor();
  await page.getByRole('button', { name: '+ Add employee' }).click();
  await page.getByRole('tab', { name: 'Metrics' }).click();
  await page.getByRole('heading', { name: 'Assigned metrics' }).waitFor();
  await page.getByRole('tab', { name: 'Skills' }).click();
  await page.getByRole('combobox', { name: 'Assign skill' }).waitFor();
  await page.getByRole('tab', { name: 'Certificates' }).click();
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
  await page.getByRole('button', { name: 'Projects' }).click();
  await page.getByRole('tab', { name: 'Organizations' }).click();
  await page.getByRole('heading', { name: 'Organizations', level: 2 }).waitFor();
  await page.getByRole('button', { name: 'Q-Pref Settings' }).click();
  await page.getByRole('tab', { name: 'Metric', exact: true }).click();
  await page.getByRole('heading', { name: 'Metric catalog' }).waitFor();
  await page.getByRole('tab', { name: 'Q-Pref Period Time' }).click();
  await page.getByRole('heading', { name: 'Evaluation periods' }).waitFor();
  await page.getByRole('button', { name: 'Skills' }).click();
  await page.getByRole('heading', { name: 'Skill catalog · master data only' }).waitFor();
  await page.getByRole('button', { name: 'Certificates' }).click();
  await page.getByRole('heading', { name: 'Certificate catalog · master data only' }).waitFor();
  if (errors.length) throw Error('Browser errors:\n' + errors.join('\n'));
  console.log('PASS: app rendered, navigation worked, no browser exceptions or missing assets');
} finally {
  await browser?.close();
  server.kill();
}
