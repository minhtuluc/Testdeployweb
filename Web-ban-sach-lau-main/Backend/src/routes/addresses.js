const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const authMiddleware = require("../middlewares/auth");

// GET /addresses
router.get("/", authMiddleware(), async (req, res) => {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", req.user.id);

  if (error) return res.status(400).json({ message: error.message });
  res.json(data);
});

// POST /addresses
router.post("/", authMiddleware(), async (req, res) => {
  const { full_name, phone, address, is_default } = req.body;
  if (!full_name || !phone || !address)
    return res.status(400).json({ message: "Missing fields" });

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: req.user.id,
      full_name,
      phone,
      address,
      is_default: !!is_default,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ message: error.message });
  res.json(data);
});

module.exports = router;
