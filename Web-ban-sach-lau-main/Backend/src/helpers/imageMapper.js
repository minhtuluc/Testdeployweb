const { SUPABASE_IMAGE_BASE } = require("../config/constants");

/** Map URL ảnh đầy đủ cho 1 sản phẩm */
const mapProductImage = (product) => {
  if (!product) return product;
  const isHttp = product.image && product.image.startsWith('http');
  const mappedProduct = {
    ...product,
    image: product.image ? (isHttp ? product.image : SUPABASE_IMAGE_BASE + product.image) : null,
  };

  // Map images for variants if they exist
  if (mappedProduct.product_variants) {
    mappedProduct.product_variants = mapProductVariantsImage(mappedProduct.product_variants);
  }

  return mappedProduct;
};

/** Map URL ảnh cho danh sách variants */
const mapProductVariantsImage = (variants = []) => {
  return variants.map(v => {
    const sourceImage = v.image_url || v.image;
    const isHttp = sourceImage && sourceImage.startsWith('http');
    return {
      ...v,
      image: sourceImage ? (isHttp ? sourceImage : SUPABASE_IMAGE_BASE + sourceImage) : null
    };
  });
};

/** Map URL ảnh cho danh sách sản phẩm */
const mapProductsImage = (products = []) => products.map(mapProductImage);

/** Map URL logo cho shop */
const mapShopLogo = (shop) => {
  if (!shop) return shop;
  return {
    ...shop,
    logo: shop.logo ? SUPABASE_IMAGE_BASE + shop.logo : null,
  };
};

module.exports = {
  mapProductImage,
  mapProductsImage,
  mapProductVariantsImage,
  mapShopLogo,
};
