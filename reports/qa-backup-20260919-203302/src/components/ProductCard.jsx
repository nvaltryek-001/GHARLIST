
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
        onClick={() => navigate(`/product/${product.id}`)}
        aria-label={`View ${product.name}`}
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
          onClick={() => navigate(`/product/${product.id}`)}
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
            className={`add-button ${selected ? "added" : ""}`}
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
