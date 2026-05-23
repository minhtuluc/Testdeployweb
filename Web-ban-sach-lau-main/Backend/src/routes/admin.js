const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const supabase = require("../config/supabase");
const authMiddleware = require("../middlewares/auth");
const { SUPABASE_IMAGE_BASE } = require("../config/constants");
const { mapProductsImage } = require("../helpers/imageMapper");

/* ======================= DASHBOARD ======================= */
router.get("/dashboard", authMiddleware(["admin", "seller"]), async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const userId = req.user.id;

    if (isAdmin) {
      const [
        { count: totalUsers },
        { count: totalProducts },
        { count: totalOrders },
        { data: todayOrders },
        { data: completedOrdersData },
        { data: pendingOrdersData },
      ] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase
          .from("orders")
          .select("total_price:total_amount")
          .gte("created_at", new Date().toISOString().split("T")[0]),
        supabase.from("orders").select("total_price:total_amount, created_at").eq("status", "completed"),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total_price, 0) || 0;
      const totalRevenue = completedOrdersData.reduce((sum, o) => sum + o.total_price, 0) || 0;
      const platformRevenue = totalRevenue; // Đơn cửa hàng: Doanh thu sàn chính là tổng doanh thu thực tế

      // Tính toán biểu đồ doanh thu 7 ngày qua từ dữ liệu thực tế
      const dayNames = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
      const recentDays = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = dayNames[d.getDay()];
        recentDays.push({ name: dayName, dateStr: d.toISOString().split("T")[0], revenue: 0 });
      }

      if (completedOrdersData && completedOrdersData.length > 0) {
        completedOrdersData.forEach(o => {
          if (o.created_at) {
            const orderDateStr = o.created_at.split("T")[0];
            const day = recentDays.find(d => d.dateStr === orderDateStr);
            if (day) {
              day.revenue += o.total_price;
            }
          }
        });
      }

      const chartData = recentDays.map(({ name, revenue }) => ({ name, revenue }));

      return res.json({
        totalUsers,
        totalSellers: 0,
        totalProducts,
        totalOrders,
        todayRevenue,
        totalRevenue,
        platformRevenue,
        pendingOrders: pendingOrdersData?.length || 0,
        completedOrders: completedOrdersData?.length || 0,
        chartData
      });
    } else {
      // Logic dành cho SELLER
      const { data: shop } = await supabase
        .from("shops")
        .select("id, balance")
        .eq("owner_id", userId)
        .single();
      
      if (!shop) return res.status(404).json({ message: "Shop not found" });

      // 1. Lấy tất cả order_items thuộc shop này kèm theo status của order
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("order_id, price, quantity, products!inner(shop_id), orders!inner(status, created_at)")
        .eq("products.shop_id", shop.id);

      const totalProductsCount = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shop.id);

      // 2. Phân loại đơn hàng theo status
      const uniqueOrderIds = new Set();
      const pendingOrderIds = new Set();
      const completedOrderIds = new Set();

      orderItems?.forEach(item => {
        item.total_price = (item.price || 0) * (item.quantity || 0);
        uniqueOrderIds.add(item.order_id);
        if (item.orders.status === "pending") pendingOrderIds.add(item.order_id);
        if (item.orders.status === "completed") completedOrderIds.add(item.order_id);
      });

      // 3. Tính doanh thu 7 ngày qua
      const dailyRevenue = {};
      const dayNames = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
      
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split("T")[0];
        dailyRevenue[dateStr] = { name: dayNames[d.getDay()], revenue: 0 };
      }

      orderItems?.forEach(item => {
        if (item.orders.status === "completed") {
          const dateStr = item.orders.created_at.split("T")[0];
          if (dailyRevenue[dateStr]) {
            dailyRevenue[dateStr].revenue += item.total_price;
          }
        }
      });

      return res.json({
        totalProducts: totalProductsCount.count || 0,
        totalOrders: uniqueOrderIds.size,
        totalRevenue: shop.balance || 0,
        todayRevenue: 0,
        platformRevenue: 0,
        pendingOrders: pendingOrderIds.size,
        completedOrders: completedOrderIds.size,
        chartData: Object.values(dailyRevenue)
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ======================= USERS MANAGEMENT ======================= */
router.get("/users", authMiddleware(["admin"]), async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    let query = supabase
      .from("users")
      .select("id, email, name, phone, role, is_active, created_at");

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data, count } = await query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    res.json({ data, total: count || 0 });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/users/:id/toggle-active", authMiddleware(["admin"]), async (req, res) => {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("is_active")
      .eq("id", req.params.id)
      .single();
    const { data } = await supabase
      .from("users")
      .update({ is_active: !user.is_active })
      .eq("id", req.params.id)
      .select("id, is_active")
      .single();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/users/:id/role", authMiddleware(["admin"]), async (req, res) => {
  const { role } = req.body;
  if (!["customer", "admin", "shipper", "seller", "cskh"].includes(role)) {
    return res.status(400).json({ message: "Invalid role. Allowed: customer, admin, shipper, seller, cskh" });
  }
  const { data } = await supabase
    .from("users")
    .update({ role })
    .eq("id", req.params.id)
    .select("id, role")
    .single();
  res.json(data);
});

router.post("/products", authMiddleware(["admin", "seller"]), async (req, res) => {
  try {
    const {
      name, price, vip_price, description, image, category_id,
      // Metadata sách
      author, publisher, published_year, isbn, pages, language, cover_type
    } = req.body;

    // Admin luôn dùng shop hệ thống mặc định (id = 1)
    const shopId = req.body.shop_id || 1;

    const { data, error } = await supabase
      .from("products")
      .insert({
        name,
        price,
        vip_price: vip_price || null,
        description: description || "Chưa có mô tả",
        image: image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500",
        category_id: category_id || 1,
        shop_id: shopId,
        // Metadata sách
        author: author || null,
        publisher: publisher || null,
        published_year: published_year || null,
        isbn: isbn || null,
        pages: pages || null,
        language: language || 'Tiếng Việt',
        cover_type: cover_type || null,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("CREATE BOOK ERROR:", err);
    res.status(500).json({ message: "Không thể thêm sách" });
  }
});

/* ======================= BOOKS (PRODUCTS) MANAGEMENT ======================= */
router.get("/products", authMiddleware(["admin", "seller"]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id, name, price, vip_price, description, category_id, image, created_at,
        author, publisher, published_year, isbn, pages, language, cover_type,
        shops(id, name)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(mapProductsImage(data));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update Book
router.put("/products/:id", authMiddleware(["admin", "seller"]), async (req, res) => {
  try {
    const {
      name, price, vip_price, description, image, category_id,
      // Metadata sách
      author, publisher, published_year, isbn, pages, language, cover_type
    } = req.body;
    const productId = req.params.id;

    const { data, error } = await supabase
      .from("products")
      .update({
        name, price, vip_price, description, image, category_id,
        author, publisher, published_year, isbn, pages, language, cover_type
      })
      .eq("id", productId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("UPDATE BOOK ERROR:", err);
    res.status(500).json({ message: "Lỗi cập nhật sách" });
  }
});

/* ======================= BOOK VARIANTS (Loại bìa / Phiên bản) ======================= */
// Get Variants of a book
router.get("/products/:id/variants", authMiddleware(["admin", "seller"]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", req.params.id);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tải phiên bản sách" });
  }
});

// Add a variant (edition/cover type) to a book
// Tái sử dụng: size = Loại bìa (Bìa mềm, Bìa cứng...), color = Phiên bản (Tái bản lần 2...)
router.post("/products/:id/variants", authMiddleware(["admin", "seller"]), async (req, res) => {
  try {
    const { size, color, price, stock, image } = req.body;
    const productId = req.params.id;

    const { data, error } = await supabase
      .from("product_variants")
      .insert({ product_id: productId, size, color, price: price ? Number(price) : null, stock: stock ? Number(stock) : 0, image_url: image || null })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("ADD VARIANT ERROR:", err);
    res.status(500).json({ message: "Lỗi thêm phiên bản sách" });
  }
});

// Update Variant
router.put("/variants/:id", authMiddleware(["admin", "seller"]), async (req, res) => {
  try {
    const { size, color, price, stock, image } = req.body;
    const variantId = req.params.id;

    const { data, error } = await supabase
      .from("product_variants")
      .update({ size, color, price: price ? Number(price) : null, stock: stock !== undefined ? Number(stock) : undefined, image_url: image || null })
      .eq("id", variantId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("UPDATE VARIANT ERROR:", err);
    res.status(500).json({ message: "Lỗi cập nhật phiên bản sách" });
  }
});

// Delete Variant
router.delete("/variants/:id", authMiddleware(["admin", "seller"]), async (req, res) => {
  try {
    const variantId = req.params.id;
    const { error } = await supabase.from("product_variants").delete().eq("id", variantId);
    if (error) throw error;
    res.json({ message: "Variant deleted" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa phiên bản sách" });
  }
});

router.delete("/products/:id", authMiddleware(["admin", "seller"]), async (req, res) => {
  try {
    const productId = req.params.id;

    // 1. Tìm các biến thể liên quan
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId);
    
    if (variants && variants.length > 0) {
      const variantIds = variants.map(v => v.id);
      
      // 2. Xóa các mục trong đơn hàng (Dành cho môi trường test/dev)
      await supabase.from("order_items").delete().in("variant_id", variantIds);
    }

    // 3. Xóa dữ liệu trong giỏ hàng (Cart)
    await supabase.from("cart_items").delete().eq("product_id", productId);

    // 4. Xóa đánh giá (Reviews)
    await supabase.from("reviews").delete().eq("product_id", productId);

    // 5. Xóa các biến thể (Variants)
    await supabase.from("product_variants").delete().eq("product_id", productId);

    // 6. Xóa sản phẩm chính
    const { error: prodErr } = await supabase.from("products").delete().eq("id", productId);
    if (prodErr) throw prodErr;

    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("FORCE DELETE PRODUCT ERROR:", err);
    res.status(500).json({ message: "Lỗi hệ thống khi xóa sản phẩm" });
  }
});



/* ======================= PASSWORD RESET REQUESTS ======================= */
router.get("/password-requests", authMiddleware(["admin"]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("password_reset_requests")
      .select(`
        id, email, full_name, phone, status, requested_at,
        users!user_id (name, phone)
      `)
      .order("requested_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("GET PASSWORD REQUESTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/password-requests/:id/process", authMiddleware(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    const fixedPassword = "123456";
    const hash = await bcrypt.hash(fixedPassword, 10);

    const { data: request, error: reqError } = await supabase
      .from("password_reset_requests")
      .select("user_id, email")
      .eq("id", id)
      .single();

    if (reqError || !request.user_id) {
      return res.status(400).json({ message: "Không tìm thấy tài khoản hợp lệ để reset" });
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hash })
      .eq("id", request.user_id);

    if (updateError) throw updateError;

    const { error: statusError } = await supabase
      .from("password_reset_requests")
      .update({
        status: "processed",
        processed_at: new Date(),
        processed_by: req.user.id,
        new_password_plain: fixedPassword,
      })
      .eq("id", id);

    if (statusError) throw statusError;

    res.json({
      message: "Đã cấp mật khẩu mới thành công",
      newPassword: fixedPassword,
      email: request.email,
    });
  } catch (err) {
    console.error("PROCESS PASSWORD REQUEST ERROR:", err);
    res.status(500).json({ message: "Lỗi xử lý yêu cầu" });
  }
});

router.delete("/password-requests/:id", authMiddleware(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("password_reset_requests")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Đã xóa yêu cầu thành công" });
  } catch (err) {
    console.error("DELETE PASSWORD REQUEST ERROR:", err);
    res.status(500).json({ message: "Lỗi xóa yêu cầu" });
  }
});

/* ======================= ORDERS MANAGEMENT ======================= */

/**
 * GET /admin/orders
 * Lấy danh sách toàn bộ đơn hàng trên hệ thống (Dành cho Admin & CSKH)
 */
router.get("/orders", authMiddleware(["admin", "cskh", "seller"]), async (req, res) => {
  try {
    console.log(">>> [BACKEND] Nhận yêu cầu GET /admin/orders từ User ID:", req.user?.id, "Role:", req.user?.role);
    
    let formattedOrders = [];
    
    try {
      // Phương án 1: Sử dụng Single Joint Query (Nhanh và tối ưu)
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          *,
          users!orders_user_id_fkey (
            name,
            email
          ),
          order_items (
            id,
            quantity,
            price,
            products (
              name,
              image
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      formattedOrders = (orders || []).map(order => {
        const customer = order["users!orders_user_id_fkey"] || order.users;
        const formattedItems = order.order_items?.map(item => {
          let imageUrl = item.products?.image;
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `${SUPABASE_IMAGE_BASE}${imageUrl}`;
          }
          return {
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            products: {
              name: item.products?.name || 'Sản phẩm không xác định',
              image: imageUrl || null
            }
          };
        }) || [];

        return {
          ...order,
          total_price: order.total_amount,
          users: customer,
          order_items: formattedItems
        };
      });
      
      console.log(">>> [BACKEND] Phương án 1 (Joint Query) thành công!");

    } catch (jointError) {
      console.warn(">>> [BACKEND] Cảnh báo: Phương án 1 Joint Query thất bại (có thể do sai khác cấu trúc khóa ngoại). Kích hoạt cơ chế Dự phòng (Fallback)...", jointError.message);
      
      // Phương án 2: Phân tách truy vấn thủ công (Độc lập 100% với tên ràng buộc khóa ngoại)
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      if (orders && orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];

        // Fetch song song Users và Order Items
        const [usersRes, itemsRes] = await Promise.all([
          supabase.from("users").select("id, name, email").in("id", userIds),
          supabase.from("order_items").select("*").in("order_id", orderIds)
        ]);

        const usersMap = Object.fromEntries((usersRes.data || []).map(u => [u.id, u]));
        const items = itemsRes.data || [];

        // Lấy thông tin sản phẩm và biến thể nếu có item
        let productsMap = {};

        if (items.length > 0) {
          const productIds = [...new Set(items.map(i => i.product_id).filter(Boolean))];
          const { data: products } = await supabase.from("products").select("id, name, image").in("id", productIds);
          if (products) {
            productsMap = Object.fromEntries(products.map(p => [p.id, p]));
          }
        }

        // Khâu nối dữ liệu (Stitching)
        formattedOrders = orders.map(order => {
          const customer = usersMap[order.user_id] || null;
          const orderItems = items
            .filter(item => item.order_id === order.id)
            .map(item => {
              const product = productsMap[item.product_id] || null;
              let imageUrl = product?.image;
              if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = `${SUPABASE_IMAGE_BASE}${imageUrl}`;
              }
              return {
                id: item.id,
                quantity: item.quantity,
                price: item.price,
                products: product ? { ...product, image: imageUrl } : null
              };
            });

          return {
            ...order,
            total_price: order.total_amount,
            users: customer,
            order_items: orderItems
          };
        });
        
        console.log(">>> [BACKEND] Phương án 2 (Fallback Multi-query) hoàn tất thành công!");
      }
    }

    console.log(">>> [BACKEND] Trả về danh sách đơn hàng thành công, số lượng:", formattedOrders.length);
    res.json(formattedOrders);
  } catch (err) {
    console.error("GET ADMIN ORDERS ERROR:", err);

    res.status(500).json({ message: "Lỗi tải danh sách đơn hàng" });
  }
});

/**
 * PUT /admin/orders/:id/status
 * Cập nhật trạng thái đơn hàng (Xác nhận, Giao hàng, Hoàn thành, Hủy đơn)
 */
router.put("/orders/:id/status", authMiddleware(["admin", "cskh", "seller"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["pending", "shipped", "completed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const updateData = { status };

    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Cập nhật trạng thái ở bảng payments nếu có liên quan
    if (status === "cancelled") {
      await supabase
        .from("payments")
        .update({ status: "cancelled" })
        .eq("order_id", id);
    }

    res.json({
      message: "Cập nhật trạng thái đơn hàng thành công!",
      order: updatedOrder
    });
  } catch (err) {
    console.error("UPDATE ADMIN ORDER STATUS ERROR:", err);
    res.status(500).json({ message: "Không thể cập nhật trạng thái đơn hàng" });
  }
});


/* ======================= CATEGORIES MANAGEMENT ======================= */
router.get("/categories", authMiddleware(["admin", "seller"]), async (req, res) => {
  try {
    const { data } = await supabase.from("categories").select("*").order("name");
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/categories", authMiddleware(["admin", "seller"]), async (req, res) => {
  try {
    const { name, icon } = req.body;
    const { data, error } = await supabase.from("categories").insert({ name, image_url: icon || null }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("CREATE CATEGORY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/categories/:id", authMiddleware(["admin", "seller"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error("DELETE CATEGORY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ======================= SHOPS MANAGEMENT ======================= */
router.get("/shops", authMiddleware(["admin"]), async (req, res) => {
  try {
    const { data } = await supabase.from("shops").select("*, users(name, email, is_active)").order("created_at", { ascending: false });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/shops/:id/toggle-active", authMiddleware(["admin"]), async (req, res) => {
  try {
    const { data: shop } = await supabase.from("shops").select("owner_id").eq("id", req.params.id).single();
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    const { data: user } = await supabase.from("users").select("is_active").eq("id", shop.owner_id).single();
    const { data } = await supabase.from("users").update({ is_active: !user.is_active }).eq("id", shop.owner_id).select().single();
    
    res.json({ id: req.params.id, is_active: data.is_active });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
