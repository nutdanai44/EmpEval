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
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'Employees' }).click();
  await page.getByRole('heading', { name: 'Employee performance comparison' }).waitFor();
  await page.getByRole('combobox', { name: 'Performance axis group' }).selectOption('KPI');
  await page.getByRole('combobox', { name: 'Performance axis group' }).selectOption('All');
  await page.getByRole('tab', { name: /EMP001/ }).click();
  await page.getByRole('heading', { name: /EMP001/ }).waitFor();
  await page.getByRole('tab', { name: '+ Add' }).click();
  await page.getByRole('heading', { name: 'Add employee' }).waitFor();
  await page.getByRole('button', { name: 'Bookings' }).click();
  await page.getByRole('heading', { name: 'Project booking timeline' }).waitFor();
  await page.getByRole('button', { name: 'Projects' }).click();
  await page.getByRole('tab', { name: 'Organizations' }).click();
  await page.getByRole('heading', { name: 'Organizations', level: 2 }).waitFor();
  await page.getByRole('tab', { name: 'Projects' }).click();
  await page.getByRole('columnheader', { name: 'pmName' }).waitFor();
  await page.getByRole('button', { name: 'Employees' }).click();
  await page.getByRole('tab', { name: /EMP001/ }).click();
  await page.getByRole('heading', { name: 'Employee skills' }).waitFor();
  await page.getByRole('heading', { name: 'Employee certificates' }).waitFor();
  await page.getByRole('button', { name: 'Skills' }).click();
  await page.getByRole('heading', { name: 'Skill catalog · master data only' }).waitFor();
  await page.getByRole('button', { name: 'Projects' }).click();
  await page.getByRole('heading', { name: 'Projects', level: 2 }).waitFor();
  await page.getByRole('columnheader', { name: 'pmName' }).waitFor();
  await page.getByRole('button', { name: 'Certificates' }).click();
  await page.getByRole('heading', { name: /Employee certificates/ }).waitFor();
  await page.getByRole('button', { name: 'Portfolio' }).click();
  await page.getByRole('heading', { name: 'Project portfolio' }).waitFor();
  if (errors.length) throw Error('Browser errors:\n' + errors.join('\n'));
  console.log('PASS: app rendered, navigation worked, no browser exceptions or missing assets');
} finally {
  await browser?.close();
  server.kill();
}
