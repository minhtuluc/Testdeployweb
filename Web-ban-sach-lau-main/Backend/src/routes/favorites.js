const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const authMiddleware = require("../middlewares/auth");
const { mapProductImage } = require("../helpers/imageMapper");

// GET /favorites/:productId - Kiểm tra 1 sản phẩm có được yêu thích không
router.get("/:productId", authMiddleware(), async (req, res) => {
  const { productId } = req.params;

  const { data } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", req.user.id)
    .eq("product_id", productId)
    .single();

  res.json({ isFavorite: !!data });
});

// POST /favorites/toggle - Toggle yêu thích
router.post("/toggle", authMiddleware(), async (req, res) => {
  const { product_id } = req.body;

  if (!product_id) {
    return res.status(400).json({ message: "Missing product_id" });
  }

  const { data: existed } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", req.user.id)
    .eq("product_id", product_id)
    .single();

  if (existed) {
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", req.user.id)
      .eq("product_id", product_id);

    return res.json({ favorite: false });
  }

  await supabase.from("favorites").insert({
    user_id: req.user.id,
    product_id,
  });

  res.json({ favorite: true });
});

// GET /favorites - Danh sách yêu thích
router.get("/", authMiddleware(), async (req, res) => {
  const { data, error } = await supabase
    .from("favorites")
    .select(`
      product_id,
      products (
        id,
        name,
        image,
        price
      )
    `)
    .eq("user_id", req.user.id);

  if (error) return res.status(400).json({ message: error.message });

  res.json(data.map((f) => mapProductImage(f.products)));
});

module.exports = router;
