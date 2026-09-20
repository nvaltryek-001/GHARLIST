const CDN = "https://cdn.dmart.in/images/products/";

export function getImageCandidates(product) {
  const candidates = [];

  if (product?.image) {
    candidates.push(product.image);
  }

  if (
    product?.productImageKey &&
    product?.imgCode
  ) {
    candidates.push(
      `${CDN}${product.productImageKey}_${product.imgCode}_B.jpg`
    );
  }

  if (product?.imageKey && product?.imgCode) {
    candidates.push(
      `${CDN}${product.imageKey}_${product.imgCode}_B.jpg`
    );
  }

  return [...new Set(candidates.filter(Boolean))];
}

export function getProductImage(product) {
  return getImageCandidates(product)[0] || null;
}

export function getFallbackLabel(product) {
  return product?.name
    ? "Image unavailable"
    : "No image";
}
