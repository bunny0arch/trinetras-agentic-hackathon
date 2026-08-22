
# Campus Placement Operations

A React/Vite login experience for campus placement candidates and recruiters.

## Run locally

```bash
npm install
npm run dev
```

Before shipping, run:

```bash
npm run lint
npm run build
```

## Authentication

`src/App.jsx` renders the login experience and switches roles after sign-in:

- Selecting **Candidate** opens `CandidateHome` (`src/CandidateHome.jsx`)
- Selecting **Recruiter** opens `RecruiterHome` (`src/RecruiterHome.jsx`)

Each workspace receives an `onLogout` callback that returns to the login page. Authentication and account creation currently demonstrate the UI flow only — wire `handleSubmit` and `handleCreateAccount` to the application auth service when the backend is ready.

## Workspace modules

Portable copies of each workspace live in their own folders so the module can move to a separate package or route without dragging in app chrome:

- `candidate-home/` — candidate dashboard, styles, and `services/candidateAi.js`
- `recruiter-home/` — recruiter dashboard, styles, and `services/recruiterAi.js`

Keep the copies in sync with the working versions in `src` when you change a workspace. The AI service functions return stable shapes with demo fallbacks; replace them with protected backend routes when the LLM is ready, and keep database access server-side.
