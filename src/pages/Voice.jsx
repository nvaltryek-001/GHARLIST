import { useEffect, useState } from "react";
import {
  Mic,
  MicOff,
  Plus,
  ShoppingCart,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import ProductImage from "../components/ProductImage.jsx";
import { loadProducts } from "../services/productService.js";
import {
  startVoiceRecognition,
  stopVoiceRecognition,
  isVoiceSupported
} from "../services/voiceService.js";
import { useShoppingStore } from "../store/shoppingStore.js";

const LANGUAGES = [
  {
    code: "en-IN",
    label: "English",
    flag: "🇬🇧"
  },
  {
    code: "hi-IN",
    label: "Hindi",
    flag: "🇮🇳"
  },
  {
    code: "kn-IN",
    label: "Kannada",
    flag: "🇮🇳"
  }
];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function productScore(product, query) {

  const q = normalize(query);

  if (!q) return 0;

  const name = normalize(product.name);
  const brand = normalize(product.brand);
  const category = normalize(product.category);
  const subcategory = normalize(product.subcategory);

  let score = 0;

  if (name === q) {
    score += 100;
  }

  if (name.includes(q)) {
    score += 80;
  }

  if (q.includes(name)) {
    score += 60;
  }

  const words = q
    .split(" ")
    .filter(word => word.length >= 2);

  for (const word of words) {

    if (name.includes(word)) {
      score += 14;
    }

    if (brand.includes(word)) {
      score += 8;
    }

    if (category.includes(word)) {
      score += 3;
    }

    if (subcategory.includes(word)) {
      score += 3;
    }
  }

  return score;
}

function findProducts(products, text) {

  if (!text.trim()) {
    return [];
  }

  return products
    .map(product => ({
      product,
      score: productScore(product, text)
    }))
    .filter(item => item.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(item => item.product);
}

export default function Voice() {

  const navigate = useNavigate();

  const addItem =
    useShoppingStore(
      state => state.addItem
    );

  const [products, setProducts] =
    useState([]);

  const [language, setLanguage] =
    useState("en-IN");

  const [transcript, setTranscript] =
    useState("");

  const [matches, setMatches] =
    useState([]);

  const [listening, setListening] =
    useState(false);

  const [added, setAdded] =
    useState(new Set());

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    loadProducts()
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

  }, []);

  function speak() {

    if (!isVoiceSupported()) {

      alert(
        "Voice recognition is not supported. Please use Google Chrome."
      );

      return;
    }

    setListening(true);

    startVoiceRecognition({

      lang: language,

      onResult: result => {

        setTranscript(result);

        const found =
          findProducts(
            products,
            result
          );

        setMatches(found);

      },

      onError: () => {
        setListening(false);
      },

      onEnd: () => {
        setListening(false);
      }

    });
  }

  function stop() {
    stopVoiceRecognition();
    setListening(false);
  }

  function addProduct(product) {

    addItem(product);

    setAdded(prev => {

      const next =
        new Set(prev);

      next.add(product.id);

      return next;

    });
  }

  function addAll() {

    matches.forEach(product => {
      addItem(product);
    });

    setAdded(
      new Set(
        matches.map(
          product => product.id
        )
      )
    );
  }

  return (
    <main className="page-shell voice-page">

      <section className="voice-main">

        <div className="voice-main-copy">

          <span className="eyebrow">
            GHARLIST VOICE SHOPPING
          </span>

          <h1>
            Tell us what you need.
          </h1>

          <p>
            Speak naturally in English, Hindi,
            or Kannada and GHARLIST will find
            matching products.
          </p>

        </div>

        <div className="voice-control">

          <div className="language-tabs">

            {LANGUAGES.map(item => (

              <button
                key={item.code}
                className={
                  language === item.code
                    ? "language-tab active"
                    : "language-tab"
                }
                onClick={() => {
                  setLanguage(item.code);
                  setTranscript("");
                  setMatches([]);
                }}
              >
                {item.flag} {item.label}
              </button>

            ))}

          </div>

          <button
            className={
              listening
                ? "big-mic listening"
                : "big-mic"
            }
            onClick={
              listening
                ? stop
                : speak
            }
          >
            {listening
              ? <MicOff size={42} />
              : <Mic size={42} />}
          </button>

          <strong>
            {listening
              ? "Listening..."
              : "Tap to speak"}
          </strong>

          <span>
            {language}
          </span>

        </div>

      </section>

      <section className="voice-transcript">

        <span>
          YOUR COMMAND
        </span>

        <p>
          {transcript ||
            "Try: “Premia Badam” or “Tata Sampann Dal”"}
        </p>

      </section>

      <section>

        <div className="section-heading">

          <div>
            <span className="eyebrow">
              RESULTS
            </span>

            <h2>
              {loading
                ? "Loading products..."
                : matches.length
                  ? `${matches.length} matches`
                  : "Speak to search"}
            </h2>
          </div>

          {matches.length > 0 && (

            <button
              className="primary-button"
              onClick={addAll}
            >
              <Plus size={18} />
              Add All
            </button>

          )}

        </div>

        {matches.length > 0 ? (

          <div className="voice-results-grid">

            {matches.map(product => {

              const isAdded =
                added.has(product.id);

              return (

                <article
                  className="voice-result-card"
                  key={product.id}
                >

                  <div className="voice-result-image">
                    <ProductImage
                      product={product}
                    />
                  </div>

                  <div className="voice-result-body">

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
                      ₹{Number(
                        product.salePrice ??
                        product.mrp ??
                        0
                      ).toLocaleString("en-IN")}
                    </strong>

                    <button
                      className={
                        isAdded
                          ? "added-button"
                          : "primary-button full"
                      }
                      onClick={() =>
                        addProduct(product)
                      }
                    >
                      {isAdded
                        ? <><CheckCircle2 size={17} /> Added</>
                        : <><Plus size={17} /> Add to List</>}
                    </button>

                  </div>

                </article>

              );

            })}

          </div>

        ) : (

          <div className="voice-empty">

            <Mic size={36} />

            <h3>
              Your shopping list starts with your voice
            </h3>

            <p>
              Select a language and speak a product name.
            </p>

          </div>

        )}

      </section>

      {matches.length > 0 && (

        <div className="center-action">

          <button
            className="primary-button"
            onClick={() =>
              navigate("/my-list")
            }
          >
            <ShoppingCart size={19} />
            View My List
          </button>

        </div>

      )}

    </main>
  );
}
