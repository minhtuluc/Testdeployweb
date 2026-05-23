const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const authMiddleware = require("../middlewares/auth");
const { mapProductImage } = require("../helpers/imageMapper");

// GET /cart
router.get("/", authMiddleware(), async (req, res) => {
  const { data, error } = await supabase
    .from("cart")
    .select(`
      id,
      quantity,
      product_variants (
        id,
        price,
        size,
        color,
        products (
          id,
          name,
          image
        )
      )
    `)
    .eq("user_id", req.user.id);

  if (error) return res.status(400).json({ message: error.message });

  const result = data.map((item) => ({
    ...item,
    product_variants: {
      ...item.product_variants,
      products: mapProductImage(item.product_variants.products),
    },
  }));

  res.json(result);
});

// POST /cart
router.post("/", authMiddleware(), async (req, res) => {
  const { variant_id, quantity } = req.body;

  if (!variant_id || !quantity) {
    return res.status(400).json({ message: "Missing fields" });
  }

  // Nếu đã có thì update số lượng
  const { data: existed } = await supabase
    .from("cart")
    .select("id, quantity")
    .eq("user_id", req.user.id)
    .eq("variant_id", variant_id)
    .single();

  if (existed) {
    await supabase
      .from("cart")
      .update({ quantity: existed.quantity + quantity })
      .eq("id", existed.id);

    return res.json({ message: "Cart updated" });
  }

  await supabase.from("cart").insert({
    user_id: req.user.id,
    variant_id,
    quantity,
  });

  res.json({ message: "Added to cart" });
});

// PUT /cart/:id
router.put("/:id", authMiddleware(), async (req, res) => {
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: "Invalid quantity" });
  }

  await supabase
    .from("cart")
    .update({ quantity })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);

  res.json({ message: "Cart updated" });
});

// DELETE /cart/:id
router.delete("/:id", authMiddleware(), async (req, res) => {
  await supabase
    .from("cart")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);

  res.json({ message: "Removed from cart" });
});

module.exports = router;
