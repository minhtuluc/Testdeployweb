const SUPABASE_IMAGE_BASE = `${process.env.SUPABASE_URL}/storage/v1/object/public/products/`;

const BUCKET = "products";

const JWT_SECRET = process.env.JWT_SECRET;

const PLATFORM_SHOP_ID = 1; // Shop "Platform" dùng để tích lũy phí sàn

const PLATFORM_FEE_PERCENT = 0.05; // 5% phí sàn

module.exports = {
  SUPABASE_IMAGE_BASE,
  BUCKET,
  JWT_SECRET,
  PLATFORM_SHOP_ID,
  PLATFORM_FEE_PERCENT,
};
