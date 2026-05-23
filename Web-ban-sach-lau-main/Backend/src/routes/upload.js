const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const authMiddleware = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const { BUCKET } = require("../config/constants");

// POST /init-storage - Tạo bucket nếu chưa có
router.post("/init-storage", async (req, res) => {
  const { data, error } = await supabase.storage.from(BUCKET).createBucket();
  if (error && error.message !== "Bucket already exists") console.error(error);
  res.json({ message: "Storage ready" });
});

// POST /upload - Upload ảnh sản phẩm
router.post("/", authMiddleware(), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file received by server" });
    }

    const path = `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, "_")}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ message: "Upload failed", details: error.message });
    }

    res.json({ path });
  } catch (err) {
    console.error("CRASH IN UPLOAD ROUTE:", err);
    res.status(500).json({ message: "Server crash" });
  }
});

module.exports = router;
