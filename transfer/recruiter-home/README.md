# Recruiter Homepage Module

Portable recruiter workspace for the campus placement app.

## Included

- `RecruiterHome.jsx`: recruiter dashboard and navigation views
- `RecruiterHome.css`: isolated recruiter styles and animations
- `services/recruiterAi.js`: stable AI contract with demo fallback responses

## Integration

Import the component from `RecruiterHome.jsx` and provide an `onLogout` callback. Replace the functions in `services/recruiterAi.js` with calls to your backend AI routes when the LLM is ready.

Keep database access server-side. A Supabase client should be created in the application backend or a protected data layer, not with a service-role key in this browser module.