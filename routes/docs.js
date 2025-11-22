const express = require("express");
const Document = require("../models/Document");
const User = require("../models/User");
const router = express.Router();

// --- UPDATED AUTH MIDDLEWARE ---
// This works with BOTH real Passport auth AND our Bypass User
function requireAuth(req, res, next) {
  // Check if passport found a user OR if our bypass injected one
  if (req.user) {
    return next();
  }

  console.log("Auth failed in docs.js. Req.user is:", req.user);
  return res.status(401).json({ error: "Unauthorized - No User Found" });
}

// POST /api/docs/upload (metadata after file upload)
router.post("/upload", requireAuth, async (req, res) => {
  console.log("Saving doc metadata for user:", req.user._id); // Debug log

  const { name, url } = req.body;
  if (!name || !url)
    return res.status(400).json({ error: "Missing name or url" });

  try {
    // Create the document in MongoDB
    const doc = await Document.create({
      owner: req.user._id, // This uses the hardcoded ID from index.js
      name,
      url,
      status: "pending",
    });

    console.log("Document saved:", doc._id);
    res.json(doc);
  } catch (err) {
    console.error("Error saving document:", err);
    res.status(500).json({ error: "Failed to save document" });
  }
});

// GET /api/docs/ (list all docs for user)
router.get("/", requireAuth, async (req, res) => {
  try {
    const docs = await Document.find({ owner: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// GET /api/docs/:id (fetch single doc)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

module.exports = router;

