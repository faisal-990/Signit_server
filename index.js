const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo");
const path = require("path"); // Make sure this is imported
require("dotenv").config();
console.log("Loaded CLIENT_URL:", process.env.CLIENT_URL);
const connectDB = require("./utils/db");

require("./utils/passport");

const app = express();
const PORT = process.env.PORT || 5000;

const isProduction = process.env.NODE_ENV === "production";
console.log(`Running in ${isProduction ? "production" : "development"} mode`);

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

// ============================================================
// 🚨 FIX 1: USE ABSOLUTE PATH FOR UPLOADS 🚨
// This ensures we look in the exact folder where the file was saved
// ============================================================
const uploadsPath = path.join(__dirname, "uploads");
console.log("Serving static files from:", uploadsPath); // Debug log

app.use(
  "/uploads",
  cors({ origin: process.env.CLIENT_URL, credentials: true }),
);
app.use("/uploads", express.static(uploadsPath));
// ============================================================

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
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

app.use(passport.initialize());
app.use(passport.session());

// ============================================================
// 🚨 BYPASS MIDDLEWARE 🚨
// ============================================================
app.use((req, res, next) => {
  // Only log if it's NOT a static file request (cleanup logs)
  if (!req.path.startsWith("/uploads")) {
    console.log(`[Bypass] Injecting Demo User for route: ${req.path}`);
  }

  req.user = {
    _id: "65e1234567890abcdef12345",
    displayName: "Demo User",
    email: "demo@example.com",
    googleId: "demo_google_id",
  };
  req.isAuthenticated = () => true;
  next();
});

// --- ROUTES ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 🚨 FIX 2: ADD DEBUG ROUTE TO CHECK FILES 🚨
// Call this in your browser: https://your-backend.onrender.com/api/debug/files
app.get("/api/debug/files", (req, res) => {
  const fs = require("fs");
  try {
    if (fs.existsSync(uploadsPath)) {
      const files = fs.readdirSync(uploadsPath);
      res.json({ path: uploadsPath, fileCount: files.length, files });
    } else {
      res.json({
        path: uploadsPath,
        error: "Uploads directory does not exist",
      });
    }
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/docs", require("./routes/docs"));
app.use("/api/signatures", require("./routes/signatures"));
app.use("/api/audit", require("./routes/audit"));
app.use("/api/signature-request", require("./routes/signatureRequest"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
