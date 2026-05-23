const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const authMiddleware = require("../middlewares/auth");
const { SUPABASE_IMAGE_BASE } = require("../config/constants");

// GET /chat/messages/:productId - Lấy lịch sử tin nhắn
router.get("/messages/:productId", authMiddleware(), async (req, res) => {
  try {
    const { productId } = req.params;

    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        id, message, created_at, sender_id,
        users!sender_id (name, avatar)
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const { data: product } = await supabase
      .from("products")
      .select("shops(name, owner_id)")
      .eq("id", productId)
      .single();

    const shopOwnerId = product?.shops?.owner_id || null;
    const shopName = product?.shops?.name || "Cửa hàng";

    const formatted = messages.map((m) => ({
      _id: m.id,
      text: m.message,
      createdAt: m.created_at,
      user: {
        _id: m.sender_id,
        name: m.users?.name || (m.sender_id === shopOwnerId ? shopName : "Khách hàng"),
        avatar: m.users?.avatar || null,
      },
    }));

    res.json(formatted);
  } catch (err) {
    console.error("GET CHAT MESSAGES ERROR:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// POST /chat/send - Gửi tin nhắn
router.post("/send", authMiddleware(), async (req, res) => {
  try {
    const { product_id, message } = req.body;
    const sender_id = req.user.id;

    if (!product_id || !message?.trim()) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    const { data: product } = await supabase
      .from("products")
      .select("id, shops(name, owner_id)")
      .eq("id", product_id)
      .single();

    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    const { data: newMsg, error } = await supabase
      .from("messages")
      .insert({
        product_id,
        sender_id,
        message: message.trim(),
      })
      .select(`
        id, message, created_at, sender_id,
        users!sender_id (name, avatar)
      `)
      .single();

    if (error) throw error;

    const shopOwnerId = product.shops.owner_id;
    const shopName = product.shops.name;

    const formatted = {
      _id: newMsg.id,
      text: newMsg.message,
      createdAt: newMsg.created_at,
      user: {
        _id: newMsg.sender_id,
        name: newMsg.users?.name || (newMsg.sender_id === shopOwnerId ? shopName : "Khách hàng"),
        avatar: newMsg.users?.avatar || null,
      },
    };

    res.json({ success: true, message: formatted });
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    res.status(500).json({ message: "Lỗi gửi tin nhắn" });
  }
});

// GET /chat/list - Danh sách chat
router.get("/list", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user.id;

    // Lấy product_id mà user đã gửi tin
    const { data: sentMessages, error: sentError } = await supabase
      .from("messages")
      .select("product_id")
      .eq("sender_id", userId);

    if (sentError) throw sentError;

    // Lấy product_id mà user là seller
    const { data: ownedShops } = await supabase
      .from("shops")
      .select("id")
      .eq("owner_id", userId);

    let ownedProductIds = [];
    if (ownedShops && ownedShops.length > 0) {
      const shopIds = ownedShops.map((s) => s.id);
      const { data: ownedProducts } = await supabase
        .from("products")
        .select("id")
        .in("shop_id", shopIds);

      ownedProductIds = ownedProducts ? ownedProducts.map((p) => p.id) : [];
    }

    // Gộp tất cả product_id duy nhất
    const sentProductIds = sentMessages ? sentMessages.map((m) => m.product_id) : [];
    const allProductIds = [...new Set([...sentProductIds, ...ownedProductIds])];

    if (allProductIds.length === 0) {
      return res.json([]);
    }

    // Lấy tin nhắn mới nhất cho từng product
    const { data: latestMessages, error: latestError } = await supabase
      .from("messages")
      .select(`
        product_id, created_at,
        products!inner (
          id, name, image,
          shops!inner ( id, name, owner_id )
        )
      `)
      .in("product_id", allProductIds)
      .order("created_at", { ascending: false });

    if (latestError) throw latestError;

    // Group và lấy tin nhắn mới nhất cho mỗi product
    const chatMap = new Map();

    latestMessages.forEach((msg) => {
      const p = msg.products;
      const shop = p.shops;
      const key = p.id;

      if (!chatMap.has(key)) {
        chatMap.set(key, {
          product_id: p.id,
          product_name: p.name,
          product_image: p.image 
            ? (p.image.startsWith('http') ? p.image : `${SUPABASE_IMAGE_BASE}${p.image}`) 
            : null,
          shop_name: shop.name,
          seller_id: shop.owner_id,
          partner_name: shop.owner_id === userId ? "Khách hàng" : shop.name,
          last_message_at: msg.created_at,
        });
      }
    });

    const chatList = Array.from(chatMap.values()).sort(
      (a, b) => new Date(b.last_message_at) - new Date(a.last_message_at)
    );

    res.json(chatList);
  } catch (err) {
    console.error("GET CHAT LIST ERROR:", err);
    res.status(500).json({ message: "Lỗi tải danh sách chat" });
  }
});

/* ======================= CSKH LIVE CHAT REAL-TIME APIs ======================= */

// GET /chat/support/sessions - (CSKH / Admin) Lấy danh sách hội thoại của các khách hàng với CSKH
router.get("/support/sessions", authMiddleware(["admin", "cskh"]), async (req, res) => {
  try {
    // 1. Lấy toàn bộ tin nhắn chat để phân tích session
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 2. Gom nhóm theo customer_id
    const userIds = [...new Set(messages.flatMap(m => [m.sender_id, m.receiver_id]).filter(Boolean))];
    if (userIds.length === 0) return res.json([]);

    // Lấy thông tin role của các user này
    const { data: users } = await supabase
      .from("users")
      .select("id, name, avatar, role")
      .in("id", userIds);

    const userMap = {};
    if (users) {
      users.forEach(u => {
        userMap[u.id] = u;
      });
    }

    const sessionsMap = {};

    messages.forEach(msg => {
      // Xác định ai là khách hàng trong cặp sender-receiver
      const sender = userMap[msg.sender_id];
      const receiver = userMap[msg.receiver_id];

      let customer = null;
      if (!msg.receiver_id) {
        customer = sender;
      } else {
        if (sender && (sender.role === "admin" || sender.role === "cskh")) {
          customer = receiver;
        } else {
          customer = sender;
        }
      }

      if (!customer) return;

      if (!sessionsMap[customer.id]) {
        let finalAvatar = null;
        if (customer.avatar) {
          finalAvatar = customer.avatar.startsWith('http') 
            ? customer.avatar 
            : `${SUPABASE_IMAGE_BASE}${customer.avatar}`;
        }

        sessionsMap[customer.id] = {
          customer_id: customer.id,
          customer_name: customer.name || "Khách hàng",
          customer_avatar: finalAvatar,
          last_message: msg.message,
          last_message_at: msg.created_at,
          unread_count: 0
        };
      }

      // Đếm tin nhắn chưa đọc gửi từ khách hàng tới CSKH
      if (!msg.is_read && msg.sender_id === customer.id) {
        sessionsMap[customer.id].unread_count += 1;
      }
    });

    const sessionList = Object.values(sessionsMap).sort(
      (a, b) => new Date(b.last_message_at) - new Date(a.last_message_at)
    );

    res.json(sessionList);
  } catch (err) {
    console.error("GET SUPPORT SESSIONS ERROR:", err);
    res.status(500).json({ message: "Lỗi tải danh sách hội thoại" });
  }
});

// GET /chat/support/messages/:userId - Lấy chi tiết lịch sử tin nhắn
router.get("/support/messages/:userId", authMiddleware(), async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    // Chỉ cho phép chính khách hàng đó hoặc CSKH/Admin xem tin nhắn
    if (currentUserRole !== "admin" && currentUserRole !== "cskh" && currentUserId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Lấy tin nhắn giữa khách hàng (userId) và CSKH
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select(`
        id,
        sender_id,
        receiver_id,
        message,
        is_read,
        created_at
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Lọc tin nhắn để chỉ lấy các tin nhắn mà userId đóng vai trò là client:
    // - Tin nhắn gửi đến userId (receiver_id === userId)
    // - Tin nhắn gửi từ userId đến support (sender_id === userId và receiver_id là null)
    const clientMessages = messages.filter(m => 
      m.receiver_id === userId || (m.sender_id === userId && !m.receiver_id)
    );

    // Đánh dấu tin nhắn đã đọc nếu CSKH hoặc Khách hàng mở box chat
    const unreadMessages = clientMessages.filter(m => !m.is_read && m.sender_id !== currentUserId);
    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map(m => m.id);
      await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .in("id", unreadIds);
    }

    res.json(clientMessages);
  } catch (err) {
    console.error("GET SUPPORT MESSAGES ERROR:", err);
    res.status(500).json({ message: "Lỗi tải nội dung tin nhắn" });
  }
});

// POST /chat/support/send - Gửi tin nhắn hỗ trợ mới
router.post("/support/send", authMiddleware(), async (req, res) => {
  try {
    const { receiver_id, message } = req.body;
    const sender_id = req.user.id;
    const sender_role = req.user.role;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Tin nhắn không được để trống" });
    }

    let finalReceiverId = receiver_id || null;

    // Cho phép tất cả tài khoản gửi tin nhắn đến Support (receiver_id = null)

    const { data: newMsg, error } = await supabase
      .from("chat_messages")
      .insert({
        sender_id,
        receiver_id: finalReceiverId,
        message: message.trim(),
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, message: newMsg });
  } catch (err) {
    console.error("SEND SUPPORT MESSAGE ERROR:", err);
    res.status(500).json({ message: "Gửi tin nhắn hỗ trợ thất bại" });
  }
});

module.exports = router;
