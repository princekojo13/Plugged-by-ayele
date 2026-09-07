import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, Search, ArrowRight, Bell, ShowerHead, Pill, Cookie, SprayCan, Sparkles, Scissors, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import { useCart } from "@/lib/cartContext";
import { CATEGORIES, SITE_CONFIG } from "@/lib/siteConfig";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const searchRef = useRef(null);
  useEffect(() => {
    if (!searchOpen) return;
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [searchOpen]);

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Shop", path: "/shop" },
    { label: "Special Offers", path: "/special-offers" },
    { label: "Track Order", path: "/track-order" },
    { label: "My Orders", path: "/my-orders" },
    { label: "About", path: "/about" },
    { label: "Wholesale", path: "/wholesale" },
    { label: "Contact", path: "/contact" },
  ];

  const CATEGORY_ICONS = {
    "Toiletries": ShowerHead,
    "Supplements": Pill,
    "Snacks": Cookie,
    "Perfumes": SprayCan,
    "Beauty & Skincare": Sparkles,
    "Hair Care": Scissors,
    "Other Products": Package,
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      {/* Ticker */}
      <div className="bg-carbon text-white overflow-hidden">
        <div className="flex whitespace-nowrap animate-ticker py-1.5">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center shrink-0">
              {["Original UK-Sourced Products", "Delivered Across Ghana", "Stay Plugged In", "Authenticity Guaranteed"].map((text, j) => (
                <span key={j} className="flex items-center text-[11px] font-medium tracking-wider uppercase px-6">
                  {text}
                  <span className="ml-6 text-pink">◆</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <header className={cn("sticky top-0 z-50 bg-white transition-shadow", scrolled ? "shadow-md" : "border-b border-border")}>
        <div ref={searchRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setOpen(true)}
                className="lg:hidden p-2 hover:bg-london rounded-md transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Logo />
            </div>

            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-pink",
                    location.pathname === link.path ? "text-pink" : "text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSearchOpen((s) => !s)}
                className="p-2 hover:bg-london rounded-md transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <Link
                to="/my-orders"
                className="relative p-2 hover:bg-london rounded-md transition-colors"
                aria-label="My Orders & Notifications"
              >
                <Bell className="w-5 h-5" />
              </Link>
              <Link
                to="/cart"
                className="relative p-2 hover:bg-london rounded-md transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-pink text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {searchOpen && (
            <form onSubmit={handleSearch} className="pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 bg-london border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink"
                />
              </div>
            </form>
          )}
        </div>

        {/* Categories bar */}
        <div className="hidden lg:block border-t border-border bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6 py-2.5 overflow-x-auto scrollbar-hide">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold shrink-0">Shop Categories</span>
              {CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.slug] || Package;
                return (
                  <Link
                    key={cat.slug}
                    to={`/shop?category=${encodeURIComponent(cat.slug)}`}
                    className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-pink transition-colors whitespace-nowrap"
                  >
                    <Icon className="w-3.5 h-3.5 text-pink" />
                    {cat.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-carbon/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-white flex flex-col animate-fade-up">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <Logo />
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-london rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-5">
              <Link
                to="/shop"
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-carbon text-white font-bold uppercase tracking-wider text-sm rounded-md mb-5"
              >
                Shop All Products <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Categories</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {CATEGORIES.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.slug] || Package;
                  return (
                    <Link
                      key={cat.slug}
                      to={`/shop?category=${encodeURIComponent(cat.slug)}`}
                      className="flex items-center gap-2 p-3 bg-london rounded-md text-sm font-medium hover:bg-carbon hover:text-white transition-colors"
                    >
                      <Icon className="w-4 h-4 text-pink shrink-0" />
                      <span className="truncate">{cat.name}</span>
                    </Link>
                  );
                })}
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Pages</p>
              <div className="space-y-0.5">
                {navLinks.filter(l => l.path !== "/shop").map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="flex items-center justify-between py-2.5 text-sm font-medium hover:text-pink transition-colors"
                  >
                    {link.label}
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </nav>
            <div className="p-5 border-t border-border">
              <a
                href={`tel:${SITE_CONFIG.phone}`}
                className="block w-full text-center py-3 bg-pink text-white rounded-md font-semibold text-sm"
              >
                Call Us
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}