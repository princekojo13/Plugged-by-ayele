import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Smartphone, ShieldCheck, ArrowLeft, Loader2, MapPin } from "lucide-react";
import { useCart } from "@/lib/cartContext";
import { base44 } from "@/api/base44Client";
import { SITE_CONFIG, ACCRA_HUB, haversineKm, deliveryFeeFromDistance } from "@/lib/siteConfig";
import LocationPicker from "@/components/LocationPicker";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState(null);
  const [location, setLocation] = useState(null);
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    delivery_region: "Greater Accra",
    delivery_address: "",
    digital_address: "",
    momo_number: "",
    momo_network: "MTN",
  });

  const distanceKm = location ? haversineKm(ACCRA_HUB[0], ACCRA_HUB[1], location.lat, location.lng) : 0;
  const deliveryFee = location ? deliveryFeeFromDistance(distanceKm) : 0;
  const total = subtotal + deliveryFee;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (items.length === 0) { setError("Your cart is empty."); return; }
    if (!location) { setError("Please pin your exact delivery location on the map."); return; }
    if (!form.momo_number.trim()) { setError("Please enter your Mobile Money number."); return; }

    setSubmitting(true);
    try {
      const orderItems = items.map((i) => ({
        product_id: i.product_id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
      }));
      const res = await base44.functions.invoke("create-order", {
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        delivery_region: form.delivery_region,
        delivery_address: form.delivery_address,
        digital_address: form.digital_address,
        delivery_lat: location.lat,
        delivery_lng: location.lng,
        momo_number: form.momo_number,
        momo_network: form.momo_network,
        items: orderItems,
        subtotal,
        delivery_fee: deliveryFee,
        total,
      });
      const order = res.data?.order;
      if (!order) throw new Error(res.data?.error || "Failed to place order");
      if (form.customer_email) localStorage.setItem("pba_myemail", form.customer_email.trim());
      clearCart();
      localStorage.setItem("pba_has_purchased", "true");
      setPlaced(order);
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-carbon mb-3">Order Placed Successfully!</h1>
        <p className="text-muted-foreground mb-2">Thank you, {placed.customer_name}. Your order has been received.</p>
        <p className="text-sm text-muted-foreground mb-8">
          Order reference: <span className="font-mono font-semibold text-carbon">{placed.order_number || placed.id}</span>
        </p>

        <div className="bg-london/50 border border-border p-6 text-left mb-8">
          <div className="flex justify-between mb-3">
            <span className="text-sm text-muted-foreground">Payment</span>
            <span className="text-sm font-semibold text-carbon">MoMo on Delivery</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-sm text-muted-foreground">MoMo Number</span>
            <span className="text-sm font-semibold text-carbon">{placed.momo_number} ({placed.momo_network})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Order Total</span>
            <span className="text-sm font-bold text-carbon">₵{placed.total.toFixed(2)}</span>
          </div>
          <div className="mt-4 p-4 bg-pink/10 border border-pink/30 text-sm">
            <p className="font-semibold text-carbon mb-1">Pay on Delivery</p>
            <p className="text-muted-foreground">
              Please have <strong>₵{placed.total.toFixed(2)}</strong> ready on <strong>{placed.momo_number}</strong> ({placed.momo_network}) when your order arrives.
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">We'll contact you on {placed.customer_phone} to confirm your order and delivery details.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={`/track-order?order=${encodeURIComponent(placed.order_number || "")}`} className="px-8 py-3 bg-pink text-white font-bold uppercase tracking-wider text-sm hover:bg-carbon transition-colors">
            Track My Order
          </Link>
          <Link to="/shop" className="px-8 py-3 border border-carbon font-bold uppercase tracking-wider text-sm hover:bg-carbon hover:text-white transition-colors">
            Continue Shopping
          </Link>
          <a href={`tel:${SITE_CONFIG.phone}`} className="px-8 py-3 border border-carbon font-bold uppercase tracking-wider text-sm hover:bg-carbon hover:text-white transition-colors">
            Call Us
          </a>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-heading text-3xl font-bold text-carbon mb-3">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">Add some products before checking out.</p>
        <Link to="/shop" className="px-8 py-3.5 bg-carbon text-white font-bold uppercase tracking-wider text-sm hover:bg-pink transition-colors">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-semibold text-carbon hover:text-pink transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </Link>
      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-carbon mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Contact */}
          <section>
            <h2 className="font-heading text-xl font-bold text-carbon mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-carbon text-white rounded-full flex items-center justify-center text-sm">1</span>
              Contact Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name *" required>
                <input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} required className="ck-input" />
              </Field>
              <Field label="Phone Number *" required>
                <input type="tel" value={form.customer_phone} onChange={(e) => set("customer_phone", e.target.value)} required className="ck-input" />
              </Field>
              <Field label="Email (optional)" className="sm:col-span-2">
                <input type="email" value={form.customer_email} onChange={(e) => set("customer_email", e.target.value)} className="ck-input" />
              </Field>
            </div>
          </section>

          {/* Delivery location */}
          <section>
            <h2 className="font-heading text-xl font-bold text-carbon mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-carbon text-white rounded-full flex items-center justify-center text-sm">2</span>
              Delivery Location
            </h2>
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-pink" /> Pin your exact delivery location on the map so we can calculate your delivery fee.
            </p>
            <LocationPicker value={location} onChange={setLocation} />
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <Field label="Region" required>
                <select value={form.delivery_region} onChange={(e) => set("delivery_region", e.target.value)} required className="ck-input">
                  {SITE_CONFIG.ghanaRegions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field label="Digital Address (GhanaPost GPS)">
                <input value={form.digital_address} onChange={(e) => set("digital_address", e.target.value)} placeholder="e.g. GA-144-7392" className="ck-input" />
              </Field>
              <Field label="Street / Landmark (optional)" className="sm:col-span-2">
                <textarea value={form.delivery_address} onChange={(e) => set("delivery_address", e.target.value)} rows={2} placeholder="House number, landmark, city..." className="ck-input" />
              </Field>
            </div>
          </section>

          {/* MoMo */}
          <section>
            <h2 className="font-heading text-xl font-bold text-carbon mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-carbon text-white rounded-full flex items-center justify-center text-sm">3</span>
              Mobile Money (Pay on Delivery)
            </h2>
            <div className="flex items-start gap-3 p-4 bg-pink/5 border-l-4 border-pink mb-4">
              <Smartphone className="w-5 h-5 text-pink mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">We accept Mobile Money only, paid when your order is delivered. Enter your MoMo number below — our rider will request payment on arrival.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="MoMo Number *" required>
                <input type="tel" value={form.momo_number} onChange={(e) => set("momo_number", e.target.value)} required placeholder="e.g. 024 000 0000" className="ck-input" />
              </Field>
              <Field label="MoMo Network *" required>
                <select value={form.momo_network} onChange={(e) => set("momo_network", e.target.value)} required className="ck-input">
                  <option value="MTN">MTN MoMo</option>
                  <option value="Telecel">Telecel Cash</option>
                  <option value="AirtelTigo">AirtelTigo Money</option>
                </select>
              </Field>
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-london/50 border border-border p-6 sticky top-28">
            <h2 className="font-heading text-xl font-bold text-carbon mb-4">Your Order</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.product_id} className="flex gap-3 text-sm">
                  <div className="w-12 h-12 bg-london shrink-0 overflow-hidden">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-carbon truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-carbon">₵{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">₵{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-semibold">{location ? `₵${deliveryFee.toFixed(2)}` : "Pin location"}</span>
              </div>
              {location && <p className="text-xs text-muted-foreground">{distanceKm.toFixed(1)} km from Accra hub · ₵10 per 7 km</p>}
            </div>
            <div className="border-t border-border mt-4 pt-4 flex justify-between items-baseline">
              <span className="font-heading font-bold text-lg text-carbon">Total</span>
              <span className="font-heading font-bold text-2xl text-carbon">₵{total.toFixed(2)}</span>
            </div>

            {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 py-3.5 bg-pink text-white font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-carbon transition-colors disabled:opacity-60"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order...</> : <>Place Order</>}
            </button>

            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-pink" /> Secure checkout
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, className }) {
  return (
    <div className={className}>
      <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">{label}</label>
      {children}
    </div>
  );
}