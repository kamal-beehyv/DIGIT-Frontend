

# DIGIT UI

A React App built on top of DIGIT UI Core.

# DIGIT

DIGIT eGovernance Platform Services

DIGIT (Digital Infrastructure for Governance, Impact & Transformation) is India's largest platform for governance services. Visit https://core.digit.org/ for more details.

DIGIT platform is microservices based API platform enabling quick rebundling of services as per specific needs. This is a repo that lays down the core platform on top of which other mission services depend.

# DIGIT UI

This repository contains source code for web implementation of the new Digit UI modules with dependencies and libraries.

Workbench module is used to manage master data (MDMS V2 Service) and Localisation data used across DIGIT Services. The Digit-Assignment module provides advocate registration (citizen and employee) flows.

## Run Locally

**1. Clone the project**

```bash
git clone https://github.com/egovernments/DIGIT-Frontend.git
cd DIGIT-Frontend
git checkout digit-assignment
```

**2. Go to the web app directory**

```bash
cd micro-ui/web
```

**3. Create `.env` from `.env.digit-assignment`**

```bash
cp .env.digit-assignment .env
```

**4. Build assignment**

```bash
yarn build:digit-assignment
```

**5. Install dependencies and build**

```bash
yarn install
yarn build
```

Then start the dev server and open the app:

```bash
yarn start
```

- **Citizen (advocate registration):** [http://localhost:3000/digit-ui/citizen/digit-assignment](http://localhost:3000/digit-ui/citizen/digit-assignment)
- **Employee (inbox):** `http://localhost:3000/digit-ui/employee/digit-assignment/inbox`

## Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file. For Digit-Assignment with mock API, you can copy `micro-ui/web/.env.digit-assignment` to `micro-ui/web/.env`.

`REACT_APP_PROXY_API` :: `{{server url}}`

`REACT_APP_GLOBAL` :: `{{server url}}`

`REACT_APP_PROXY_ASSETS` :: `{{server url}}`

`REACT_APP_USER_TYPE` :: `{{EMPLOYEE||CITIZEN}}`

`SKIP_PREFLIGHT_CHECK` :: `true`

[sample .env file](https://github.com/egovernments/Digit-Core/blob/workbench/frontend/micro-ui/web/micro-ui-internals/example/.env-unifieddev)

## Tech Stack

**Libraries:**

[React](https://react.dev/)

[React Hook Form](https://www.react-hook-form.com/)

[React Query](https://tanstack.com/query/v3/)

[Tailwind CSS](https://tailwindcss.com/)

[Webpack](https://webpack.js.org/)

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Author

- [@jagankumar-egov](https://www.github.com/jagankumar-egov)

## Documentation

[Documentation](https://core.digit.org/guides/developer-guide/ui-developer-guide/digit-ui)

## Support

For support, add the issues in https://github.com/egovernments/DIGIT-core/issues.

## Modules

1. **Core** – DIGIT UI core and citizen/employee shells
2. **Workbench** – Master data (MDMS V2), Localisation, boundaries
3. **Digit-Assignment** – Advocate registration (citizen sign-in/registration, employee inbox/approval)
4. HRMS
5. Dashboard
6. Engagement
7. Payment

For module-specific docs (e.g. Digit-Assignment), see `micro-ui/web/micro-ui-internals/packages/modules/<module-name>/README.md`.

![Logo](https://s3.ap-south-1.amazonaws.com/works-dev-asset/mseva-white-logo.png)
