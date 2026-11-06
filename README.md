# EmpEval — Employee Capability Dashboard

React + Vite + TypeScript MVP for GitHub Pages, with Google OAuth and private Google Sheets API access.

## Features
Dashboard (pie/bar chart, critical skill coverage), Employee Directory and individual assessments, Project Booking Timeline (monthly allocation and overbooking), Skill Matrix, Certifications, Portfolio, and Settings (organizations, projects, customizable metric weights and maximum scores).

## Getting started
```bash
npm install
cp .env.example .env.local
npm run dev
npm run build
```

Configure `VITE_GOOGLE_CLIENT_ID` and `VITE_SPREADSHEET_ID` (ID `1_Ghuv2akR3PEkrp4CARQcaX-FU0QFvK207igYxmdyg8`).
In Google Cloud: enable Google Sheets API, configure OAuth Consent Screen and Web Client, authorize JavaScript origins `http://localhost:5173` and `https://nutdanai44.github.io`. Add OAuth test users if testing; share the private Sheet with approved Google accounts (Viewer to read, Editor to save).

GitHub: Settings → Secrets and variables → Actions → Variables: set `VITE_GOOGLE_CLIENT_ID` and `VITE_SPREADSHEET_ID`. Settings → Pages → Source: GitHub Actions. Merge branch into main to trigger deployment.

Expected deployment URL: https://nutdanai44.github.io/EmpEval/

## Data
Existing tab ชีต1 preserved. New tabs Employees, Metrics, Scores, Meta, Organizations, Projects, Bookings, Certifications, Skills, EmployeeSkills, Portfolio were created, with headers but no demo employees written. On first connect, Reload first. Save will write the current app dataset, so review it before saving demo records.

## Security and limitations
Repository and hosted JS are public; never commit employee data or service-account keys or client secrets. Access is enforced by Google Sheets permissions, not by UI. OAuth tokens are memory-only. Google Sheets editors can edit the whole spreadsheet, so granular Admin/Manager/Viewer roles require a backend. Save uses a non-atomic revision check; do not edit concurrently. Saving replaces the app-managed tab contents. MVP currently uses raw IDs for relationship editing (booking, skills, portfolio). Run `npm run build` to verify before deploying.
