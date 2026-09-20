
let productsCache = null;
let categoriesCache = null;
let brandsCache = null;

export async function loadProducts() {
  if (productsCache) return productsCache;

  const response = await fetch("/data/products.json", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Unable to load products.json");
  }

  const data = await response.json();

  productsCache = Array.isArray(data) ? data : [];

  return productsCache;
}

export async function getCategories() {
  if (categoriesCache) return categoriesCache;

  const products = await loadProducts();

  const counts = new Map();

  for (const product of products) {
    const category = String(product.category || "Other").trim();

    if (!category) continue;

    counts.set(category, (counts.get(category) || 0) + 1);
  }

  categoriesCache = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return categoriesCache;
}

export async function getBrands() {
  if (brandsCache) return brandsCache;

  const products = await loadProducts();

  const counts = new Map();

  for (const product of products) {
    const brand = String(product.brand || "BRAND").trim();

    if (!brand) continue;

    counts.set(brand, (counts.get(brand) || 0) + 1);
  }

  brandsCache = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return brandsCache;
}

export function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function searchProducts(query, products) {
  const q = normalizeText(query);

  if (!q) return products;

  const terms = q.split(/\s+/).filter(Boolean);

  return products.filter(product => {
    const haystack = normalizeText([
      product.name,
      product.brand,
      product.category,
      product.subcategory,
      product.quantity,
      product.description,
      product.breadcrumbs,
      product.articleNumber,
      product.skuUniqueID,
      product.productImageKey
    ].join(" "));

    return terms.every(term => haystack.includes(term));
  });
}

export function filterProducts(products, filters = {}) {
  const {
    category = "",
    brand = "",
    minPrice = "",
    maxPrice = ""
  } = filters;

  return products.filter(product => {
    if (
      category &&
      String(product.category || "").toLowerCase() !==
      String(category).toLowerCase()
    ) {
      return false;
    }

    if (
      brand &&
      String(product.brand || "").toLowerCase() !==
      String(brand).toLowerCase()
    ) {
      return false;
    }

    const price = Number(product.salePrice ?? product.mrp ?? 0);

    if (minPrice !== "" && price < Number(minPrice)) {
      return false;
    }

    if (maxPrice !== "" && price > Number(maxPrice)) {
      return false;
    }

    return true;
  });
}

export function getProductById(id, products) {
  return products.find(
    product => String(product.id) === String(id)
  );
}

export function getProductPrice(product) {
  return Number(
    product?.salePrice ??
    product?.mrp ??
    0
  );
}
