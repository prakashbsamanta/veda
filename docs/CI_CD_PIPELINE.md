# CI/CD Pipeline Documentation

This repository uses [GitHub Actions](https://github.com/features/actions) to ensure code quality and stability. The pipeline runs automatically on every push to any branch and on every pull request to `main`.

## Pipeline Overview

The CI pipeline is defined in `.github/workflows/ci.yml` and consists of the following steps:

1.  **Setup**: Configuration of the Node.js environment and installation of dependencies (`npm ci`).
2.  **Lint**: Code quality checks using ESLint (`npm run lint`).
    *   *Note*: Some rules are currently set to "warn" to accommodate existing code. New code should adhere to best practices.
3.  **Type Check**: TypeScript static type checking (`npm run type-check`).
4.  **Test**: Unit and integration tests using Jest (`npm test`).
5.  **Security Audit**: Vulnerability scanning of dependencies (`npm audit`).

## Running Checks Locally

Before pushing your code, it is recommended to run the checks locally to catch issues early.

### Linting
```bash
npm run lint
```
To fix auto-correctable issues:
```bash
npm run lint -- --fix
```

### Type Checking
```bash
npm run type-check
```

### Testing
```bash
npm test
```

## Branch Protection Rules (Action Required)

To enforce this pipeline, you must configure **Branch Protection Rules** in the GitHub repository settings. These settings cannot be applied via code.

1.  Go to your repository on GitHub.
2.  Click **Settings** > **Branches**.
3.  Click **Add branch protection rule**.
4.  **Branch name pattern**: `main`
5.  Check **Require a pull request before merging**.
6.  Check **Require status checks to pass before merging**.
    *   Search for and select the job name "Validate" (or the individual step names if they appear separately, e.g., "Lint", "Type Check", "Test").
7.  (Optional but Recommended) Check **Do not allow bypassing the above settings**.
8.  Click **Create**.

## Troubleshooting

### Lint Errors
If the `Lint` job fails, check the GitHub Actions logs to see specifically which rules were violated. You can reproduce this locally with `npm run lint`.

### Type Check Errors
If `Type Check` fails, it means there are TypeScript errors (`tsc` failures). Run `npm run type-check` locally to debug.

### Test Failures
If `Test` fails, one or more Jest tests are broken. Run `npm test` locally to identify the failing test cases.

## Enhancements & Developer Experience

### Pre-commit Hooks
Calculated to improve code quality, we use `husky` and `lint-staged`.
- **Lint Staged**: Automatically runs `eslint` and related tests on files you are committing.
- **Benefit**: Prevents committing broken code or code with lint errors.

### Test Coverage
We enforce a minimum test coverage of **80%**.
- If your changes drop coverage below 80%, the tests (and CI) will fail.
- Check coverage locally with: `npm test -- --coverage`

### Pull Request Template
A default template is provided to standardize PR descriptions. Please fill out the "Type of Change" and "Checklist" sections.
