import type { NextConfig } from "next";

function createMemoryStorage() {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
  };
}

function ensureStorage(name: "localStorage" | "sessionStorage") {
  const current = globalThis[name] as Partial<Storage> | undefined;
  if (
    current &&
    typeof current.getItem === "function" &&
    typeof current.setItem === "function" &&
    typeof current.removeItem === "function" &&
    typeof current.clear === "function" &&
    typeof current.key === "function"
  ) {
    return;
  }

  Object.defineProperty(globalThis, name, {
    configurable: true,
    enumerable: true,
    value: createMemoryStorage(),
    writable: true,
  });
}

if (typeof window === "undefined") {
  ensureStorage("localStorage");
  ensureStorage("sessionStorage");
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
