import {
  CheckCircle2,
  ShoppingCart
} from "lucide-react";

import {
  useEffect
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  useShoppingStore
} from "../store/shoppingStore.js";

export default function NewList() {

  const navigate =
    useNavigate();

  const clearList =
    useShoppingStore(
      state => state.clearList
    );

  useEffect(() => {

    clearList();

    const timer =
      setTimeout(() => {
        navigate("/products", {
          replace: true
        });
      }, 400);

    return () =>
      clearTimeout(timer);

  }, [clearList, navigate]);

  return (

    <main className="page-shell">

      <section className="list-empty">

        <div className="empty-icon success">
          <CheckCircle2 size={38} />
        </div>

        <h1>
          New List Ready
        </h1>

        <p>
          Starting a fresh GHARLIST shopping list...
        </p>

        <ShoppingCart size={22} />

      </section>

    </main>

  );
}
