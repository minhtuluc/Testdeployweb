const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const authMiddleware = require("../middlewares/auth");

// GET /reviews/:productId - Danh sách đánh giá của 1 sản phẩm
router.get("/:productId", async (req, res) => {
  const { productId } = req.params;
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        comment,
        user_id,
        users (name, avatar)
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cannot get reviews" });
  }
});

// POST /reviews - Gửi đánh giá
router.post("/", authMiddleware(), async (req, res) => {
  try {
    const { product_id, order_id, rating, comment } = req.body;

    if (!product_id || !order_id || !rating || !comment) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        user_id: req.user.id,
        product_id,
        order_id,
        rating,
        comment,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });

    res.json({ message: "Review submitted", review: data });
  } catch (err) {
    console.error("REVIEW ERROR:", err);
    res.status(500).json({ message: "Cannot submit review" });
  }
});

module.exports = router;
