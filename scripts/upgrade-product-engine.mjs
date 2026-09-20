import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();

function write(file, content) {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log("✓", file);
}

/* =========================================================
   PRODUCT SERVICE
========================================================= */

write("src/services/productService.js", `
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
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function searchProducts(query, products) {
  const q = normalizeText(query);

  if (!q) return products;

  const terms = q.split(/\\s+/).filter(Boolean);

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
`);

/* =========================================================
   IMAGE SERVICE
========================================================= */

write("src/services/imageService.js", `
const CDN = "https://cdn.dmart.in/images/products";

export function getImageCandidates(product) {
  if (!product) return [];

  const key =
    product.productImageKey ||
    product.imageKey ||
    "";

  const imgCode =
    product.imgCode ||
    "";

  const candidates = [];

  if (key && imgCode) {
    candidates.push(
      \`\${CDN}/\${key}_\${imgCode}_B.jpg\`,
      \`\${CDN}/\${key}_\${imgCode}_M.jpg\`,
      \`\${CDN}/\${key}_\${imgCode}.jpg\`,
      \`\${CDN}/\${key}_\${imgCode}_B.webp\`,
      \`\${CDN}/\${key}_\${imgCode}.webp\`
    );
  }

  if (key) {
    candidates.push(
      \`\${CDN}/\${key}_B.jpg\`,
      \`\${CDN}/\${key}_M.jpg\`,
      \`\${CDN}/\${key}.jpg\`,
      \`\${CDN}/\${key}_B.webp\`,
      \`\${CDN}/\${key}.webp\`
    );
  }

  if (product.image) {
    candidates.push(product.image);
  }

  return [...new Set(candidates)];
}

export function getPrimaryImage(product) {
  return getImageCandidates(product)[0] || "";
}
`);

/* =========================================================
   PRODUCT IMAGE COMPONENT
========================================================= */

write("src/components/ProductImage.jsx", `
import { useEffect, useMemo, useState } from "react";
import { Package } from "lucide-react";
import { getImageCandidates } from "../services/imageService";

export default function ProductImage({
  product,
  className = "",
  alt
}) {
  const candidates = useMemo(
    () => getImageCandidates(product),
    [product]
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [product?.id]);

  const src = candidates[index];

  if (!src) {
    return (
      <div className={\`product-image-fallback \${className}\`}>
        <Package size={42} strokeWidth={1.7} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || product?.name || "Product"}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (index < candidates.length - 1) {
          setIndex(index + 1);
        }
      }}
    />
  );
}
`);

/* =========================================================
   PRODUCT CARD
========================================================= */

write("src/components/ProductCard.jsx", `
import { Plus, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProductImage from "./ProductImage";
import { useShoppingStore } from "../store/shoppingStore";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const addItem = useShoppingStore(state => state.addItem);
  const items = useShoppingStore(state => state.items);

  const selected = items.find(
    item => String(item.id) === String(product.id)
  );

  const price = Number(
    product.salePrice ?? product.mrp ?? 0
  );

  return (
    <article className="product-card">

      <button
        className="product-image-button"
        onClick={() => navigate(\`/product/\${product.id}\`)}
        aria-label={\`View \${product.name}\`}
      >
        <ProductImage
          product={product}
          className="product-image"
        />
      </button>

      <div className="product-card-body">

        <div className="product-brand">
          {product.brand || "BRAND"}
        </div>

        <button
          className="product-name"
          onClick={() => navigate(\`/product/\${product.id}\`)}
        >
          {product.name}
        </button>

        <div className="product-quantity">
          {product.quantity || "Standard"}
        </div>

        <div className="product-card-footer">

          <strong>
            ₹{price.toLocaleString("en-IN")}
          </strong>

          <button
            className={\`add-button \${selected ? "added" : ""}\`}
            onClick={() => addItem(product)}
          >
            {selected ? (
              <>
                <Check size={17} />
                Added
              </>
            ) : (
              <>
                <Plus size={17} />
                Add
              </>
            )}
          </button>

        </div>

      </div>
    </article>
  );
}
`);

/* =========================================================
   PRODUCTS PAGE
========================================================= */

write("src/pages/Products.jsx", `
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  loadProducts,
  getCategories,
  getBrands,
  searchProducts,
  filterProducts
} from "../services/productService";
import ProductCard from "../components/ProductCard";

const PAGE_SIZE = 40;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");

  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([
      loadProducts(),
      getCategories(),
      getBrands()
    ]).then(([all, cats, brandList]) => {
      if (!active) return;

      setProducts(all);
      setCategories(cats);
      setBrands(brandList);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let result = searchProducts(query, products);

    result = filterProducts(result, {
      category,
      brand
    });

    return result;
  }, [products, query, category, brand]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, category, brand]);

  const visibleProducts = filtered.slice(0, visible);

  if (loading) {
    return (
      <main className="page">
        <div className="loading-state">
          Loading 5,188 products...
        </div>
      </main>
    );
  }

  return (
    <main className="page products-page">

      <section className="page-heading">
        <div>
          <span className="eyebrow">GHARLIST CATALOG</span>
          <h1>All Products</h1>
          <p>
            {filtered.length.toLocaleString("en-IN")} products
            {query || category || brand
              ? " matching your filters"
              : " available"}
          </p>
        </div>
      </section>

      <section className="catalog-toolbar">

        <div className="catalog-search">

          <Search size={20} />

          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search all 5,188 products..."
          />

          {query && (
            <button
              onClick={() => setQuery("")}
              className="icon-button"
            >
              <X size={18} />
            </button>
          )}

        </div>

        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>

          {categories.map(item => (
            <option key={item.name} value={item.name}>
              {item.name} ({item.count})
            </option>
          ))}
        </select>

        <select
          value={brand}
          onChange={e => setBrand(e.target.value)}
        >
          <option value="">All Brands</option>

          {brands.slice(0, 250).map(item => (
            <option key={item.name} value={item.name}>
              {item.name} ({item.count})
            </option>
          ))}
        </select>

      </section>

      {(query || category || brand) && (
        <div className="active-filters">

          {query && (
            <button onClick={() => setQuery("")}>
              Search: {query} ×
            </button>
          )}

          {category && (
            <button onClick={() => setCategory("")}>
              Category: {category} ×
            </button>
          )}

          {brand && (
            <button onClick={() => setBrand("")}>
              Brand: {brand} ×
            </button>
          )}

        </div>
      )}

      {visibleProducts.length === 0 ? (
        <div className="empty-state">
          <h2>No products found</h2>
          <p>Try another product name, brand or category.</p>
        </div>
      ) : (
        <>
          <section className="product-grid">

            {visibleProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}

          </section>

          {visible < filtered.length && (
            <div className="load-more-wrap">

              <button
                className="load-more-button"
                onClick={() =>
                  setVisible(current =>
                    Math.min(
                      current + PAGE_SIZE,
                      filtered.length
                    )
                  )
                }
              >
                Load More
                <span>
                  {Math.min(visible, filtered.length).toLocaleString("en-IN")}
                  {" / "}
                  {filtered.length.toLocaleString("en-IN")}
                </span>
              </button>

            </div>
          )}

          {visible >= filtered.length && (
            <div className="catalog-end">
              Showing all {filtered.length.toLocaleString("en-IN")} matching products
            </div>
          )}

        </>
      )}

    </main>
  );
}
`);

/* =========================================================
   PRODUCT DETAIL
========================================================= */

write("src/pages/ProductDetail.jsx", `
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  loadProducts,
  getProductById
} from "../services/productService";
import ProductImage from "../components/ProductImage";
import { useShoppingStore } from "../store/shoppingStore";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);

  const addItem = useShoppingStore(state => state.addItem);
  const items = useShoppingStore(state => state.items);

  const selected = items.find(
    item => String(item.id) === String(id)
  );

  useEffect(() => {
    loadProducts().then(products => {
      setProduct(getProductById(id, products));
    });
  }, [id]);

  if (!product) {
    return (
      <main className="page">
        <div className="empty-state">
          <h2>Product not found</h2>
          <button
            className="primary-button"
            onClick={() => navigate("/products")}
          >
            Back to Products
          </button>
        </div>
      </main>
    );
  }

  const price = Number(
    product.salePrice ?? product.mrp ?? 0
  );

  return (
    <main className="page product-detail-page">

      <button
        className="back-button"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <section className="product-detail">

        <div className="detail-image">
          <ProductImage
            product={product}
            className="detail-product-image"
          />
        </div>

        <div className="detail-info">

          <div className="product-brand">
            {product.brand || "BRAND"}
          </div>

          <h1>{product.name}</h1>

          <div className="detail-meta">
            <span>{product.quantity}</span>
            <span>{product.category}</span>
          </div>

          <div className="detail-price">
            ₹{price.toLocaleString("en-IN")}
          </div>

          {product.description && (
            <p className="detail-description">
              {product.description}
            </p>
          )}

          <div className="detail-actions">

            <button
              className={\`primary-button \${selected ? "added" : ""}\`}
              onClick={() => addItem(product)}
            >
              {selected ? (
                <>
                  <Check size={19} />
                  Added to My List
                </>
              ) : (
                <>
                  <Plus size={19} />
                  Add to My List
                </>
              )}
            </button>

            <button
              className="secondary-button"
              onClick={() => navigate("/my-list")}
            >
              View My List
            </button>

          </div>

          <div className="product-reference">
            <div>Product ID: {product.id}</div>

            {product.skuUniqueID && (
              <div>SKU: {product.skuUniqueID}</div>
            )}

            {product.articleNumber && (
              <div>Article: {product.articleNumber}</div>
            )}
          </div>

        </div>

      </section>

    </main>
  );
}
`);

/* =========================================================
   APP ROUTES
========================================================= */

write("src/App.jsx", `
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import {
  Home as HomeIcon,
  Search,
  ShoppingCart,
  History as HistoryIcon,
  Mic
} from "lucide-react";

import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";

function Header() {
  return (
    <>
      <header className="top-header">

        <div className="brand-logo">
          <span className="brand-mark">G</span>
          <span>GHARLIST</span>
        </div>

        <nav className="desktop-nav">

          <NavLink to="/" end>Home</NavLink>

          <NavLink to="/products">
            Products
          </NavLink>

          <NavLink to="/voice">
            Voice
          </NavLink>

          <NavLink to="/my-list">
            My List
          </NavLink>

          <NavLink to="/history">
            History
          </NavLink>

        </nav>

      </header>

      <nav className="mobile-nav">

        <NavLink to="/" end>
          <HomeIcon size={21} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/products">
          <Search size={21} />
          <span>Search</span>
        </NavLink>

        <NavLink to="/voice">
          <Mic size={21} />
          <span>Voice</span>
        </NavLink>

        <NavLink to="/my-list">
          <ShoppingCart size={21} />
          <span>My List</span>
        </NavLink>

        <NavLink to="/history">
          <HistoryIcon size={21} />
          <span>History</span>
        </NavLink>

      </nav>
    </>
  );
}

function Placeholder({ title }) {
  return (
    <main className="page">
      <section className="empty-state">
        <h1>{title}</h1>
        <p>This flow screen will be connected next.</p>
      </section>
    </main>
  );
}

function Home() {
  return (
    <main className="page home-page">

      <section className="hero">

        <div>
          <span className="eyebrow">
            SMART FAMILY SHOPPING
          </span>

          <h1>
            Your family list.
            <br />
            <span>Made simple.</span>
          </h1>

          <p>
            Search thousands of products, add what you need,
            and finish your shopping list in seconds.
          </p>

          <NavLink
            to="/products"
            className="primary-button"
          >
            Browse 5,188 Products
          </NavLink>
        </div>

      </section>

    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>

      <Header />

      <Routes>

        <Route path="/" element={<Home />} />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/product/:id"
          element={<ProductDetail />}
        />

        <Route
          path="/voice"
          element={<Placeholder title="Voice Shopping" />}
        />

        <Route
          path="/my-list"
          element={<Placeholder title="My List" />}
        />

        <Route
          path="/report"
          element={<Placeholder title="Shopping Report" />}
        />

        <Route
          path="/share"
          element={<Placeholder title="Share & Print" />}
        />

        <Route
          path="/history"
          element={<Placeholder title="Shopping History" />}
        />

        <Route
          path="/new-list"
          element={<Placeholder title="New List" />}
        />

      </Routes>

    </BrowserRouter>
  );
}
`);

/* =========================================================
   CSS ADDITIONS
========================================================= */

const cssPath = path.join(root, "src/styles/index.css");

let css = fs.existsSync(cssPath)
  ? fs.readFileSync(cssPath, "utf8")
  : "";

css += `

/* =========================================================
   GHARLIST 5,188 PRODUCT CATALOG
========================================================= */

.product-image-button {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.product-image-fallback {
  width: 100%;
  height: 100%;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef8f2;
  color: #07883f;
}

.catalog-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 24px 0;
  flex-wrap: wrap;
}

.catalog-search {
  flex: 1;
  min-width: 280px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
  border: 1px solid #dce7e0;
  border-radius: 16px;
  background: #fff;
}

.catalog-search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  font-size: 15px;
  background: transparent;
}

.catalog-toolbar select {
  min-width: 190px;
  padding: 13px 14px;
  border: 1px solid #dce7e0;
  border-radius: 14px;
  background: #fff;
  font: inherit;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.active-filters button {
  border: 1px solid #b9dfc8;
  background: #edf9f1;
  color: #087c3b;
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
}

.load-more-wrap {
  display: flex;
  justify-content: center;
  padding: 36px 0 18px;
}

.load-more-button {
  border: 0;
  border-radius: 14px;
  background: #07883f;
  color: white;
  padding: 14px 24px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  gap: 12px;
  align-items: center;
}

.load-more-button span {
  opacity: .8;
  font-weight: 500;
}

.catalog-end {
  text-align: center;
  color: #68776e;
  padding: 24px;
}

.product-detail-page {
  max-width: 1180px;
  margin: auto;
}

.back-button {
  border: 0;
  background: transparent;
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  color: #087c3b;
  font-weight: 700;
  margin-bottom: 24px;
}

.product-detail {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(320px, 1fr);
  gap: 60px;
  background: white;
  border: 1px solid #e0e9e4;
  border-radius: 28px;
  padding: 36px;
}

.detail-image {
  min-height: 480px;
  border-radius: 22px;
  background: #f2f8f4;
  overflow: hidden;
}

.detail-product-image {
  width: 100%;
  height: 480px;
  object-fit: contain;
}

.detail-info {
  padding: 24px 0;
}

.detail-info h1 {
  font-size: clamp(28px, 4vw, 44px);
  line-height: 1.08;
  margin: 10px 0 18px;
}

.detail-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.detail-meta span {
  padding: 8px 12px;
  border-radius: 999px;
  background: #edf7f0;
  color: #496056;
}

.detail-price {
  font-size: 32px;
  font-weight: 800;
  color: #075f30;
  margin: 28px 0 18px;
}

.detail-description {
  color: #617168;
  line-height: 1.7;
}

.detail-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 30px;
}

.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 12px 20px;
  border-radius: 14px;
  text-decoration: none;
  font-weight: 750;
  cursor: pointer;
}

.primary-button {
  background: #07883f;
  color: white;
  border: 0;
}

.secondary-button {
  background: white;
  color: #087c3b;
  border: 1px solid #b9dfc8;
}

.product-reference {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e5ebe7;
  color: #7a887f;
  font-size: 13px;
  line-height: 1.9;
}

.loading-state {
  min-height: 50vh;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #087c3b;
}

@media (max-width: 760px) {

  .catalog-toolbar {
    display: grid;
    grid-template-columns: 1fr;
  }

  .catalog-search {
    min-width: 0;
  }

  .catalog-toolbar select {
    width: 100%;
  }

  .product-detail {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 18px;
  }

  .detail-image {
    min-height: 320px;
  }

  .detail-product-image {
    height: 320px;
  }

}
`;

fs.writeFileSync(cssPath, css, "utf8");

console.log("");
console.log("==============================================");
console.log(" GHARLIST PRODUCT ENGINE UPDATED");
console.log("==============================================");
console.log("5,188 products: ENABLED");
console.log("Dynamic categories: ENABLED");
console.log("Search: ENABLED");
console.log("Brand filter: ENABLED");
console.log("Pagination: 40 products/load");
console.log("SKU image resolver: ENABLED");
console.log("Product detail: ENABLED");
console.log("==============================================");

try {
  execSync("npm run build", {
    stdio: "inherit"
  });
} catch {
  process.exit(1);
}
