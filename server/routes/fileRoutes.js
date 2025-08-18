const express = require("express");
const multer = require("multer");
const mime = require("mime");
const { supabaseAdmin } = require("../supabase");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const BUCKET = process.env.SUPABASE_PDF_BUCKET;              // e.g. marcan-pdfs (public)
const MAX_MB = Number(process.env.MAX_PDF_MB || 20);         // keep in sync with bucket & client

// Allowed types
const ALLOWED_EXT = new Set(["pdf", "doc", "docx", "xls", "xlsx"]);
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

// POST /api/files/upload  -> { fileUrl, path }
router.post("/upload", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const ext = (req.file.originalname.split(".").pop() || "").toLowerCase();
    const guessed = mime.getType(req.file.originalname) || req.file.mimetype || "";
    if (!ALLOWED_EXT.has(ext) && !ALLOWED_MIME.has(guessed)) {
      return res.status(400).json({ error: "Only PDF, DOC, DOCX, XLS, XLSX allowed" });
    }

    const contentType = mime.getType(req.file.originalname) || req.file.mimetype || "application/octet-stream";
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ error: "listingId is required" });

    const userId = req.user.uid;
    const safeName = req.file.originalname.replace(/\s+/g, "_");
    const key = `${userId}/${listingId}/${Date.now()}-${safeName}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(key, req.file.buffer, { contentType, upsert: false });

    if (uploadErr) {
      const msg = uploadErr.message || "Upload failed";
      if (/exceeded the maximum allowed size/i.test(msg)) {
        return res.status(413).json({ error: `File too large. Max ${MAX_MB}MB` });
      }
      return res.status(500).json({ error: msg });
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(key);
    const fileUrl = data.publicUrl; // store this in DB

    return res.json({ fileUrl, path: key });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;