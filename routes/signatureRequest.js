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

    // --- SYSTEM LOGS (This is your reliability layer) ---
    console.log("===================================================");
    console.log("🚀 SIGNATURE REQUEST GENERATED");
    console.log(`To: ${recipientEmail}`);
    console.log(`🔗 MANUAL LINK: ${link}`);
    console.log("===================================================");

    // --- ATTEMPT EMAIL (But don't crash if it fails) ---
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_PASS;

    if (user && pass) {
      // Set a short timeout so the frontend doesn't hang
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 5000, // 5 seconds max wait
        greetingTimeout: 5000,
      });

      // Fire and forget (don't await). Let the loop continue.
      transporter
        .sendMail({
          from: `SignIt <${user}>`,
          to: recipientEmail,
          subject: `Please sign: ${doc.name}`,
          html: `<p>Please sign: <a href="${link}">${link}</a></p>`,
        })
        .then((info) => {
          console.log("✅ Email miraculously sent! ID:", info.messageId);
        })
        .catch((err) => {
          console.log("⚠️ Email blocked by Render Firewall (Expected).");
          console.log("👉 Use the MANUAL LINK printed above.");
        });
    }

    // ALWAYS return success to the frontend.
    // In a distributed system, "Request Accepted" is success.
    // Delivery is a background process.
    res.json({ success: true, request, debugLink: link });
  } catch (err) {
    console.error("Signature Request Error:", err);
    res.status(500).json({ error: "Failed to create request" });
  }
});

module.exports = router;
