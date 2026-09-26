import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { createApp } from "./app.js";

async function bootstrap(): Promise<void> {
  await connectDatabase();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
    console.log(`MongoDB connected: ${env.MONGODB_URI}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${env.PORT} is already in use. Set PORT in backend/.env.`);
      process.exit(1);
    }
    throw error;
  });
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Failed to start server";
  console.error(message);
  process.exit(1);
});
