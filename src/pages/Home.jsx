import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Truck, BadgeCheck, ShowerHead, Pill, Cookie, SprayCan, Sparkles, Scissors, Package } from "lucide-react";
import { Image } from "@/components/ui/image";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/lib/useProducts";
import { CATEGORIES, SITE_CONFIG } from "@/lib/siteConfig";

const HERO_IMG = "https://media.base44.com/images/public/6a9032c7fdae0734b2a29bb2/4b8448183_generated_image.png";
const STORY_IMG = "https://media.base44.com/images/public/6a9032c7fdae0734b2a29bb2/6ea5c619f_generated_image.png";

const CATEGORY_ICONS = {
  "Toiletries": ShowerHead,
  "Supplements": Pill,
  "Snacks": Cookie,
  "Perfumes": SprayCan,
  "Beauty & Skincare": Sparkles,
  "Hair Care": Scissors,
  "Other Products": Package,
};

function SectionHeader({ title, subtitle, link }) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        {subtitle && <p className="text-xs uppercase tracking-[0.2em] text-pink font-semibold mb-2">{subtitle}</p>}
        <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-carbon">{title}</h2>
      </div>
      {link && (
        <Link to={link} className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-carbon hover:text-pink transition-colors group">
          View All
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}

function ProductRow({ products, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-london animate-pulse" />
        ))}
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border">
        <p className="text-sm text-muted-foreground">New products coming soon — check back shortly.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.slice(0, 4).map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export default function Home() {
  const featured = useProducts({ featured: true, limit: 8 });
  const bestSellers = useProducts({ best_seller: true, limit: 8 });
  const newArrivals = useProducts({ new_arrival: true, limit: 8, sort: "-created_date" });
  const specialOffers = useProducts({ special_offer: true, limit: 8 });

  return (
    <div>
      {/* HERO */}
      <section className="relative bg-carbon text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-0 items-stretch min-h-[80vh]">
            <div className="flex flex-col justify-center py-16 lg:py-0 lg:pr-12 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 mb-6">
                <span className="w-10 h-px bg-pink" />
                <span className="text-xs uppercase tracking-[0.3em] text-pink font-semibold">{SITE_CONFIG.ukSourced}</span>
              </div>
              <h1 className="font-heading font-black text-5xl sm:text-6xl lg:text-7xl leading-[0.95] mb-4 text-balance">
                UK Source.
                <br />
                <span className="text-pink">Ghana Soul.</span>
              </h1>
              <p className="text-lg sm:text-xl text-white/70 mb-2 font-heading italic">{SITE_CONFIG.tagline}</p>
              <p className="text-sm text-white/50 max-w-md mb-8 leading-relaxed">
                Authentic, original products sourced directly from the UK and delivered to your door across Ghana.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-pink text-white font-bold uppercase tracking-wider text-sm hover:bg-white hover:text-carbon transition-colors"
                >
                  Shop Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/special-offers"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/30 text-white font-bold uppercase tracking-wider text-sm hover:border-pink hover:text-pink transition-colors"
                >
                  Special Offers
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-10 text-xs text-white/50">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-pink" /> 100% Original</span>
                <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-pink" /> Ghana-Wide Delivery</span>
                <span className="flex items-center gap-1.5"><BadgeCheck className="w-4 h-4 text-pink" /> Trusted Source</span>
              </div>
            </div>
            <div className="relative order-1 lg:order-2 min-h-[40vh] lg:min-h-0">
              <Image
                src={HERO_IMG}
                alt="Premium UK-sourced products"
                className="w-full h-full object-cover"
                fittingType="fill"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-carbon via-carbon/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Shop by Category" subtitle="Browse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] || Package;
              return (
                <Link
                  key={cat.slug}
                  to={`/shop?category=${encodeURIComponent(cat.slug)}`}
                  className="group relative bg-london hover:bg-carbon transition-colors duration-300 p-6 sm:p-8 flex flex-col items-start justify-between min-h-[140px] overflow-hidden"
                >
                  <Icon className="w-7 h-7 text-carbon group-hover:text-pink transition-colors" />
                  <h3 className="font-heading font-semibold text-sm sm:text-base text-carbon group-hover:text-white transition-colors mt-4">
                    {cat.name}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-pink opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 right-6" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="py-16 sm:py-20 bg-london/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Featured Products" subtitle="Handpicked" link="/shop" />
          <ProductRow products={featured.data || []} loading={featured.isLoading} />
        </div>
      </section>

      {/* UK SOURCED STORY */}
      <section className="py-16 sm:py-24 bg-carbon text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image src={STORY_IMG} alt="UK-sourced products" className="w-full h-full object-cover" fittingType="fill" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-pink font-semibold mb-4">Our Promise</p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6 leading-tight">
                Original Products,<br />Sourced Directly from the UK
              </h2>
              <p className="text-white/70 leading-relaxed mb-6">
                Every product at Plugged by Ayeley is carefully sourced from trusted UK retailers. We bring you the same authentic quality you'd find on the high streets of London — delivered straight to you anywhere in Ghana.
              </p>
              <div className="space-y-4">
                {[
                  { icon: ShieldCheck, title: "100% Original", desc: "Genuine products from verified UK sources" },
                  { icon: Truck, title: "Reliable Delivery", desc: "Shipped to Ghana and delivered nationwide" },
                  { icon: BadgeCheck, title: "Quality You Can Trust", desc: "Every item checked before it reaches you" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-pink/20 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-pink" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-0.5">{item.title}</h4>
                      <p className="text-sm text-white/50">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 mt-8 text-sm font-bold uppercase tracking-wider text-pink hover:text-white transition-colors"
              >
                Learn More About Us <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Best Sellers" subtitle="Customer Favourites" link="/shop" />
          <ProductRow products={bestSellers.data || []} loading={bestSellers.isLoading} />
        </div>
      </section>

      {/* SPECIAL OFFERS BANNER */}
      <section className="py-16 sm:py-20 bg-london/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Special Offers" subtitle="Limited Time" link="/special-offers" />
          <ProductRow products={specialOffers.data || []} loading={specialOffers.isLoading} />
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="New Arrivals" subtitle="Just Landed" link="/shop" />
          <ProductRow products={newArrivals.data || []} loading={newArrivals.isLoading} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-carbon text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-pink font-semibold mb-4">Stay Plugged In</p>
          <h2 className="font-heading text-3xl sm:text-5xl font-bold mb-6 text-balance">
            Ready to shop authentic<br />UK-sourced products?
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">
            Browse our full catalogue and have your favourites delivered anywhere in Ghana.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-10 py-4 bg-pink text-white font-bold uppercase tracking-wider text-sm hover:bg-white hover:text-carbon transition-colors"
          >
            View Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}