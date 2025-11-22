const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const SignatureRequest = require("../models/SignatureRequest");
const Document = require("../models/Document");
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {
  const { documentId, recipientEmail } = req.body;
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

    console.log("===================================================");
    console.log("📧 EMAIL SYSTEM DEBUGGER");
    console.log(`To: ${recipientEmail}`);
    console.log(`Link: ${link}`);

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_PASS;

    if (user && pass) {
      console.log("🔄 Connecting to Gmail (Port 587)...");
      try {
        // FIX: Explicitly use Port 587 to avoid Render firewall blocks
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false, // Must be false for port 587
          auth: { user, pass },
          tls: {
            ciphers: "SSLv3", // Helps with some cloud network handshakes
          },
        });

        const info = await transporter.sendMail({
          from: user,
          to: recipientEmail,
          subject: `Please sign: ${doc.name}`,
          html: `<p>Please sign: <a href="${link}">${link}</a></p>`,
        });
        console.log("✅ Email Sent! Message ID:", info.messageId);
      } catch (emailErr) {
        console.error("❌ EMAIL ERROR:", emailErr.message);
      }
    } else {
      console.log("❌ Skipping Email: GMAIL_USER or GMAIL_PASS missing.");
    }
    console.log("===================================================");

    res.json({ success: true, request, debugLink: link });
  } catch (err) {
    console.error("Signature Request Error:", err);
    res.status(500).json({ error: "Failed to create request" });
  }
});

module.exports = router;
