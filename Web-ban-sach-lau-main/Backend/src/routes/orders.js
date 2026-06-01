const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const authMiddleware = require("../middlewares/auth");
const { PLATFORM_FEE_PERCENT } = require("../config/constants");

// GET /orders - Danh sách đơn hàng của customer
router.get("/", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        id,
        created_at,
        status,
        total_price: total_amount,
        address_id,
        addresses (
          full_name,
          phone,
          address
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(orders || []);
  } catch (err) {
    console.error("GET CUSTOMER ORDERS ERROR:", err);
    res.status(500).json({ message: "Không thể tải đơn hàng" });
  }
});

// GET /orders/:id - Chi tiết đơn hàng
router.get("/:id", authMiddleware(), async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  const { data: items } = await supabase
    .from("order_items")
    .select(`
      id,
      variant_id,
      product_id,
      price,
      quantity,
      product_variants (
        size,
        color
      ),
      products (
        name
      )
    `)
    .eq("order_id", orderId);

  // Check reviewed
  const itemsWithReview = items ? await Promise.all(
    items.map(async (i) => {
      const productId = i.product_id;
      const productName = i.products?.name || "Sản phẩm";
      const size = i.product_variants?.size || null;
      const color = i.product_variants?.color || null;

      const { data: review } = await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .eq("order_id", orderId)
        .single();

      return {
        id: i.id,
        product_id: productId,
        price: i.price,
        quantity: i.quantity,
        size,
        color,
        product_name: productName,
        reviewed: !!review,
      };
    })
  ) : null;

  if (order) {
    order.total_price = order.total_amount;
  }
  res.json({ order, items: itemsWithReview || [] });
});

// POST /orders/:id/complete - Customer xác nhận hoàn thành
router.post("/:id/complete", authMiddleware(), async (req, res) => {
  try {
    const orderId = req.params.id;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, total_price: total_amount, user_id")
      .eq("id", orderId)
      .eq("user_id", req.user.id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    if (order.status !== "shipped") {
      return res.status(400).json({ message: "Chỉ hoàn thành được đơn đang giao" });
    }

    // Lấy sản phẩm trong đơn để xác định shop
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        quantity,
        price,
        products (
          shop_id
        )
      `)
      .eq("order_id", orderId);

    if (itemsError || !orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "Đơn hàng không có sản phẩm" });
    }

    const shopId = orderItems[0].products?.shop_id;

    if (!shopId) {
      return res.status(400).json({ message: "Không xác định được shop cho sản phẩm" });
    }

    const allSameShop = orderItems.every(
      (item) => item.products?.shop_id === shopId
    );

    if (!allSameShop) {
      return res.status(400).json({ message: "Đơn hàng có sản phẩm từ nhiều shop - chưa hỗ trợ" });
    }

    // Tính phí sàn và doanh thu shop
    const platformFee = order.total_price * PLATFORM_FEE_PERCENT;
    const shopRevenue = order.total_price * (1 - PLATFORM_FEE_PERCENT);

    // Cộng tiền vào balance của shop
    const { error: balanceError } = await supabase.rpc("increment_shop_balance", {
      shop_id_param: shopId,
      amount: shopRevenue,
    });

    if (balanceError) {
      // Fallback: update trực tiếp nếu chưa có RPC function
      const { data: shop, error: getShopError } = await supabase
        .from("shops")
        .select("balance")
        .eq("id", shopId)
        .single();

      if (getShopError) throw getShopError;

      const { error: updateError } = await supabase
        .from("shops")
        .update({ balance: shop.balance + shopRevenue })
        .eq("id", shopId);

      if (updateError) throw updateError;
    }

    // Cập nhật trạng thái đơn
    const { error: statusError } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", orderId);

    if (statusError) throw statusError;

    res.json({
      message: "Đơn hàng hoàn thành! Doanh thu đã được chuyển cho shop",
      shop_revenue: shopRevenue,
      platform_fee: platformFee,
    });
  } catch (err) {
    console.error("COMPLETE ORDER ERROR:", err);
    res.status(500).json({ message: "Lỗi server khi hoàn thành đơn" });
  }
});

// PUT /orders/:id/status - Customer hủy đơn
router.put("/:id/status", authMiddleware(), async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== "cancelled") {
      return res.status(400).json({ message: "Chỉ được hủy đơn" });
    }

    const { data: order } = await supabase
      .from("orders")
      .select("status, user_id")
      .eq("id", req.params.id)
      .single();

    if (order.user_id !== req.user.id) {
      return res.status(403).json({ message: "Không phải đơn hàng của bạn" });
    }

    if (!["pending", "paid"].includes(order.status)) {
      return res.status(400).json({ message: "Chỉ hủy được đơn đang chờ xử lý hoặc đã thanh toán" });
    }

    await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", req.params.id);

    // Cập nhật trạng thái ở bảng payments nếu có liên quan
    await supabase
      .from("payments")
      .update({ status: "cancelled" })
      .eq("order_id", req.params.id);

    res.json({ message: "Đơn hàng đã được hủy" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
