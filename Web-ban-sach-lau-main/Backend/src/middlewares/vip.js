const supabase = require("../config/supabase");

/**
 * Middleware yêu cầu tài khoản phải là VIP đang còn hạn.
 * Chú ý: Middleware này phải chạy SAU authMiddleware() để có req.user.
 */
const requireVIP = () => async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized. Vui lòng đăng nhập." });
    }

    // Lấy thông tin VIP mới nhất từ Database để chống quá hạn
    const { data: user, error } = await supabase
      .from("users")
      .select("membership_type, vip_expire_at")
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: "Không tìm thấy thông tin tài khoản." });
    }

    const isVIP = user.membership_type === "vip" && 
                  user.vip_expire_at && 
                  new Date(user.vip_expire_at) > new Date();

    if (!isVIP) {
      return res.status(403).json({ 
        message: "Tính năng này chỉ dành riêng cho thành viên VIP. Vui lòng nâng cấp gói thành viên của bạn!" 
      });
    }

    // Gắn thông tin VIP chính thức vào request để các route sau có thể sử dụng trực tiếp
    req.vipInfo = user;
    next();
  } catch (err) {
    console.error("VIP MIDDLEWARE ERROR:", err);
    res.status(500).json({ message: "Lỗi hệ thống khi xác thực quyền VIP." });
  }
};

module.exports = requireVIP;
