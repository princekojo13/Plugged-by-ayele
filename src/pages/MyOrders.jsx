import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, Package, Loader2, Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

const STATUS_LABELS = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  shipped: "Shipped from UK",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLORS = {
  pending: "bg-orange-100 text-orange-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function MyOrders() {
  const remembered = typeof window !== "undefined" ? localStorage.getItem("pba_myemail") || "" : "";
  const [email, setEmail] = useState(remembered);
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lookup = async (emailToUse) => {
    if (!emailToUse.trim()) return;
    setLoading(true);
    setError("");
    setOrders(null);
    try {
      const res = await base44.functions.invoke("lookup-order", { email: emailToUse.trim() });
      setOrders(res.data?.orders || []);
      localStorage.setItem("pba_myemail", emailToUse.trim());
    } catch (e) {
      setError(e?.message || "Could not fetch orders");
    } finally {
      setLoading(false);
    }
  };

  // Auto-lookup if we already know this customer's email
  useEffect(() => {
    if (email) lookup(email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = query.trim() || email;
    if (value) {
      setEmail(value);
      lookup(value);
    }
  };

  const inputVal = query || email;

  return (
    <div className="bg-white">
      <div className="bg-carbon text-white py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-pink font-semibold mb-3">My Orders</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-3">Order History & Updates</h1>
          <p className="text-white/60 text-sm">
            Enter the email you used at checkout to see your orders, order codes, and delivery status updates.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={inputVal}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="your@email.com"
              className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-carbon text-white font-bold uppercase tracking-wider text-sm hover:bg-pink transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Find"}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-md text-center mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {orders && orders.length === 0 && !loading && (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No orders found for this email.</p>
            <Link to="/shop" className="inline-block mt-4 text-sm font-semibold text-pink hover:text-carbon">
              Start shopping →
            </Link>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.order_number || o.id} className="border border-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-carbon">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.created_date ? new Date(o.created_date).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded",
                      STATUS_COLORS[o.status]
                    )}
                  >
                    {STATUS_LABELS[o.status] || o.status}
                  </span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {o.items?.map((it, i) => (
                    <div key={i} className="flex items-center gap-2 bg-london/50 px-2 py-1.5 rounded shrink-0">
                      <div className="w-8 h-8 bg-london rounded overflow-hidden">
                        {it.image && (
                          <Image src={it.image} alt={it.name} className="w-full h-full object-cover" fittingType="fill" />
                        )}
                      </div>
                      <div className="text-xs">
                        <p className="font-medium text-carbon max-w-[120px] truncate">{it.name}</p>
                        <p className="text-muted-foreground">Qty {it.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-bold text-carbon">₵{o.total?.toFixed(2)}</span>
                    <span className="text-muted-foreground mx-2">•</span>
                    <span className="text-muted-foreground">{o.delivery_region}</span>
                  </div>
                  <Link to={`/track-order?order=${encodeURIComponent(o.order_number)}`} className="text-xs font-semibold text-pink hover:text-carbon">
                    Track →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {!orders && !loading && !error && (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Enter your email above to view your orders and status updates.</p>
          </div>
        )}
      </div>
    </div>
  );
}