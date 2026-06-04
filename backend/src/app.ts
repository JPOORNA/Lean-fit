import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { routes } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin: env.corsOrigin,
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(rateLimit({
  windowMs: 10 * 60 * 1000,
  max: env.nodeEnv === "production" ? 1000 : 10000,
  message: { message: "Too many requests, please try again later." }
}));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/docs.json", (_req, res) => {
  res.json(swaggerSpec);
});

app.use("/api", routes);
app.use(errorHandler);

export { app };
