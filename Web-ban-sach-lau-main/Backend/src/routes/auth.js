const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");
const { JWT_SECRET } = require("../config/constants");
const authMiddleware = require("../middlewares/auth");

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing email or password" });

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user)
      return res.status(400).json({ message: "User not found" });

    if (!user.is_active)
      return res.status(403).json({ message: "Account locked" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Nếu là seller, lấy thêm thông tin shop
    let shop = null;
    if (user.role === "seller") {
      const { data: shopData } = await supabase
        .from("shops")
        .select("id, name")
        .eq("owner_id", user.id)
        .single();
      shop = shopData;
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        membership_type: user.membership_type,
        vip_expire_at: user.vip_expire_at,
        shop: shop, // Trả về thông tin shop
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Thiếu email, password hoặc name" });
    }

    // Kiểm tra email tồn tại
    const { data: existedUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existedUser) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const hash = await bcrypt.hash(password, 10);
    const role = "customer";

    // INSERT USER
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        email: email.trim().toLowerCase(),
        password: hash,
        name: name.trim(),
        role: role,
        is_active: true,
      })
      .select("id, email, name, role")
      .single();

    if (userError) {
      console.error("❌ LỖI INSERT USER:", userError);
      return res.status(400).json({
        message: "Tạo tài khoản thất bại",
        details: userError.message,
      });
    }

    // TẠO SHOP NẾU LÀ SELLER (Đã bị loại bỏ trong kiến trúc 1 shop)

    res.json({
      message: "Đăng ký thành công!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("💥 REGISTER CRASH:", err);
    res.status(500).json({ message: "Lỗi server không xác định" });
  }
});

// POST /auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, fullName, phone } = req.body;

    if (!email || !fullName || !phone) {
      return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ thông tin" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("id, email, name, phone")
      .eq("email", email.trim().toLowerCase())
      .single();

    const { data: request, error } = await supabase
      .from("password_reset_requests")
      .insert({
        user_id: user?.id || null,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        phone: phone.trim(),
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    console.log("Yêu cầu quên mật khẩu mới - ID:", request.id);

    res.json({
      message: "Yêu cầu đã được gửi thành công! Admin sẽ xử lý và liên hệ bạn sớm.",
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
