const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo");
const path = require("path"); // <--- 1. Import path
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

// ============================================================
// 🚨 THE FIX: Force Absolute Path for Uploads 🚨
// ============================================================
const uploadsPath = path.join(__dirname, "uploads");
console.log("Serving static files from:", uploadsPath);

// Serve files from the absolute path
app.use("/uploads", express.static(uploadsPath));
// ============================================================

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
// 🚨 BYPASS MIDDLEWARE (Must be AFTER static files) 🚨
// ============================================================
app.use((req, res, next) => {
  // If the request starts with /uploads, it means static file failed.
  // We should return 404 here instead of injecting a user.
  if (req.path.startsWith("/uploads")) {
    console.error(`File not found: ${req.path}`);
    return res.status(404).send("File not found");
  }

  console.log(`[Bypass] Injecting Demo User for route: ${req.path}`);
  req.user = {
    _id: "65e1234567890abcdef12345",
    displayName: "Demo User",
    email: "demo@example.com",
  };
  req.isAuthenticated = () => true;
  next();
});

// --- ROUTES ---
app.use("/api/auth", require("./routes/auth"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/docs", require("./routes/docs"));
app.use("/api/signatures", require("./routes/signatures"));
app.use("/api/audit", require("./routes/audit"));
app.use("/api/signature-request", require("./routes/signatureRequest"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
