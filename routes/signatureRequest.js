const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const SignatureRequest = require("../models/SignatureRequest");
const Document = require("../models/Document");
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {
  const { documentId, recipientEmail } = req.body;

  // Use our bypass user if req.user is missing
  const senderEmail = req.user ? req.user.email : "demo@signit.com";

  if (!documentId || !recipientEmail)
    return res.status(400).json({ error: "Missing data" });

  const token = crypto.randomBytes(32).toString("hex");

  try {
    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const request = await SignatureRequest.create({
      document: documentId,
      recipientEmail,
      token,
    });

    const link = `${process.env.CLIENT_URL}/sign/${token}`;

    console.log("---------------------------------------------------");
    console.log("📧 [DEMO EMAIL SYSTEM]");
    console.log(`To: ${recipientEmail}`);
    console.log(`Subject: Please sign ${doc.name}`);
    console.log(`🔗 SIGNING LINK: ${link}`);
    console.log("---------------------------------------------------");

    // Try to send real email (Will likely fail without App Password)
    try {
      if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
          },
        });
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: recipientEmail,
          subject: "Please sign the document",
          html: `<p>Please sign: <a href="${link}">${link}</a></p>`,
        });
      }
    } catch (emailErr) {
      console.log(
        "⚠️ Email failed to send (expected in demo). Use the link above.",
      );
    }

    // Return success regardless of email status because we logged the link
    res.json({ success: true, request, debugLink: link });
  } catch (err) {
    console.error("Signature Request Error:", err);
    res.status(500).json({ error: "Failed to create request" });
  }
});

// GET /api/signature-request/:token
router.get("/:token", async (req, res) => {
  try {
    const request = await SignatureRequest.findOne({
      token: req.params.token,
    }).populate("document");
    if (!request) return res.status(404).json({ error: "Invalid link" });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch request" });
  }
});

// POST /api/signature-request/:token/sign
router.post("/:token/sign", async (req, res) => {
  try {
    const request = await SignatureRequest.findOne({ token: req.params.token });
    if (!request) return res.status(404).json({ error: "Invalid link" });

    request.status = "signed";
    request.signedAt = new Date();
    request.signatureData = req.body.signatureData;
    await request.save();

    await Document.findByIdAndUpdate(request.document, { status: "signed" });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save signature" });
  }
});

module.exports = router;

