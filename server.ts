import { createApp } from "./server/_core/index";
import { serveStatic } from "./server/_core/vite";

const app = createApp();
serveStatic(app);

// Vercel captures this listener as the project’s single Node.js server function.
// The port is only used locally; Vercel supplies its own request lifecycle.
app.listen(Number(process.env.PORT ?? 3000));

export default app;
