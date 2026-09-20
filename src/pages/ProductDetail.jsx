
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
              className={`primary-button ${selected ? "added" : ""}`}
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
