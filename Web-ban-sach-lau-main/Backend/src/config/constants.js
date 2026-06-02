const SUPABASE_IMAGE_BASE = `${process.env.SUPABASE_URL}/storage/v1/object/public/products/`;

const BUCKET = "products";

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = {
  SUPABASE_IMAGE_BASE,
  BUCKET,
  JWT_SECRET,
};

