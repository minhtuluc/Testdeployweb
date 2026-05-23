const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const authMiddleware = require("../middlewares/auth");

/* ======================= HELPERS & MAPPERS ======================= */
// Ánh xạ các trường DB (min_order_value, expiry_date) sang trường Frontend mong muốn (min_order, expired_at)
const mapVoucherToFrontend = (v) => {
  if (!v) return v;
  return {
    ...v,
    min_order: v.min_order_value,
    expired_at: v.expiry_date,
  };
};

const mapVouchersToFrontend = (list = []) => list.map(mapVoucherToFrontend);

/* ======================= PUBLIC VOUCHER ROUTES ======================= */

// GET /vouchers/list (PUBLIC)
router.get("/list", async (req, res) => {
  try {
    const { data: vouchers, error } = await supabase
      .from("vouchers")
      .select("*")
      .order("id", { ascending: false }); // Sử dụng id thay vì created_at (vì DB không có cột created_at)

    if (error) throw error;
    
    // Lọc các voucher còn hạn sử dụng
    const activeVouchers = (vouchers || []).filter(v => new Date(v.expiry_date) >= new Date());
    res.json(mapVouchersToFrontend(activeVouchers));
  } catch (err) {
    console.error("GET VOUCHERS LIST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ======================= ADMIN VOUCHER ROUTES ======================= */

// GET /admin/vouchers
router.get("/", authMiddleware(["admin"]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .order("id", { ascending: false }); // Sử dụng id thay vì created_at

    if (error) throw error;
    res.json(mapVouchersToFrontend(data));
  } catch (err) {
    console.error("GET VOUCHERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /admin/vouchers
router.post("/", authMiddleware(["admin"]), async (req, res) => {
  try {
    const { code, discount_percent, max_discount, min_order, expired_at } = req.body;

    if (!code || !discount_percent || !expired_at) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    if (discount_percent < 1 || discount_percent > 100) {
      return res.status(400).json({ message: "Phần trăm giảm phải từ 1 đến 100" });
    }

    const { data: existed } = await supabase
      .from("vouchers")
      .select("id")
      .eq("code", code.toUpperCase())
      .maybeSingle(); // Tránh lỗi if not found

    if (existed) {
      return res.status(400).json({ message: "Mã voucher đã tồn tại" });
    }

    const { data, error } = await supabase
      .from("vouchers")
      .insert({
        code: code.toUpperCase(),
        discount_percent,
        max_discount: max_discount ? Number(max_discount) : null,
        min_order_value: min_order ? Number(min_order) : null, // Mapped to DB column min_order_value
        expiry_date: expired_at,                             // Mapped to DB column expiry_date
      })
      .select()
      .single();

    if (error) throw error;
    res.json(mapVoucherToFrontend(data));
  } catch (err) {
    console.error("CREATE VOUCHER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /admin/vouchers/:id
router.put("/:id", authMiddleware(["admin"]), async (req, res) => {
  try {
    const { code, discount_percent, max_discount, min_order, expired_at } = req.body;

    const updateObj = {};
    if (code) updateObj.code = code.toUpperCase();
    if (discount_percent) updateObj.discount_percent = discount_percent;
    if (max_discount !== undefined) updateObj.max_discount = max_discount ? Number(max_discount) : null;
    if (min_order !== undefined) updateObj.min_order_value = min_order ? Number(min_order) : null;
    if (expired_at) updateObj.expiry_date = expired_at;

    const { data, error } = await supabase
      .from("vouchers")
      .update(updateObj)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(mapVoucherToFrontend(data));
  } catch (err) {
    console.error("UPDATE VOUCHER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /admin/vouchers/:id
router.delete("/:id", authMiddleware(["admin"]), async (req, res) => {
  try {
    const { error } = await supabase.from("vouchers").delete().eq("id", req.params.id);

    if (error) throw error;
    res.json({ message: "Voucher deleted" });
  } catch (err) {
    console.error("DELETE VOUCHER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ======================= APPLY VOUCHER (PUBLIC) ======================= */
// POST /vouchers/apply
router.post("/apply", authMiddleware(), async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || subtotal == null) {
      return res.status(400).json({ message: "Thiếu mã hoặc tổng tiền" });
    }

    const { data: voucher, error } = await supabase
      .from("vouchers")
      .select("*")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (error || !voucher) {
      return res.status(404).json({ message: "Voucher không tồn tại" });
    }

    if (new Date(voucher.expiry_date) < new Date()) {
      return res.status(400).json({ message: "Voucher đã hết hạn" });
    }

    if (voucher.min_order_value && subtotal < voucher.min_order_value) {
      return res.status(400).json({
        message: `Đơn hàng cần tối thiểu ${voucher.min_order_value.toLocaleString()}₫ để dùng voucher này`,
      });
    }

    let discount = (subtotal * voucher.discount_percent) / 100;
    if (voucher.max_discount && discount > voucher.max_discount) {
      discount = voucher.max_discount;
    }

    res.json({
      voucher: mapVoucherToFrontend(voucher),
      discount_amount: Math.floor(discount),
    });
  } catch (err) {
    console.error("APPLY VOUCHER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
