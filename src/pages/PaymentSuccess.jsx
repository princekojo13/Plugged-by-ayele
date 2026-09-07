import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, ArrowRight, Phone, Loader2 } from "lucide-react";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { base44 } from "@/api/base44Client";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id");
  const ref = params.get("ref");
  const reference = params.get("reference") || params.get("trxref");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(!!orderId);
  const retried = useRef(false);

  const fetchOrder = async (id) => {
    const res = await base44.functions.invoke("lookup-order", { order_id: id });
    const list = res.data?.orders || [];
    return list[0] || null;
  };

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    (async () => {
      try {
        let data = await fetchOrder(orderId);
        if (!active) return;
        // The Paystack webhook may still be processing — retry once if still pending
        if (data && data.status === "pending" && !retried.current) {
          retried.current = true;
          await new Promise((r) => setTimeout(r, 4000));
          data = await fetchOrder(orderId);
          if (!active) return;
        }
        setOrder(data);
        // Only unlock Delivery access once payment is actually confirmed by the webhook
        if (data && data.status !== "pending" && data.status !== "cancelled") {
          localStorage.setItem("pba_has_purchased", "true");
        }
      } catch (e) {
        // non-critical — we still show the reference from the URL
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [orderId]);

  const displayRef = order?.order_number || ref || (reference ? reference.slice(0, 24) : null);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-10 h-10 text-green-600" />
      </div>
      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-carbon mb-3">Payment Successful!</h1>
      <p className="text-muted-foreground mb-2">Thank you for your order. Your payment has been confirmed.</p>
      {displayRef && (
        <p className="text-sm text-muted-foreground mb-8">
          Order reference: <span className="font-mono font-semibold text-carbon">{displayRef}</span>
        </p>
      )}

      <div className="bg-london/50 border border-border p-6 mb-8 text-left">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your order has been received and is now being processed. Our team will contact you on your phone to confirm delivery details. Your UK-sourced products will be delivered to your door across Ghana.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center mb-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : order ? (
        <div className="mb-8 text-left bg-london/50 border border-border p-5">
          <h2 className="font-heading text-lg font-bold text-carbon mb-1">Delivery Address</h2>
          <p className="text-sm text-muted-foreground">
            Your order will be delivered to{" "}
            <strong className="text-carbon">{order.delivery_address}, {order.delivery_region}</strong>. Our team will contact you on your phone to confirm the details before dispatch.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/shop" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-carbon text-white font-bold uppercase tracking-wider text-sm hover:bg-pink transition-colors">
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to={`/track-order?order=${encodeURIComponent(displayRef || "")}`} className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-carbon font-bold uppercase tracking-wider text-sm hover:bg-carbon hover:text-white transition-colors">
          Track My Order
        </Link>
        <a
          href={`tel:${SITE_CONFIG.phone}`}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-carbon font-bold uppercase tracking-wider text-sm hover:bg-carbon hover:text-white transition-colors"
        >
          <Phone className="w-4 h-4" /> Call Us
        </a>
      </div>
    </div>
  );
}