import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, Search } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/lib/useProducts";
import { CATEGORIES } from "@/lib/siteConfig";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "-created_date", label: "Newest First" },
  { value: "name", label: "Name: A to Z" },
  { value: "-name", label: "Name: Z to A" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "-created_date";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const filterTag = searchParams.get("filter") || "";

  const productParams = { sort, limit: 200 };
  if (category) productParams.category = category;
  const { data: allProducts, isLoading } = useProducts(productParams);

  const filtered = useMemo(() => {
    if (!allProducts) return [];
    let items = [...allProducts];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
      );
    }
    if (minPrice) items = items.filter((p) => (p.sale_price || p.price) >= Number(minPrice));
    if (maxPrice) items = items.filter((p) => (p.sale_price || p.price) <= Number(maxPrice));
    if (filterTag === "best_seller") items = items.filter((p) => p.best_seller);
    if (filterTag === "new_arrival") items = items.filter((p) => p.new_arrival);
    if (filterTag === "special_offer") items = items.filter((p) => p.special_offer || (p.sale_price && p.sale_price < p.price));
    return items;
  }, [allProducts, search, minPrice, maxPrice, filterTag]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParam("search", searchInput);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchInput("");
  };

  const activeFilterCount = [category, search, minPrice, maxPrice, filterTag].filter(Boolean).length;

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-london/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-xs uppercase tracking-[0.2em] text-pink font-semibold mb-2">The Collection</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-carbon">
            {category || (filterTag === "special_offer" ? "Special Offers" : "All Products")}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{filtered.length} product{filtered.length !== 1 ? "s" : ""} found</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 bg-london border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink"
            />
          </form>
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-border rounded-md text-sm font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && <span className="bg-pink text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>}
          </button>
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="hidden sm:block px-4 py-2.5 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Quick filter tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => updateParam("filter", filterTag === "best_seller" ? "" : "best_seller")}
            className={cn("px-4 py-1.5 text-xs font-semibold uppercase tracking-wider border rounded-full transition-colors", filterTag === "best_seller" ? "bg-carbon text-white border-carbon" : "border-border hover:border-carbon")}
          >
            Best Sellers
          </button>
          <button
            onClick={() => updateParam("filter", filterTag === "new_arrival" ? "" : "new_arrival")}
            className={cn("px-4 py-1.5 text-xs font-semibold uppercase tracking-wider border rounded-full transition-colors", filterTag === "new_arrival" ? "bg-carbon text-white border-carbon" : "border-border hover:border-carbon")}
          >
            New Arrivals
          </button>
          <button
            onClick={() => updateParam("filter", filterTag === "special_offer" ? "" : "special_offer")}
            className={cn("px-4 py-1.5 text-xs font-semibold uppercase tracking-wider border rounded-full transition-colors", filterTag === "special_offer" ? "bg-pink text-white border-pink" : "border-border hover:border-pink hover:text-pink")}
          >
            Special Offers
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar filters - desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <FilterPanel
              category={category}
              minPrice={minPrice}
              maxPrice={maxPrice}
              updateParam={updateParam}
              clearFilters={clearFilters}
            />
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-london animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg font-heading font-semibold text-carbon mb-2">No products found</p>
                <p className="text-sm text-muted-foreground mb-6">Try adjusting your filters or search.</p>
                <button onClick={clearFilters} className="px-6 py-2.5 bg-carbon text-white text-sm font-semibold rounded-md hover:bg-pink transition-colors">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-carbon/40" onClick={() => setShowFilters(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-white flex flex-col animate-fade-up">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-heading font-bold">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-london rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <FilterPanel
                category={category}
                minPrice={minPrice}
                maxPrice={maxPrice}
                updateParam={updateParam}
                clearFilters={clearFilters}
              />
              <div className="mt-6">
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Sort By</label>
                <select
                  value={sort}
                  onChange={(e) => updateParam("sort", e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-md text-sm bg-white"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-border">
              <button onClick={() => setShowFilters(false)} className="w-full py-3 bg-carbon text-white font-semibold text-sm rounded-md">
                Show {filtered.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPanel({ category, minPrice, maxPrice, updateParam, clearFilters }) {
  return (
    <div className="space-y-8">
      <div>
        <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-carbon mb-3">Categories</h4>
        <div className="space-y-1.5">
          <button
            onClick={() => updateParam("category", "")}
            className={cn("block w-full text-left py-1.5 text-sm transition-colors", !category ? "text-pink font-semibold" : "text-muted-foreground hover:text-carbon")}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => updateParam("category", cat.slug)}
              className={cn("block w-full text-left py-1.5 text-sm transition-colors", category === cat.slug ? "text-pink font-semibold" : "text-muted-foreground hover:text-carbon")}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-carbon mb-3">Price Range (GHS)</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateParam("minPrice", e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateParam("maxPrice", e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink"
          />
        </div>
      </div>
      <button onClick={clearFilters} className="text-xs font-semibold uppercase tracking-wider text-pink hover:text-carbon transition-colors">
        Clear All Filters
      </button>
    </div>
  );
}