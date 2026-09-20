import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "src/store/shoppingStore.js");

fs.mkdirSync(path.dirname(file), { recursive: true });

fs.writeFileSync(file, `
import { create } from "zustand";
import {
  loadCurrentList,
  saveCurrentList,
  clearCurrentList
} from "../services/storageService";

function getInitialItems() {
  try {
    return loadCurrentList() || [];
  } catch {
    return [];
  }
}

export const useShoppingStore = create((set, get) => ({
  items: getInitialItems(),

  addItem: (product) => {
    const current = get().items;

    const existing = current.find(
      item => String(item.id) === String(product.id)
    );

    let next;

    if (existing) {
      next = current.map(item =>
        String(item.id) === String(product.id)
          ? {
              ...item,
              quantitySelected:
                Number(item.quantitySelected || 1) + 1
            }
          : item
      );
    } else {
      next = [
        ...current,
        {
          ...product,
          quantitySelected: 1
        }
      ];
    }

    saveCurrentList(next);

    set({
      items: next
    });
  },

  removeItem: (productId) => {
    const next = get().items.filter(
      item => String(item.id) !== String(productId)
    );

    saveCurrentList(next);

    set({
      items: next
    });
  },

  increment: (productId) => {
    const next = get().items.map(item =>
      String(item.id) === String(productId)
        ? {
            ...item,
            quantitySelected:
              Number(item.quantitySelected || 1) + 1
          }
        : item
    );

    saveCurrentList(next);

    set({
      items: next
    });
  },

  decrement: (productId) => {
    const next = get().items
      .map(item =>
        String(item.id) === String(productId)
          ? {
              ...item,
              quantitySelected:
                Math.max(
                  1,
                  Number(item.quantitySelected || 1) - 1
                )
            }
          : item
      );

    saveCurrentList(next);

    set({
      items: next
    });
  },

  setQuantity: (productId, quantity) => {
    const value = Math.max(
      1,
      Number(quantity) || 1
    );

    const next = get().items.map(item =>
      String(item.id) === String(productId)
        ? {
            ...item,
            quantitySelected: value
          }
        : item
    );

    saveCurrentList(next);

    set({
      items: next
    });
  },

  clearList: () => {
    clearCurrentList();

    set({
      items: []
    });
  },

  totalUnits: () =>
    get().items.reduce(
      (sum, item) =>
        sum + Number(item.quantitySelected || 1),
      0
    ),

  totalAmount: () =>
    get().items.reduce(
      (sum, item) =>
        sum +
        Number(item.salePrice ?? item.mrp ?? 0) *
        Number(item.quantitySelected || 1),
      0
    )
}));
`, "utf8");

console.log("✓ src/store/shoppingStore.js created");
