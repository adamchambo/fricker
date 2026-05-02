import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { historyRouter } from "./routes/history.js";
import { invitesRouter } from "./routes/inviteRoutes.js";
import { meRouter } from "./routes/me.js";
import { profileRouter } from "./routes/profile.js";
import { savedSuggestionsRouter } from "./routes/savedSuggestions.js";
import { socialRouter } from "./routes/social.js";
import { suggestionsRouter } from "./routes/suggestions.js";
import { usersRouter } from "./routes/users.js";

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(
  cors({
    origin: env.allowedOrigins,
    credentials: true,
  }),
);

app.use("/api", healthRouter);
app.use("/api", authRouter);
app.use("/api", meRouter);
app.use("/api", profileRouter);
app.use("/api", usersRouter);
app.use("/api", socialRouter);
app.use("/api", invitesRouter);
app.use("/api", suggestionsRouter);
app.use("/api", historyRouter);
app.use("/api", savedSuggestionsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(env.port, () => {
  console.log(`fricker-api listening on http://localhost:${env.port}`);
  if (env.useMockData) {
    console.warn(
      "[fricker api] USE_MOCK_DATA is on — social, profile, history, saved suggestions, invites, and user search use in-memory fixtures (still uses Firebase Admin for auth).",
    );
  }
});
