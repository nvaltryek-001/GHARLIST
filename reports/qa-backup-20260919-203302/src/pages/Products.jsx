import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SlidersHorizontal, Search } from "lucide-react";
import ProductGrid from "../components/ProductGrid.jsx";
import { loadProducts } from "../services/productService.js";

const PAGE_SIZE = 40;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    loadProducts()
      .then(data => {
        if (mounted) {
          setProducts(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, category, brand]);

  const categories = useMemo(() => {
    return [
      ...new Set(
        products
          .map(p => p.category)
          .filter(Boolean)
      )
    ].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [products]);

  const brands = useMemo(() => {
    return [
      ...new Set(
        products
          .map(p => p.brand)
          .filter(Boolean)
      )
    ].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products.filter(product => {
      const matchesQuery =
        !q ||
        [
          product.name,
          product.brand,
          product.category,
          product.subcategory,
          product.quantity,
          product.description
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesCategory =
        !category ||
        product.category === category;

      const matchesBrand =
        !brand ||
        product.brand === brand;

      return (
        matchesQuery &&
        matchesCategory &&
        matchesBrand
      );
    });
  }, [
    products,
    query,
    category,
    brand
  ]);

  const visibleProducts =
    filtered.slice(0, visible);

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setBrand("");
  };

  if (loading) {
    return (
      <main className="page-shell">
        <div className="loading-state">
          Loading 5,188 products...
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell products-page">

      <div className="products-heading">
        <div>
          <p className="eyebrow">
            GHARLIST CATALOG
          </p>

          <h1>All Products</h1>

          <p className="muted">
            {filtered.length.toLocaleString()} products available
          </p>
        </div>

        {(query || category || brand) && (
          <button
            className="button secondary"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      <section className="catalog-toolbar">

        <div className="catalog-search">
          <Search size={19} />

          <input
            value={query}
            onChange={e =>
              setQuery(e.target.value)
            }
            placeholder="Search products, brands..."
          />
        </div>

        <div className="filter-control">
          <SlidersHorizontal size={18} />

          <select
            value={category}
            onChange={e =>
              setCategory(e.target.value)
            }
          >
            <option value="">
              All Categories
            </option>

            {categories.map(item => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-control">
          <select
            value={brand}
            onChange={e =>
              setBrand(e.target.value)
            }
          >
            <option value="">
              All Brands
            </option>

            {brands.map(item => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </div>

      </section>

      {(category || brand) && (
        <div className="active-filters">

          {category && (
            <button
              onClick={() => setCategory("")}
            >
              Category: {category} ×
            </button>
          )}

          {brand && (
            <button
              onClick={() => setBrand("")}
            >
              Brand: {brand} ×
            </button>
          )}

        </div>
      )}

      {visibleProducts.length ? (
        <>
          <ProductGrid
            products={visibleProducts}
          />

          {visible < filtered.length && (
            <div className="load-more-wrap">
              <button
                className="button primary"
                onClick={() =>
                  setVisible(v =>
                    v + PAGE_SIZE
                  )
                }
              >
                Load More
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <h2>No products found</h2>

          <p>
            Try another search or clear the filters.
          </p>

          <button
            className="button primary"
            onClick={clearFilters}
          >
            Show All Products
          </button>
        </div>
      )}

    </main>
  );
}
