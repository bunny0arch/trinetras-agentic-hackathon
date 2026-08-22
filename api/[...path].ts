import { createApp } from "../server/_core/index";

// Vercel routes /api/* requests through this catch-all function while the
// production frontend is served from the generated public directory.
export default createApp();
