"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Clock, TrendingUp } from "lucide-react";
import { formatPrice } from "@/lib/shopify";

const POPULAR_SEARCHES = [
  "Candles",
  "Vanilla",
  "Lavender",
  "Gift Sets",
  "Soy Wax",
  "Home Fragrance",
];

const RECENT_SEARCHES_KEY = "lumiere_recent_searches";
const MAX_RECENT = 5;

function getRecentSearches() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(query) {
  if (typeof window === "undefined") return;
  try {
    const recent = getRecentSearches().filter((s) => s !== query);
    recent.unshift(query);
    localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(recent.slice(0, MAX_RECENT))
    );
  } catch {
    // ignore
  }
}

export default function SearchOverlay({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  const fetchResults = useCallback(async (searchQuery) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      const data = await res.json();
      setResults(data.products || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(value), 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleSuggestionClick = (term) => {
    saveRecentSearch(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
    onClose();
  };

  const handleProductClick = (handle) => {
    if (query.trim()) saveRecentSearch(query.trim());
    router.push(`/products/${handle}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Search panel */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-x-0 top-0 z-50 bg-background shadow-lg"
          >
            {/* Search input area */}
            <div className="mx-auto max-w-3xl px-4 py-6">
              <form onSubmit={handleSubmit} className="relative">
                <Search className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  placeholder="What are you looking for?"
                  className="w-full border-b border-border bg-transparent py-3 pl-8 pr-10 font-serif text-lg tracking-wide outline-none placeholder:text-muted-foreground/60 focus:border-warm"
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
              </form>

              {/* Content area */}
              <div className="mt-6 max-h-[60vh] overflow-y-auto pb-6">
                {query.trim().length >= 2 ? (
                  /* Search results */
                  <div>
                    {loading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="flex animate-pulse items-center gap-4"
                          >
                            <div className="h-14 w-14 rounded bg-secondary" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 w-2/3 rounded bg-secondary" />
                              <div className="h-3 w-1/4 rounded bg-secondary" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : results.length > 0 ? (
                      <div>
                        <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          Products
                        </p>
                        <div className="space-y-1">
                          {results.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => handleProductClick(product.handle)}
                              className="flex w-full items-center gap-4 rounded-lg p-2 text-left transition-colors hover:bg-secondary/50"
                            >
                              {product.image ? (
                                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-muted">
                                  <Image
                                    src={product.image.url}
                                    alt={
                                      product.image.altText || product.title
                                    }
                                    fill
                                    className="object-cover"
                                    sizes="56px"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded bg-secondary text-[10px] text-muted-foreground">
                                  No img
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="truncate font-serif text-sm tracking-wide">
                                  {product.title}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {formatPrice(
                                    product.price.amount,
                                    product.price.currencyCode
                                  )}
                                </p>
                              </div>
                              <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={handleSubmit}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:border-warm hover:text-foreground"
                        >
                          View all results for &ldquo;{query}&rdquo;
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="font-serif text-sm text-muted-foreground">
                          No products found for &ldquo;{query}&rdquo;
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/60">
                          Try a different search term
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Suggestions */
                  <div className="space-y-6">
                    {/* Recent searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <p className="mb-3 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Recent Searches
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((term) => (
                            <button
                              key={term}
                              onClick={() => handleSuggestionClick(term)}
                              className="rounded-full border border-border px-3.5 py-1.5 text-xs tracking-wide transition-colors hover:border-warm hover:text-warm"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular searches */}
                    <div>
                      <p className="mb-3 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        Popular Searches
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_SEARCHES.map((term) => (
                          <button
                            key={term}
                            onClick={() => handleSuggestionClick(term)}
                            className="rounded-full border border-border px-3.5 py-1.5 text-xs tracking-wide transition-colors hover:border-warm hover:bg-warm/5 hover:text-warm"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
