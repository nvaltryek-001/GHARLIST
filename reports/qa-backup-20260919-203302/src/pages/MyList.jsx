import {
  Minus,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  ShoppingCart
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import ProductImage from "../components/ProductImage.jsx";

import {
  useShoppingStore
} from "../store/shoppingStore.js";

import {
  buildReport
} from "../services/reportService.js";

import {
  addHistory,
  setStorageItem
} from "../services/storageService.js";

function getProduct(item) {
  return item?.product || item;
}

function getId(item) {
  return item?.product?.id || item?.id;
}

function getQuantity(item) {
  return Number(item?.quantity || 1);
}

function getPrice(item) {
  const product = getProduct(item);

  return Number(
    product?.salePrice ??
    product?.mrp ??
    0
  );
}

export default function MyList() {

  const navigate = useNavigate();

  const items =
    useShoppingStore(
      state => state.items
    );

  const increment =
    useShoppingStore(
      state => state.increment
    );

  const decrement =
    useShoppingStore(
      state => state.decrement
    );

  const removeItem =
    useShoppingStore(
      state => state.removeItem
    );

  const clearList =
    useShoppingStore(
      state => state.clearList
    );

  const totalUnits =
    useShoppingStore(
      state => state.totalUnits
    );

  const totalAmount =
    useShoppingStore(
      state => state.totalAmount
    );

  function finishShopping() {

    if (!items.length) {
      return;
    }

    const report =
      buildReport(items);

    addHistory(report);

    setStorageItem(
      "gharlist-last-report",
      report
    );

    clearList();

    navigate(
      "/report",
      {
        state: { report }
      }
    );
  }

  if (!items.length) {

    return (

      <main className="page-shell">

        <section className="list-empty">

          <div className="empty-icon">
            <ShoppingCart size={34} />
          </div>

          <span className="eyebrow">
            MY LIST
          </span>

          <h1>
            Your shopping list is empty
          </h1>

          <p>
            Add products from the catalog or use voice shopping.
          </p>

          <div className="empty-actions">

            <button
              className="primary-button"
              onClick={() =>
                navigate("/products")
              }
            >
              Browse Products
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                navigate("/voice")
              }
            >
              🎙️ Shop by Voice
            </button>

          </div>

        </section>

      </main>

    );
  }

  return (

    <main className="page-shell list-page">

      <div className="list-header">

        <div>

          <span className="eyebrow">
            SHOPPING LIST
          </span>

          <h1>
            My List
          </h1>

          <p>
            {totalUnits()} items ·{" "}
            {items.length} products
          </p>

        </div>

        <button
          className="secondary-button"
          onClick={() => {
            if (
              window.confirm(
                "Clear your current shopping list?"
              )
            ) {
              clearList();
            }
          }}
        >
          Clear List
        </button>

      </div>

      <div className="list-layout">

        <section className="shopping-items">

          {items.map(item => {

            const product =
              getProduct(item);

            const id =
              getId(item);

            const quantity =
              getQuantity(item);

            const price =
              getPrice(item);

            return (

              <article
                className="shopping-item"
                key={id}
              >

                <div className="shopping-item-image">
                  <ProductImage
                    product={product}
                  />
                </div>

                <div className="shopping-item-info">

                  <span className="product-brand">
                    {product.brand || "DMart"}
                  </span>

                  <h3>
                    {product.name}
                  </h3>

                  <small>
                    {product.quantity || "1 Unit"}
                  </small>

                  <strong>
                    ₹{price.toLocaleString("en-IN")}
                  </strong>

                </div>

                <div className="quantity-control">

                  <button
                    onClick={() =>
                      decrement(id)
                    }
                  >
                    <Minus size={16} />
                  </button>

                  <span>
                    {quantity}
                  </span>

                  <button
                    onClick={() =>
                      increment(id)
                    }
                  >
                    <Plus size={16} />
                  </button>

                </div>

                <strong className="line-total">
                  ₹{(
                    price * quantity
                  ).toLocaleString("en-IN")}
                </strong>

                <button
                  className="remove-button"
                  onClick={() =>
                    removeItem(id)
                  }
                  aria-label="Remove product"
                >
                  <Trash2 size={18} />
                </button>

              </article>

            );

          })}

        </section>

        <aside className="list-summary">

          <span className="eyebrow">
            LIST SUMMARY
          </span>

          <h2>
            Shopping Total
          </h2>

          <div className="summary-row">
            <span>Products</span>
            <strong>{items.length}</strong>
          </div>

          <div className="summary-row">
            <span>Total units</span>
            <strong>{totalUnits()}</strong>
          </div>

          <div className="summary-total">
            <span>Total</span>
            <strong>
              ₹{Number(
                totalAmount()
              ).toLocaleString("en-IN")}
            </strong>
          </div>

          <button
            className="primary-button full"
            onClick={finishShopping}
          >
            <CheckCircle2 size={19} />
            Done & Generate Report
          </button>

          <button
            className="back-button"
            onClick={() =>
              navigate("/products")
            }
          >
            <ArrowLeft size={17} />
            Continue Shopping
          </button>

        </aside>

      </div>

    </main>

  );
}
