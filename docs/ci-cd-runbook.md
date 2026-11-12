# EmpEval CI/CD runbook

## Workflows

- `.github/workflows/ci.yml`: runs on pull requests to `main` and manual dispatch. Installs dependencies, runs all unit tests, TypeScript/Vite build, and browser smoke tests. It does **not** use the protected `github-pages` environment, production variables, or deployment permissions.
- `.github/workflows/pages.yml`: runs on pushes to `main` and manual dispatch. The single deployment job uses the protected `github-pages` environment. It validates configuration, builds the production Vite bundle with environment variables, uploads it to Pages, deploys, and checks that the published URL responds.
- The old combined workflow is removed so it cannot deploy a second, differently configured build.

## GitHub setup (manual)

1. Settings > Pages > Build and deployment > Source: **GitHub Actions**.
2. Settings > Environments > `github-pages`: restrict deployment branches to **main**.
3. Under `github-pages` > Environment variables, define `VITE_GOOGLE_CLIENT_ID` and `VITE_SPREADSHEET_ID`. Repository variables are also supported, but environment variables take precedence.
4. Settings > Rules > Rulesets (or Branch protection): require pull requests and the `Build and smoke tests` check before merge to `main`. Check names must match the actual workflow check displayed in GitHub.
5. Google Cloud Console > OAuth client: authorize JavaScript origin `https://nutdanai44.github.io`. The application URL is `https://nutdanai44.github.io/EmpEval/`.
6. Share the target spreadsheet with authorized Google accounts and ensure Google Sheets API is enabled.

## Verification after merge

1. Confirm the `Deploy GitHub Pages` workflow succeeds for the merge commit.
2. Open the site in a fresh browser session; check there is no **Google configuration is missing** message.
3. Select **Connect Google** and sign in with an account authorized to access the spreadsheet.
4. Confirm the app loads employee and booking data, and **Reload** succeeds.
5. If authentication fails, inspect the displayed Google Sheets HTTP status and browser developer tools. A passing HTTP health check only verifies page availability, **not** OAuth or spreadsheet access.
6. Create a version tag only after production verification. To roll back, revert the merge through a new PR or redeploy a known-good commit.

## Security and operational notes

Vite embeds `VITE_*` values into public browser JavaScript. Client ID and spreadsheet ID are identifiers, not secrets. Never put OAuth client secrets, service-account private keys, or access tokens in `VITE_*` values. Data access is enforced by Google OAuth and spreadsheet permissions.

The repository currently has no `package-lock.json`; workflows use `npm install` rather than `npm ci`. Adding a committed lockfile and switching to `npm ci` is recommended in a separate PR for reproducible builds.
