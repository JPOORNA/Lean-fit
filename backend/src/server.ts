import { app } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";

const start = async () => {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
