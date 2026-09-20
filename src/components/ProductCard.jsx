import { useNavigate } from "react-router-dom";
import { Check, Plus } from "lucide-react";

import ProductImage from "./ProductImage.jsx";
import { useShoppingStore } from "../store/shoppingStore.js";

function safePrice(product) {
  const price = Number(
    product?.salePrice ??
    product?.price ??
    product?.mrp ??
    0
  );

  return Number.isFinite(price) && price >= 0 ? price : 0;
}

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  const addItem = useShoppingStore(
    (state) => state.addItem
  );

  const items = useShoppingStore(
    (state) => state.items
  );

  const isAdded =
    Array.isArray(items) &&
    items.some(
      (item) => item?.product?.id === product?.id
    );

  const price = safePrice(product);

  const handleAdd = (event) => {
    event.stopPropagation();

    if (!product?.id || isAdded) {
      return;
    }

    addItem(product, 1);
  };

  const openProduct = () => {
    if (!product?.id) {
      return;
    }

    navigate(`/product/${product.id}`);
  };

  return (
    <article
      className="product-card"
      onClick={openProduct}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          openProduct();
        }
      }}
    >
      <div className="product-card-image">
        <ProductImage product={product} />
      </div>

      <div className="product-card-content">
        <span className="product-brand">
          {product?.brand || "GHARLIST"}
        </span>

        <h3>{product?.name || "Product"}</h3>

        <p className="product-unit">
          {product?.quantity || "Standard pack"}
        </p>

        <div className="product-card-bottom">
          <strong className="product-price">
            ₹{price.toFixed(0)}
          </strong>

          <button
            type="button"
            className={
              isAdded
                ? "add-button added"
                : "add-button"
            }
            onClick={handleAdd}
            aria-label={
              isAdded
                ? `${product?.name || "Product"} already added`
                : `Add ${product?.name || "product"} to list`
            }
            aria-pressed={isAdded}
          >
            {isAdded ? (
              <>
                <Check size={18} />
                Added
              </>
            ) : (
              <>
                <Plus size={18} />
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
