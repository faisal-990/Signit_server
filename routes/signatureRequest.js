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

    // Debug Env Vars (Do not print the password, just check length)
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_PASS;
    console.log(
      `Config Check -> User: ${user ? user : "MISSING"}, Pass: ${pass ? "SET (" + pass.length + " chars)" : "MISSING"}`,
    );

    if (user && pass) {
      console.log("🔄 Connecting to Gmail SMTP...");
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user, pass },
        });

        // Verify connection configuration
        await transporter.verify();
        console.log("✅ SMTP Connection Verified.");

        const info = await transporter.sendMail({
          from: user,
          to: recipientEmail,
          subject: `Please sign: ${doc.name}`,
          html: `<p>Please sign: <a href="${link}">${link}</a></p>`,
        });
        console.log("✅ Email Sent! Message ID:", info.messageId);
      } catch (emailErr) {
        console.error("❌ FATAL EMAIL ERROR:");
        console.error(emailErr); // THIS PRINTS THE FULL ERROR OBJECT

        if (emailErr.response)
          console.error("SMTP Response:", emailErr.response);
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
