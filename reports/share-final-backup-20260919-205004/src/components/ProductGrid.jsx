import ProductCard from "./ProductCard.jsx";

export default function ProductGrid({ products = [] }) {
  if (!products.length) return null;

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
}
