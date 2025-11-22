const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo");
require("dotenv").config();
const connectDB = require("./utils/db");
require("./utils/passport");

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

connectDB();

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads folder access
app.use(
  "/uploads",
  cors({ origin: process.env.CLIENT_URL, credentials: true }),
);
app.use("/uploads", express.static("uploads"));

// Session Config
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 },
};

if (isProduction) {
  sessionConfig.cookie.secure = true;
  sessionConfig.cookie.sameSite = "none";
} else {
  sessionConfig.cookie.secure = false;
  sessionConfig.cookie.sameSite = "lax";
}

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// ============================================================
// 🚨 CRITICAL: BYPASS MIDDLEWARE MUST BE HERE 🚨
// BEFORE any routes (api/auth, api/docs, etc.)
// ============================================================
app.use((req, res, next) => {
  console.log(`[Bypass] Injecting Demo User for route: ${req.path}`);

  // This injects the fake user into the request object
  req.user = {
    _id: "65e1234567890abcdef12345", // Must match the ID in your frontend AuthContext
    displayName: "Demo User",
    email: "demo@example.com",
  };

  // This overrides the passport check
  req.isAuthenticated = () => true;

  next();
});
// ============================================================

// --- ROUTES ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// All these routes will now see the Injected User
app.use("/api/auth", require("./routes/auth"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/docs", require("./routes/docs"));
app.use("/api/signatures", require("./routes/signatures"));
app.use("/api/audit", require("./routes/audit"));
app.use("/api/signature-request", require("./routes/signatureRequest"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
