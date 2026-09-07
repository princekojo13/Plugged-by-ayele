import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Package, Truck, Check, Clock, X, ShoppingBag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import OrderTrackMap from "@/components/OrderTrackMap";

const LOCAL_STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: Check },
  { key: "delivered", label: "Delivered", icon: Truck },
];

const UK_STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: Check },
  { key: "shipped", label: "Shipped from UK", icon: Package },
  { key: "delivered", label: "Delivered", icon: Truck },
];


export default function TrackOrder() {
  const [params] = useSearchParams();
  const [orderId, setOrderId] = useState(() => params.get("order") || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runTrack = async (query) => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await base44.functions.invoke("lookup-order", { order_number: query.trim() });
      const list = res.data?.orders || [];
      if (!list.length) throw new Error("Order not found");
      setOrder(list[0]);
    } catch (err) {
      setError("Order not found. Please check your Order Number and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = (e) => {
    e.preventDefault();
    runTrack(orderId);
  };

  // Auto-track when an order number is passed in the URL (e.g. from My Orders)
  useEffect(() => {
    const q = params.get("order");
    if (q) runTrack(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusSteps = order?.fulfillment_type === "uk_shipping" ? UK_STEPS : LOCAL_STEPS;
  const currentStepIndex = order ? statusSteps.findIndex((s) => s.key === order.status) : -1;
  const isCancelled = order?.status === "cancelled";

  return (
    <div className="bg-white">
      <div className="bg-carbon text-white py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-pink font-semibold mb-3">Order Tracking</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-3">Track Your Order
</h1>
          <p className="text-white/60 text-sm">Enter your Order Number (e.g. PBA-10001) to see the status of your UK-sourced delivery</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <form onSubmit={handleTrack} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter your Order Number (e.g. PBA-10001)"
            className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink" />
            
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-carbon text-white font-bold uppercase tracking-wider text-sm hover:bg-pink transition-colors disabled:opacity-50">
            
            {loading ? "..." : "Track"}
          </button>
        </form>

        {error &&
        <div className="bg-red-50 border border-red-200 p-4 rounded-md text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        }

        {order &&
        <div className="space-y-6">
            <div className="bg-london/50 border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Order Number</p>
                  <p className="font-mono text-sm font-semibold text-carbon">{order.order_number || order.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
                  <p className="font-heading font-bold text-lg text-carbon">₵{order.total?.toFixed(2)}</p>
                </div>
              </div>

              {isCancelled ?
            <div className="flex items-center gap-3 text-red-600 py-4">
                  <X className="w-5 h-5" />
                  <span className="font-semibold">This order has been cancelled</span>
                </div> :

            <div className="relative">
                  {statusSteps.map((step, i) => {
                const isComplete = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={step.key} className="flex items-start gap-4 pb-8 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                        isComplete ? "bg-pink border-pink text-white" : "bg-white border-border text-muted-foreground"
                      )}>
                            <step.icon className="w-4 h-4" />
                          </div>
                          {i < statusSteps.length - 1 &&
                      <div className={cn("w-0.5 h-8 mt-1", isComplete ? "bg-pink" : "bg-border")} />
                      }
                        </div>
                        <div className="pt-2">
                          <p className={cn("font-semibold text-sm", isComplete ? "text-carbon" : "text-muted-foreground")}>
                            {step.label}
                          </p>
                          {isCurrent && <p className="text-xs text-pink mt-0.5">Current status</p>}
                        </div>
                      </div>);

              })}
                </div>
            }
            </div>

            <OrderTrackMap order={order} />

            <div className="border border-border p-6">
              <h3 className="font-heading font-bold text-carbon mb-4">Order Details</h3>
              <div className="space-y-3 mb-4">
                {order.items?.map((item, i) =>
              <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-london rounded overflow-hidden shrink-0">
                      {item.image && <Image src={item.image} alt={item.name} className="w-full h-full object-cover" fittingType="fill" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-carbon">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-carbon">₵{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
              )}
              </div>
              <div className="border-t border-border pt-4 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">₵{order.subtotal?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span className="font-medium">₵{order.delivery_fee?.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-carbon pt-1.5"><span>Total</span><span>₵{order.total?.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="border border-border p-6">
              <h3 className="font-heading font-bold text-carbon mb-4">Delivery Information</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Region:</span> <span className="font-medium text-carbon">{order.delivery_region}</span></p>
                <p><span className="text-muted-foreground">Fulfilment:</span> <span className="font-medium text-carbon">{order.fulfillment_type === "uk_shipping" ? "Ships from UK (10–21 days)" : "In stock — same/next-day delivery"}</span></p>
                <p><span className="text-muted-foreground">Payment:</span> <span className="font-medium text-carbon">{order.payment_method === "online" ? "Paid Online" : "Pay on Delivery"}</span></p>
              </div>
            </div>

            <div className="text-center">
              <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-pink hover:text-carbon transition-colors">
                <ShoppingBag className="w-4 h-4" /> Continue Shopping
              </Link>
            </div>
          </div>
        }

        {!order && !error && !loading &&
        <div className="text-center py-16">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Enter your Order Number above to track your shipment</p>
            <p className="text-xs text-muted-foreground/60 mt-2">You can find your Order Number (e.g. PBA-10001) in your order confirmation</p>
          </div>
        }
      </div>
    </div>);

}