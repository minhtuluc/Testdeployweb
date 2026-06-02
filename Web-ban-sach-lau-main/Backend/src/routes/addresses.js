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

  if (is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", req.user.id);
  }

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

// PUT /addresses/:id
router.put("/:id", authMiddleware(), async (req, res) => {
  const { full_name, phone, address, is_default } = req.body;
  if (!full_name || !phone || !address)
    return res.status(400).json({ message: "Missing fields" });

  if (is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", req.user.id);
  }

  const { data, error } = await supabase
    .from("addresses")
    .update({
      full_name,
      phone,
      address,
      is_default: !!is_default,
    })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ message: error.message });
  res.json(data);
});

// DELETE /addresses/:id
router.delete("/:id", authMiddleware(), async (req, res) => {
  const { data, error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select();

  if (error) return res.status(400).json({ message: error.message });
  res.json({ message: "Address deleted successfully", data });
});

module.exports = router;
