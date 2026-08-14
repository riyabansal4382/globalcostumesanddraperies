import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Costume } from "@/lib/costumes";

export type CartItem = {
  id: string;
  name: string;
  image_url: string;
  rental_price: number | null;
  size: string | null;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  add: (costume: Costume, size?: string | null) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  setSize: (id: string, size: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const STORAGE_KEY = "vv-cart";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = useCallback((costume: Costume, size?: string | null) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === costume.id);
      if (found)
        return prev.map((i) =>
          i.id === costume.id ? { ...i, qty: i.qty + 1 } : i,
        );
      return [
        ...prev,
        {
          id: costume.id,
          name: costume.name,
          image_url: costume.image_url,
          rental_price: costume.rental_price,
          size: size ?? costume.sizes[0] ?? null,
          qty: 1,
        },
      ];
    });
  }, []);

  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((i) => i.id !== id)),
    [],
  );

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, qty } : i)),
    );
  }, []);

  const setSize = useCallback((id: string, size: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, size } : i)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const total = items.reduce(
      (sum, i) => sum + (Number(i.rental_price) || 0) * i.qty,
      0,
    );
    return {
      items,
      count,
      total,
      add,
      remove,
      setQty,
      setSize,
      clear,
      has: (id: string) => items.some((i) => i.id === id),
      open,
      setOpen,
    };
  }, [items, add, remove, setQty, setSize, clear, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
