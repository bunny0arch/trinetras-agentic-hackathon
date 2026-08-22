# Candidate Homepage Module

Portable candidate workspace for the campus placement app.

## Included

- `CandidateHome.jsx`: candidate dashboard and navigation views
- `CandidateHome.css`: isolated candidate styles and animations
- `services/candidateAi.js`: stable AI contract with demo fallback responses

## Integration

Import the component from `CandidateHome.jsx` and provide an `onLogout` callback. Replace the functions in `services/candidateAi.js` with calls to your backend AI routes when the LLM is ready.

Keep database access server-side. A Supabase client should be created in the application backend or a protected data layer, not with a service-role key in this browser module.
