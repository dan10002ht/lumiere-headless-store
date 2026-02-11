import { create } from "zustand";
import { createCart, addToCart, updateCart, removeFromCart } from "@/lib/shopify";

const useCartStore = create((set, get) => ({
  cart: null,
  isOpen: false,
  loading: false,

  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  initCart: async () => {
    const storedCartId =
      typeof window !== "undefined" ? localStorage.getItem("cartId") : null;

    if (storedCartId) {
      set({ cart: { id: storedCartId } });
      return;
    }

    try {
      const cart = await createCart();
      set({ cart });
      localStorage.setItem("cartId", cart.id);
    } catch (error) {
      console.error("Failed to create cart:", error);
    }
  },

  addItem: async (variantId, quantity = 1) => {
    const { cart } = get();
    set({ loading: true });

    try {
      let cartId = cart?.id;

      if (!cartId) {
        const newCart = await createCart();
        cartId = newCart.id;
        localStorage.setItem("cartId", cartId);
      }

      const updatedCart = await addToCart(cartId, [
        { merchandiseId: variantId, quantity },
      ]);

      set({ cart: updatedCart, loading: false, isOpen: true });
    } catch (error) {
      console.error("Failed to add item:", error);
      set({ loading: false });
    }
  },

  updateItemQuantity: async (lineId, quantity) => {
    const { cart } = get();
    if (!cart?.id) return;

    set({ loading: true });

    try {
      if (quantity <= 0) {
        const updatedCart = await removeFromCart(cart.id, [lineId]);
        set({ cart: updatedCart, loading: false });
      } else {
        const updatedCart = await updateCart(cart.id, [
          { id: lineId, quantity },
        ]);
        set({ cart: updatedCart, loading: false });
      }
    } catch (error) {
      console.error("Failed to update item:", error);
      set({ loading: false });
    }
  },

  removeItem: async (lineId) => {
    const { cart } = get();
    if (!cart?.id) return;

    set({ loading: true });

    try {
      const updatedCart = await removeFromCart(cart.id, [lineId]);
      set({ cart: updatedCart, loading: false });
    } catch (error) {
      console.error("Failed to remove item:", error);
      set({ loading: false });
    }
  },

  getCartLines: () => {
    const { cart } = get();
    return cart?.lines?.edges?.map((edge) => edge.node) || [];
  },

  getCartTotal: () => {
    const { cart } = get();
    return cart?.cost?.subtotalAmount?.amount || "0";
  },

  getCartCurrency: () => {
    const { cart } = get();
    return cart?.cost?.subtotalAmount?.currencyCode || "USD";
  },

  getTotalQuantity: () => {
    const { cart } = get();
    return cart?.totalQuantity || 0;
  },

  getCheckoutUrl: () => {
    const { cart } = get();
    return cart?.checkoutUrl || "";
  },
}));

export default useCartStore;
