const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const authMiddleware = require("../middlewares/auth");

// POST /checkout
router.post("/", authMiddleware(), async (req, res) => {
  try {
    const { 
      address_id, 
      payment_method = "cod", 
      voucher_code, 
      discount_amount = 0, 
      shipping_fee = 0, 
      items 
    } = req.body;

    if (!address_id) {
      return res.status(400).json({ message: "Missing address" });
    }

    // 1. Kiểm tra trạng thái VIP của User từ Database để đảm bảo an toàn bảo mật
    const { data: userProfile } = await supabase
      .from("users")
      .select("membership_type, vip_expire_at")
      .eq("id", req.user.id)
      .single();

    const isVIP = userProfile?.membership_type === "vip" && 
                  userProfile?.vip_expire_at && 
                  new Date(userProfile.vip_expire_at) > new Date();

    let cartItemsToCheckout = [];

    // Nếu frontend gửi mảng items trực tiếp (như Web React LocalStorage)
    if (items && Array.isArray(items) && items.length > 0) {
      cartItemsToCheckout = items.map(item => ({
        product_id: item.original_id || item.product_id || item.id,
        variant_id: item.variantId || item.variant_id || null,
        price: item.price,
        quantity: item.quantity
      }));
    } else {
      // Lấy cart từ DB (như Mobile App)
      const { data: dbCartItems } = await supabase
        .from("cart")
        .select(`
          id,
          quantity,
          product_variants (
            id,
            price,
            product_id
          )
        `)
        .eq("user_id", req.user.id);

      if (!dbCartItems || dbCartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      cartItemsToCheckout = dbCartItems.map(item => ({
        product_id: item.product_variants ? item.product_variants.product_id : null,
        variant_id: item.product_variants ? item.product_variants.id : null,
        price: item.product_variants ? item.product_variants.price : 0,
        quantity: item.quantity
      }));
    }

    if (cartItemsToCheckout.length === 0) {
      return res.status(400).json({ message: "No items to checkout" });
    }

    // 2. Bảo mật giá: Lấy giá chính xác từ Database và tự động áp dụng giá VIP nếu người dùng là VIP
    const productIds = cartItemsToCheckout.map(i => i.product_id).filter(Boolean);
    const variantIds = cartItemsToCheckout.map(i => i.variant_id).filter(Boolean);

    // Truy vấn thông tin tất cả sản phẩm liên quan để lấy giá gốc và giá VIP chính thức
    const { data: dbProducts } = await supabase
      .from("products")
      .select("id, price, vip_price")
      .in("id", productIds);

    const productMap = {};
    if (dbProducts) {
      dbProducts.forEach(p => {
        productMap[p.id] = p;
      });
    }

    // Truy vấn thông tin các biến thể (variants) nếu có
    const variantPriceMap = {};
    if (variantIds.length > 0) {
      const { data: dbVariants } = await supabase
        .from("product_variants")
        .select("id, price, product_id")
        .in("id", variantIds);

      if (dbVariants) {
        dbVariants.forEach(v => {
          const product = productMap[v.product_id];
          let finalPrice = v.price;
          if (isVIP && product?.vip_price) {
            // Tỷ lệ giảm giá VIP từ sản phẩm gốc
            const discountRatio = product.price > 0 ? (product.vip_price / product.price) : 0.9;
            finalPrice = Math.round(v.price * discountRatio);
          }
          variantPriceMap[v.id] = finalPrice;
        });
      }
    }

    // Cập nhật lại giá bán bảo mật thực tế cho các items sau khi đã áp dụng giá VIP
    cartItemsToCheckout = cartItemsToCheckout.map(item => {
      let securePrice = item.price;
      if (item.variant_id && variantPriceMap[item.variant_id] !== undefined) {
        securePrice = variantPriceMap[item.variant_id];
      } else {
        const product = productMap[item.product_id];
        if (product) {
          securePrice = isVIP && product.vip_price ? product.vip_price : product.price;
        }
      }
      return {
        ...item,
        price: securePrice
      };
    });

    // 3. Tính tổng tiền hàng
    const items_total = cartItemsToCheckout.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Tính tổng thanh toán cuối cùng = Tổng tiền hàng + Phí ship - Giảm giá voucher
    const total_price = Math.max(0, items_total + (shipping_fee || 0) - (discount_amount || 0));

    // 4. Tạo ORDER với các thông tin thanh toán đầy đủ
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: req.user.id,
        address_id,
        total_amount: total_price,
        status: "pending",
        payment_method,
        voucher_code: voucher_code || null,
        discount_amount: discount_amount || 0,
        shipping_fee: shipping_fee || 0
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // 5. Tạo ORDER ITEMS
    const orderItems = cartItemsToCheckout.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      price: item.price,
      quantity: item.quantity,
    }));

    await supabase.from("order_items").insert(orderItems);

    // 6. Tạo PAYMENT
    await supabase.from("payments").insert({
      order_id: order.id,
      payment_method,
      amount: total_price,
      status: "pending",
    });

    // 7. Xoá CART của user
    await supabase.from("cart").delete().eq("user_id", req.user.id);

    res.json({
      message: "Order created successfully",
      order_id: order.id,
    });
  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    res.status(500).json({ message: "Checkout failed" });
  }
});

module.exports = router;
