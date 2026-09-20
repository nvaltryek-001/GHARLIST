import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buildReport } from "../services/reportService.js";
import {
  addHistory,
  setStorageItem
} from "../services/storageService.js";
import {
  Minus,
  Plus,
  Trash2,
  FileText,
  ShoppingCart
} from "lucide-react";

import { useShoppingStore } from "../store/shoppingStore.js";
import ProductImage from "../components/ProductImage.jsx";

function safeQuantity(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 1) {
    return 1;
  }

  return Math.floor(number);
}

function safePrice(product) {
  const number = Number(
    product?.salePrice ??
    product?.price ??
    product?.mrp ??
    0
  );

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return number;
}

export default function MyList() {
  const navigate = useNavigate();

  const items = useShoppingStore(
    (state) => state.items
  );

  const increment = useShoppingStore(
    (state) => state.increment
  );

  const decrement = useShoppingStore(
    (state) => state.decrement
  );

  const removeItem = useShoppingStore(
    (state) => state.removeItem
  );

  const clearList = useShoppingStore(
    (state) => state.clearList
  );

  /*
   * Repair any old/corrupted localStorage entries
   * by updating the store through normal actions.
   */
  useEffect(() => {
    // The store already normalizes legacy data.
  }, []);

  const totalQuantity = items.reduce(
    (sum, item) =>
      sum + safeQuantity(item?.quantity),
    0
  );

  const totalAmount = items.reduce(
    (sum, item) => {
      const product = item?.product || {};

      return (
        sum +
        safePrice(product) *
          safeQuantity(item?.quantity)
      );
    },
    0
  );

  const handleReport = () => {
    if (!items.length) {
      return;
    }

    const report = buildReport(items);

    setStorageItem(
      "gharlist-last-report",
      report
    );

    addHistory(report);

    navigate("/report", {
      state: {
        report
      }
    });
  };

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">
            GHARLIST
          </span>

          <h1>My Shopping List</h1>

          <p>
            Review your products and quantities
            before generating the report.
          </p>
        </div>
      </section>

      {!items.length ? (
        <section className="empty-state">
          <ShoppingCart size={48} />

          <h2>Your list is empty</h2>

          <p>
            Add products from the catalog or use
            Voice Shopping.
          </p>

          <Link
            to="/products"
            className="primary-button"
          >
            Browse Products
          </Link>
        </section>
      ) : (
        <>
          <section className="shopping-list">
            {items.map((item) => {
              const product = item?.product || {};
              const quantity =
                safeQuantity(item?.quantity);

              const price =
                safePrice(product);

              const lineTotal =
                price * quantity;

              return (
                <article
                  className="shopping-list-item"
                  key={product.id}
                >
                  <div className="shopping-list-image">
                    <ProductImage
                      product={product}
                    />
                  </div>

                  <div className="shopping-list-info">
                    <span className="product-brand">
                      {product.brand || "GHARLIST"}
                    </span>

                    <h2>
                      {product.name ||
                        "Product"}
                    </h2>

                    <p className="product-unit">
                      {product.quantity ||
                        "Standard pack"}
                    </p>

                    <strong className="product-price">
                      ₹{price.toFixed(0)}
                    </strong>
                  </div>

                  <div className="shopping-list-actions">
                    <div className="quantity-control">
                      <button
                        type="button"
                        onClick={() =>
                          decrement(product.id)
                        }
                        aria-label={`Decrease ${product.name}`}
                      >
                        <Minus size={20} />
                      </button>

                      <strong>
                        {quantity}
                      </strong>

                      <button
                        type="button"
                        onClick={() =>
                          increment(product.id)
                        }
                        aria-label={`Increase ${product.name}`}
                      >
                        <Plus size={20} />
                      </button>
                    </div>

                    <strong className="line-total">
                      ₹{lineTotal.toFixed(0)}
                    </strong>

                    <button
                      type="button"
                      className="remove-button"
                      onClick={() =>
                        removeItem(product.id)
                      }
                      aria-label={`Remove ${product.name}`}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="list-summary">
            <div>
              <span>Total Items</span>
              <strong>{items.length}</strong>
            </div>

            <div>
              <span>Total Quantity</span>
              <strong>{totalQuantity}</strong>
            </div>

            <div>
              <span>Total Amount</span>
              <strong>
                ₹{totalAmount.toFixed(0)}
              </strong>
            </div>
          </section>

          <section className="list-footer-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={clearList}
            >
              Clear List
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={handleReport}
            >
              <FileText size={20} />
              Generate Report
            </button>
          </section>
        </>
      )}
    </main>
  );
}

