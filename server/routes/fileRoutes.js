// server/routes/fileRoutes.js
const express = require("express");
const multer = require("multer");
const mime = require("mime");
const { supabaseAdmin } = require("../supabase");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const BUCKET = process.env.SUPABASE_PDF_BUCKET; // e.g. marcan-pdfs

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (Number(process.env.MAX_PDF_MB || 10)) * 1024 * 1024 },
});

// POST /api/files/upload  (returns { fileUrl, path })
router.post("/upload", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const isPdf =
      req.file.mimetype === "application/pdf" ||
      mime.getType(req.file.originalname) === "application/pdf";
    if (!isPdf) return res.status(400).json({ error: "Only PDF files are allowed" });

    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ error: "listingId is required" });

    const userId = req.user.uid;
    const safeName = req.file.originalname.replace(/\s+/g, "_");
    const key = `${userId}/${listingId}/${Date.now()}-${safeName}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(key, req.file.buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadErr) return res.status(500).json({ error: uploadErr.message });

    // Public URL (works only if bucket is Public)
    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(key);
    const fileUrl = data.publicUrl; // <- store this in your DB

    return res.json({ fileUrl, path: key });
  } catch (e) {
    console.error("[FILES UPLOAD ERROR]", e);
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;