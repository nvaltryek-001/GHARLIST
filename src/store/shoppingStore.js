import { create } from "zustand";

const STORAGE_KEY = "gharlist-current-list";

const safeQty = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
};

const safePrice = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

function normalizeItem(item) {
  if (!item || typeof item !== "object") return null;

  if (item.product && typeof item.product === "object") {
    return {
      product: item.product,
      quantity: safeQty(item.quantity)
    };
  }

  if (item.productId) {
    const price = safePrice(item.price);
    return {
      product: {
        id: item.productId,
        name: item.name || "Product",
        brand: item.brand || "",
        image: item.image || "",
        quantity: item.unit || "",
        salePrice: price,
        mpp: price
      },
      quantity: safeQty(item.quantity)
    };
  }

  if (item.id) {
    const product = { ...item };
    const quantity = safeQty(
      item.shoppingQuantity ?? item.cartQuantity ?? 1
    );
    delete product.shoppingQuantity;
    delete product.cartQuantity;
    return { product, quantity };
  }

  return null;
}

function loadItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeItem).filter(Boolean) : [];
  } catch  {
    return [];
  }
}

function saveItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export const useShoppingStore = create((set, get) => ({
  items: loadItems(),

  addItem: (product, quantity = 1) => set((state) => {
    if (!product?.id) return state;
    const addQty = safeQty(quantity);
    const exists = state.items.some((item) => item?.product?.id === product.id);
    const items = exists ? state.items.map((item) => item?.product?.id === product.id ? { ...item, quantity: safeQty(item.quantity) + addQty } : item) : [...state.items, { product, quantity: addQty }];
    saveItems(items);
    return { items };
  }),

  removeItem: (id) => set((state) => {
    const items = state.items.filter((item) => item?.product?.id !== id);
    saveItems(items);
    return { items };
  }),

  increment: (id) => set((state) => {
    const items = state.items.map((item) => item?.product?.id === id ? { ...item, quantity: safeQty(item.quantity) + 1 } : item);
    saveItems(items);
    return { items };
  }),

  decrement: (id) => set((state) => {
    const items = state.items.map((item) => item?.product?.id === id ? { ...item, quantity: Math.max(1, safeQty(item.quantity) - 1) } : item);
    saveItems(items);
    return { items };
  }),

  setQuantity: (id, quantity) => set((state) => {
    const items = state.items.map((item) => item?.product?.id === id ? { ...item, quantity: safeQty(quantity) } : item);
    saveItems(items);
    return { items };
  }),

  clearList: () => {
    saveItems([]);
    set({items: []});
  },

  totalUnits: () => get().items.reduce((sum, item) => sum + safeQty(item?.quantity), 0),

  totalAmount: () => get().items.reduce((sum, item) => {
    const product = item?.product || {};
    const price = safePrice(product.salePrice ?? product.price ?? product.mrp);
    return sum + price * safeQty(item?.quantity);
  }, 0),

  increase: (id) => get().increment(id),
  decrease: (id) => get().decrement(id),
  clear: () => get().clearList()
}));
