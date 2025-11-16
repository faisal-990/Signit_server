const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo");
require("dotenv").config();
console.log("Loaded CLIENT_URL:", process.env.CLIENT_URL);
const connectDB = require("./utils/db");

require("./utils/passport"); //

const app = express();
const PORT = process.env.PORT || 5000;

// --- DYNAMIC ENVIRONMENT CHECK ---
// This checks for the 'NODE_ENV' variable you just added
const isProduction = process.env.NODE_ENV === "production";
console.log(`Running in ${isProduction ? "production" : "development"} mode`);

connectDB(); //

// --- PRODUCTION-ONLY SETTING ---
// Trust Render's proxy to handle HTTPS correctly
if (isProduction) {
  app.set("trust proxy", 1); //
}

app.use(
  cors({
    origin: process.env.CLIENT_URL, // Your Vercel URL
    credentials: true,
  }),
); //

app.use(express.json()); //
app.use(express.urlencoded({ extended: true })); //
app.use(
  "/uploads",
  cors({ origin: process.env.CLIENT_URL, credentials: true }),
); //
app.use("/uploads", express.static("uploads")); //

// --- DYNAMIC SESSION CONFIGURATION ---
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }), //
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
};

if (isProduction) {
  sessionConfig.cookie.secure = true; // MUST be true for cross-domain (HTTPS)
  sessionConfig.cookie.sameSite = "none"; // Allows Vercel <-> Render cookies
} else {
  // Use non-secure settings for http://localhost development
  sessionConfig.cookie.secure = false;
  sessionConfig.cookie.sameSite = "lax";
}

app.use(session(sessionConfig));
// --- END DYNAMIC CONFIG ---

app.use(passport.initialize()); //
app.use(passport.session()); //

// --- ROUTES ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", require("./routes/auth")); //
app.use("/api/upload", require("./routes/upload")); //
app.use("/api/docs", require("./routes/docs")); //
app.use("/api/signatures", require("./routes/signatures")); //
app.use("/api/audit", require("./routes/audit")); //
app.use("/api/signature-request", require("./routes/signatureRequest")); //

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
