
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

## Login page boundary

The login experience is implemented in `src/App.jsx` and exported as both the default export and the named `LoginPage` export. A future homepage can import `LoginPage` from this module and render it from a route or authentication gate without changing the login state or animation code.

The page is contained by the `.placement-shell` surface. Its document listener and delayed animation timers are cleaned up when the component unmounts, so switching to a homepage will not leave interaction handlers or state updates behind.

Authentication and account creation currently demonstrate the UI flow only. Connect `handleSubmit` and `handleCreateAccount` to the application auth service when the backend is ready.
