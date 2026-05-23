const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const { mapProductsImage } = require("../helpers/imageMapper");

// GET /home
router.get("/", async (req, res) => {
  try {
    const { data: parents } = await supabase
      .from("categories")
      .select("*")
      .is("parent_id", null);

    const { data: children } = await supabase
      .from("categories")
      .select("*")
      .not("parent_id", "is", null);

    const categories = parents.map((p) => ({
      ...p,
      children: children.filter((c) => c.parent_id === p.id),
    }));

    const { data: products } = await supabase
      .from("products")
      .select("id, name, price, vip_price, image, category_id, author, publisher, language")
      .order("created_at", { ascending: false });

    const { data: featured } = await supabase
      .from("products")
      .select("id, name, price, vip_price, image, category_id, author, publisher, language")
      .order("created_at", { ascending: false });

    res.json({
      categories,
      products: mapProductsImage(products),
      featured: mapProductsImage(featured),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Home error" });
  }
});

module.exports = router;
