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
const isProduction = process.env.NODE_ENV === "production";
console.log(`Running in ${isProduction ? "production" : "development"} mode`);

connectDB(); //

// --- PRODUCTION-ONLY SETTING ---
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
  sessionConfig.cookie.secure = true;
  sessionConfig.cookie.sameSite = "none";
} else {
  sessionConfig.cookie.secure = false;
  sessionConfig.cookie.sameSite = "lax";
}

app.use(session(sessionConfig));
// --- END DYNAMIC CONFIG ---

app.use(passport.initialize()); //
app.use(passport.session()); //

// ==================================================================
// --- BYPASS AUTH MIDDLEWARE (Start) ---
// This forces the server to believe a user is always logged in.
app.use((req, res, next) => {
  req.user = {
    _id: "65e1234567890abcdef12345", // Hardcoded ID (must be valid length for Mongo)
    displayName: "Demo User",
    email: "demo@example.com",
    googleId: "demo_google_id",
    photo: "https://ui-avatars.com/api/?name=Demo+User&background=random",
  };
  // Mock the isAuthenticated function
  req.isAuthenticated = () => true;
  next();
});
// --- BYPASS AUTH MIDDLEWARE (End) ---
// ==================================================================

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
