const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const authMiddleware = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// GET /user/profile
router.get("/profile", authMiddleware(), async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, phone, avatar, role, membership_type, vip_expire_at")
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /user/profile
router.put("/profile", authMiddleware(), async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const { data, error } = await supabase
      .from("users")
      .update({ name, phone, avatar })
      .eq("id", req.user.id)
      .select("id, email, name, avatar, phone, role, membership_type, vip_expire_at")
      .single();

    if (error) {
      console.error("UPDATE PROFILE ERROR:", error);
      return res.status(400).json({ message: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /user/upload-avatar
router.post(
  "/upload-avatar",
  authMiddleware(),
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Không có file được gửi lên" });
      }

      const userId = req.user.id;
      const fileExt = req.file.mimetype.split("/")[1] || "jpg";
      const fileName = `avatar_${userId}_${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        return res.status(500).json({
          message: "Upload lên Supabase thất bại",
          details: error.message,
        });
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Lưu url vào database cho user
      await supabase
        .from("users")
        .update({ avatar: urlData.publicUrl })
        .eq("id", userId);

      res.json({
        success: true,
        avatarUrl: urlData.publicUrl,
      });
    } catch (err) {
      console.error("Upload avatar route error:", err);
      res.status(500).json({ message: "Lỗi server khi upload avatar" });
    }
  }
);

// POST /user/upgrade-vip
router.post("/upgrade-vip", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan } = req.body; // e.g., '1_month'

    // Trong thực tế sẽ có bước thanh toán ở đây.
    // Giả sử thanh toán thành công, chúng ta gia hạn VIP 30 ngày.
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 30);

    // 1. Cập nhật bảng users
    const { data: updatedUser, error: userError } = await supabase
      .from("users")
      .update({
        membership_type: "vip",
        vip_expire_at: expireDate.toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (userError) throw userError;

    // 2. Tạo bản ghi trong bảng subscriptions
    await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_name: plan || "Gói 1 tháng",
      amount: 99000, // Giá giả định
      start_date: new Date().toISOString(),
      end_date: expireDate.toISOString(),
      status: "active",
    });

    res.json({
      message: "Nâng cấp VIP thành công!",
      user: updatedUser,
    });
  } catch (err) {
    console.error("UPGRADE VIP ERROR:", err);
    res.status(500).json({ message: "Lỗi nâng cấp VIP" });
  }
});

// PUT /user/change-password
router.put("/change-password", authMiddleware(), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới" });
    }

    // Lấy thông tin user hiện tại (để lấy mật khẩu cũ đã mã hóa)
    const { data: user, error } = await supabase
      .from("users")
      .select("password")
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra mật khẩu hiện tại
    const bcrypt = require("bcryptjs");
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác" });
    }

    // Mã hóa mật khẩu mới
    const hash = await bcrypt.hash(newPassword, 10);

    // Cập nhật vào database
    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hash })
      .eq("id", req.user.id);

    if (updateError) {
      throw updateError;
    }

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    res.status(500).json({ message: "Lỗi server khi đổi mật khẩu" });
  }
});

module.exports = router;
