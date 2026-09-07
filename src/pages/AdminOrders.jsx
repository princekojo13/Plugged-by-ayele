import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, LogIn, ShieldAlert, Package } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import RideManager from "@/components/RideManager";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const STATUS_LABELS = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
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

export default function AdminOrders() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch {
        setUser(null);
      }
      setAuthChecked(true);
    })();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Order.list("-created_date", 100);
      setOrders(list);
    } catch (e) {
      setOrders([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authChecked && user?.role === "admin") loadOrders();
    else if (authChecked) setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, user]);

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await base44.functions.invoke("update-order-status", { orderId, status });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch (e) {
      alert(e?.message || "Failed to update status");
    }
    setUpdating(null);
  };

  if (!authChecked) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-pink mx-auto mb-4" />
        <h1 className="font-heading text-2xl font-bold text-carbon mb-2">Admin Access Required</h1>
        <p className="text-muted-foreground mb-6">Log in with an admin account to manage orders and send delivery notifications.</p>
        <Link to="/login" className="inline-flex items-center gap-2 px-8 py-3 bg-carbon text-white font-bold uppercase tracking-wider text-sm hover:bg-pink transition-colors">
          <LogIn className="w-4 h-4" /> Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="bg-carbon text-white py-10">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-xs uppercase tracking-[0.3em] text-pink font-semibold mb-2">Admin</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">Order Management</h1>
          <p className="text-white/60 text-sm mt-2">Update order status — customers are emailed automatically when an order is marked delivered.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="border border-border p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-carbon">{o.order_number || o.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.created_date ? new Date(o.created_date).toLocaleString() : ""}
                    </p>
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded", STATUS_COLORS[o.status])}>
                    {STATUS_LABELS[o.status] || o.status}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-medium text-carbon">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{o.customer_phone}{o.customer_email ? ` • ${o.customer_email}` : ""}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery</p>
                    <p className="font-medium text-carbon">{o.delivery_region}</p>
                    <p className="text-xs text-muted-foreground">{o.delivery_address}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {o.items?.map((it, i) => (
                    <div key={i} className="flex items-center gap-2 bg-london/50 px-2 py-1 rounded">
                      <div className="w-7 h-7 bg-london rounded overflow-hidden">
                        {it.image && <Image src={it.image} alt={it.name} className="w-full h-full object-cover" fittingType="fill" />}
                      </div>
                      <span className="text-xs font-medium text-carbon">{it.name} ×{it.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-bold text-carbon">₵{o.total?.toFixed(2)}</span>
                    <span className="text-muted-foreground mx-2">•</span>
                    <span className="text-muted-foreground">{o.payment_method === "online" ? "Paid Online" : "Pay on Delivery"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Update status:</label>
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      disabled={updating === o.id}
                      className="text-sm border border-border rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-pink"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                    {updating === o.id && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  </div>
                </div>
                <RideManager order={o} onUpdated={loadOrders} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}