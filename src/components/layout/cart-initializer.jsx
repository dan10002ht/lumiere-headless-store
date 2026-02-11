"use client";

import { useEffect } from "react";
import useCartStore from "@/store/cart-store";

export default function CartInitializer() {
  const initCart = useCartStore((state) => state.initCart);

  useEffect(() => {
    initCart();
  }, [initCart]);

  return null;
}
