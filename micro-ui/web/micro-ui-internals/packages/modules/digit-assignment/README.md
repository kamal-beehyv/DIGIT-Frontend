# Advocate Registration Module (Digit Assignment)

## Overview

The Advocate Registration Module is a DIGIT UI module that provides advocate registration, sign-in, and application management functionality for both citizens and employees (Nyay Mitra). This module follows DIGIT UI standards and architecture patterns.

## 📚 Documentation References

This module is built following DIGIT UI standards:
- [UI Components Standardisation](https://core.digit.org/guides/developer-guide/ui-developer-guide/digit-ui/ui-components-standardisation)
- [DIGIT Design System](https://core.digit.org/guides/developer-guide/ui-developer-guide/digit-ui-components0.2.0)
- [DIGIT-UI Architecture](https://core.digit.org/guides/developer-guide/ui-developer-guide/digit-ui)

## 🏗️ Module Structure

```
digit-assignment/
├── src/
│   ├── Module.js                    # Main module entry point
│   ├── components/                  # Reusable components
│   ├── constants/                   # Constants and configurations
│   ├── locales/                     # Translation files (en.json)
│   ├── hooks/                       # useRegistrationForm etc.
│   ├── services/                    # AdvocateService, WorkflowService, etc.
│   └── pages/
│       ├── citizen/                 # Citizen-facing pages
│       │   ├── index.js             # Citizen app routing
│       │   ├── SignIn/
│       │   ├── Register/
│       │   ├── MobileScreen/        # Mobile number & OTP entry
│       │   ├── AdvocateVerification/
│       │   ├── NameScreen/
│       │   ├── AddressScreen/
│       │   ├── VerifyIdentity/
│       │   ├── AadhaarEntry/
│       │   ├── VerifyOtherId/
│       │   ├── TermsAndConditions/
│       │   ├── RegistrationSuccess/
│       │   ├── ApplicationStatus/
│       │   └── ApplicationDetails/
│       └── employee/
│           ├── index.js            # Employee app routing
│           ├── Inbox/
│           └── ApplicationDetails/
└── package.json
```

## 🎨 Component Standards Compliance

### Built-in Components Used

This module uses only DIGIT built-in components following the [UI Components Standardisation](https://core.digit.org/guides/developer-guide/ui-developer-guide/digit-ui/ui-components-standardisation) guidelines:

#### From `@egovernments/digit-ui-components`:
- `Card` - Container component for content sections
- `Button` - Primary action buttons
- `LinkLabel` - Clickable link labels

#### From `@egovernments/digit-ui-react-components`:
- `LabelFieldPair` - Form field label and input pairing
- `CardLabel` - Form field labels
- `TextInput` - Text input fields
- `CardLabelError` - Error message display

### Component Usage Pattern

The module follows the HRMS module pattern for consistency:

#### Phone Number Input (Following HRMS Pattern)
```jsx
import { LabelFieldPair, CardLabel, TextInput, CardLabelError } from "@egovernments/digit-ui-react-components";

<LabelFieldPair>
  <CardLabel className="card-label-smaller">
    {t("PHONE_NO") || "Phone No"} *
  </CardLabel>
  <div className="field-container" style={{ width: "100%", display: "block" }}>
    <div style={{ display: "flex" }}>
      <div className="citizen-card-input citizen-card-input--front">+91</div>
      <TextInput
        className="field desktop-w-full"
        name="phoneNumber"
        value={phoneNumber}
        onChange={handlePhoneChange}
        maxLength={10}
        minLength={10}
        pattern={mobileNumberPattern}
      />
    </div>
    {error && (
      <CardLabelError style={{ width: "100%" }}>
        {t("ERR_INVALID_MOBILE_NUMBER") || error}
      </CardLabelError>
    )}
  </div>
</LabelFieldPair>
```

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

**6. Start the dev server**

```bash
yarn start
```

- **Citizen (advocate registration):** [http://localhost:3000/digit-ui/citizen/digit-assignment](http://localhost:3000/digit-ui/citizen/digit-assignment)
- **Employee (inbox):** [http://localhost:3000/digit-ui/employee/digit-assignment/inbox](http://localhost:3000/digit-ui/employee/digit-assignment/inbox)

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 14+ and Yarn
- DIGIT UI dependencies installed
- Access to DIGIT component libraries

### Installation (from repo root)

Follow the **Run Locally** steps above: clone the repo, checkout `digit-assignment`, then from `micro-ui/web` run:

```bash
cp .env.digit-assignment .env
yarn build:digit-assignment
yarn install
yarn build
```

### Development

```bash
# From micro-ui/web – starts the full app with this module
yarn start

# Build for production
yarn build
```

## 📦 Module Registration

The module follows DIGIT's component registration pattern:

```javascript
// Module.js
const componentsToRegister = {
  AdvocateRegistrationModule,
  AdvocateRegistrationCard,
};

const initDigitAssignmentComponents = () => {
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
  });
};

export { initDigitAssignmentComponents };
```

## 🎯 Features

### Citizen Features
- **Sign In**: Role-based sign-in (Judge/Court Staff or Advocate/Litigant)
- **Registration**: Multi-step registration form
- **Application Status**: View application status
- **Application Details**: View detailed application information

### Employee Features
- **Inbox**: Manage advocate applications
- **Application Details**: Review and process applications

## 🌐 Localization

The module uses DIGIT's localization system:

### Translation Keys
All translation keys are defined in `src/constants/Localization.js`:

```javascript
export const AdvocateRegistrationTranslations = {
  SIGN_IN_TO_YOUR_ACCOUNT: "SIGN_IN_TO_YOUR_ACCOUNT",
  PHONE_NO: "PHONE_NO",
  ERR_INVALID_MOBILE_NUMBER: "ERR_INVALID_MOBILE_NUMBER",
  // ... more keys
};
```

### Translation Files
Translation files are located in `src/locales/`:
- `en.json` - English translations

### Usage
```jsx
import { useTranslation } from "react-i18next";

const { t } = useTranslation();
const title = t("SIGN_IN_TO_YOUR_ACCOUNT") || "Sign in to your account";
```

## 🎨 Styling

### CSS Architecture
- Component-specific CSS files (e.g., `SignIn.css`)
- Follows DIGIT CSS naming conventions
- Uses `!important` sparingly for DIGIT component overrides
- Responsive design with mobile-first approach

### Design System Compliance
- Colors: Uses DIGIT color constants
- Typography: Follows DIGIT typography scale
- Spacing: Uses consistent spacing units
- Components: Matches DIGIT Design System specifications

## 🔄 State Management

The module uses React hooks for local state management:
- `useState` - Component state
- `useMemo` - Computed values
- `useHistory` - Navigation (react-router-dom)
- `useTranslation` - Localization (react-i18next)

## 🛣️ Routing

### Citizen Routes
- `/digit-ui/citizen/digit-assignment` - Sign-in page (base route)
- `/digit-ui/citizen/digit-assignment/register` - Registration page
- `/digit-ui/citizen/digit-assignment/register/mobile` - Mobile number entry & OTP
- `/digit-ui/citizen/digit-assignment/register/advocate-verification` - Advocate verification (state, BAR number, BAR council ID upload)
- `/digit-ui/citizen/digit-assignment/register/name` - Name entry (as per official documents)
- `/digit-ui/citizen/digit-assignment/register/address` - Address entry (map + form fields)
- `/digit-ui/citizen/digit-assignment/register/verify-id` - Verify identity (Aadhaar or Other ID)
- `/digit-ui/citizen/digit-assignment/register/verify-aadhaar` - Aadhaar number entry (12 digits, Get OTP, OTP modal)
- `/digit-ui/citizen/digit-assignment/register/verify-other-id` - Other ID verification (placeholder)
- `/digit-ui/citizen/digit-assignment/register/terms-and-conditions` - Terms and conditions (Proceed submits application → application-status)
- `/digit-ui/citizen/digit-assignment/register/success` - Registered successfully (post-login option, not in main registration flow)
- `/digit-ui/citizen/digit-assignment/application-status` - Application status (waiting approval) - **End of registration flow**
- `/digit-ui/citizen/digit-assignment/application/:id` - My Application / application details

**Registration flow order:** Register → Mobile Number → Advocate Verification → Name Entry → Address Entry → Verify Identity → (Aadhaar) Aadhaar Entry → Terms and Conditions → **Proceed (submits application)** → **Application Status (waiting approval)**. Registered Successfully screen is available post-login, not in the main registration sequence.

### Employee Routes
- `/digit-ui/employee/digit-assignment/inbox` - Employee inbox
- `/digit-ui/employee/digit-assignment/application/:id` - Application details

## ✅ Validation

### Phone Number Validation
Follows DIGIT validation patterns:
- Pattern: `^[6-9][0-9]{9}$` (must start with 6-9)
- Length: Exactly 10 digits
- Prefix: +91 (India)

### Error Handling
- Real-time validation feedback
- Error messages displayed using `CardLabelError`
- Translation support for error messages

## 📋 Component Props

### SignIn Component
```typescript
interface SignInProps {
  stateCode: string;      // State code
  tenants: Array<any>;    // Tenant information
  path: string;           // Base path for routing
}
```

### Module Component
```typescript
interface AdvocateRegistrationModuleProps {
  stateCode: string;      // State code
  userType: "citizen" | "employee";  // User type
  tenants: Array<any>;    // Tenant information
}
```

## 🔍 Testing

### Component Testing
- Unit tests for components (to be added)
- Integration tests for workflows (to be added)
- E2E tests for user flows (to be added)

## 📝 Code Standards

### Naming Conventions
- Components: PascalCase (e.g., `SignIn`, `AdvocateRegistrationCard`)
- Files: camelCase for JS files, PascalCase for components
- CSS Classes: kebab-case (e.g., `advocate-registration-container`)

### Code Style
- Follows ESLint configuration
- Uses functional components with hooks
- Proper TypeScript/PropTypes (to be added)

## 🐛 Troubleshooting

### Common Issues

1. **Component not rendering**
   - Ensure module is registered: `initDigitAssignmentComponents()` (called from app entry in `micro-ui/web/src/index.js`)
   - Check component registry: `Digit.ComponentRegistryService.getComponent("Digit-AssignmentModule")`

2. **Styling not applying**
   - Verify CSS imports are correct
   - Check for CSS specificity conflicts
   - Ensure DIGIT CSS is loaded

3. **Translations not working**
   - Verify translation keys exist in `en.json`
   - Check `useTranslation` hook is imported correctly
   - Ensure locale files are loaded

## 📚 References

- [DIGIT UI Components Standardisation](https://core.digit.org/guides/developer-guide/ui-developer-guide/digit-ui/ui-components-standardisation)
- [DIGIT Design System](https://core.digit.org/guides/developer-guide/ui-developer-guide/digit-ui-components0.2.0)
- [DIGIT-UI Architecture](https://core.digit.org/guides/developer-guide/ui-developer-guide/digit-ui)

---

**Last Updated**: February 2026  
**Module Version**: 1.0.0
