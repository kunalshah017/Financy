import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { connectDB } from "./server/config/database";
import { connectOllama } from "./server/config/ollama";

import whatsappRoutes from "./server/routes/whatsapp-messages.routes";

const app = new Hono();

// ---------- Server Configuration ----------

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
    credentials: true,
  })
);

app.use("*", prettyJSON());

await connectDB();

await connectOllama();

// -------------------------------------------

// ---------- Routes Configuration -----------

app.route("/api/whatsapp", whatsappRoutes);

// -------------------------------------------

export default {
  port: Bun.env.PORT || 3000,
  fetch: app.fetch,
};
