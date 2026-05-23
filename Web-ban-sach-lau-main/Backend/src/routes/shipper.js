const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const authMiddleware = require("../middlewares/auth");

// Cổng bảo vệ: Chỉ cho phép shipper hoặc admin truy cập các API này
const shipperAuth = authMiddleware(["shipper", "admin"]);

/**
 * GET /shipper/orders/pending
 * Lấy danh sách các đơn hàng đang ở trạng thái Chờ xử lý (pending) và chưa có shipper nào nhận giao
 */
router.get("/orders/pending", shipperAuth, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        users!orders_user_id_fkey (
          name,
          phone
        ),
        addresses (
          full_name,
          phone,
          address
        ),
        payments (
          status,
          payment_method
        )
      `)
      .eq("status", "pending")
      .is("shipper_id", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formattedOrders = (orders || []).map(order => ({
      ...order,
      total_price: order.total_amount,
      payment_status: order.payments?.[0]?.status || "pending"
    }));

    res.json(formattedOrders);
  } catch (err) {
    console.error("GET PENDING ORDERS ERROR:", err);
    res.status(500).json({ message: "Lỗi lấy danh sách đơn hàng chờ nhận" });
  }
});

/**
 * GET /shipper/orders/my-deliveries
 * Lấy danh sách các đơn hàng shipper hiện tại đang nhận đi giao (status = 'shipped')
 */
router.get("/orders/my-deliveries", shipperAuth, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        users!orders_user_id_fkey (
          name,
          phone
        ),
        addresses (
          full_name,
          phone,
          address
        ),
        payments (
          status,
          payment_method
        )
      `)
      .eq("shipper_id", req.user.id)
      .eq("status", "shipped")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formattedOrders = (orders || []).map(order => ({
      ...order,
      total_price: order.total_amount,
      payment_status: order.payments?.[0]?.status || "pending"
    }));

    res.json(formattedOrders);
  } catch (err) {
    console.error("GET MY DELIVERIES ERROR:", err);
    res.status(500).json({ message: "Lỗi lấy danh sách đơn hàng đang giao" });
  }
});

/**
 * PUT /shipper/orders/:id/claim
 * Shipper bấm nhận giao đơn hàng
 */
router.put("/orders/:id/claim", shipperAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Kiểm tra đơn hàng xem đã có shipper nào khác nhận trước chưa
    const { data: currentOrder, error: checkErr } = await supabase
      .from("orders")
      .select("shipper_id, status")
      .eq("id", id)
      .single();

    if (checkErr || !currentOrder) {
      return res.status(442).json({ message: "Đơn hàng không tồn tại" });
    }

    if (currentOrder.shipper_id) {
      return res.status(400).json({ message: "Đơn hàng này đã có shipper khác nhận giao từ trước" });
    }

    // 2. Nhận giao đơn hàng
    const { data: updatedOrder, error: updateErr } = await supabase
      .from("orders")
      .update({
        shipper_id: req.user.id,
        status: "shipped"
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({
      message: "Nhận giao đơn hàng thành công!",
      order: updatedOrder
    });
  } catch (err) {
    console.error("CLAIM ORDER ERROR:", err);
    res.status(500).json({ message: "Nhận đơn hàng thất bại" });
  }
});

/**
 * PUT /shipper/orders/:id/complete
 * Shipper xác nhận đã giao hàng thành công
 */
router.put("/orders/:id/complete", shipperAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Kiểm tra quyền sở hữu đơn hàng của shipper
    const { data: currentOrder, error: checkErr } = await supabase
      .from("orders")
      .select("shipper_id, status")
      .eq("id", id)
      .single();

    if (checkErr || !currentOrder) {
      return res.status(442).json({ message: "Đơn hàng không tồn tại" });
    }

    if (currentOrder.shipper_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền xử lý đơn hàng này" });
    }

    // 2. Đánh dấu giao thành công
    const { data: updatedOrder, error: updateErr } = await supabase
      .from("orders")
      .update({
        status: "completed"
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 3. Cập nhật trạng thái thanh toán tương ứng ở bảng payments
    await supabase
      .from("payments")
      .update({ status: "completed" })
      .eq("order_id", id);

    res.json({
      message: "Đơn hàng đã được đánh dấu giao thành công!",
      order: updatedOrder
    });
  } catch (err) {
    console.error("COMPLETE ORDER ERROR:", err);
    res.status(500).json({ message: "Không thể hoàn thành đơn hàng" });
  }
});

module.exports = router;
