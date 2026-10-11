import { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut, Mail, MapPin, Package, Phone, RefreshCw, ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const TABS = ["Orders", "Messages"];

function dateLabel(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function money(value) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 2 }).format(Number(value) || 0);
}

export default function AssistantWorkspace() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("Orders");
  const [orders, setOrders] = useState([]);
  const [itemsByOrder, setItemsByOrder] = useState({});
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");

    const [ordersResult, contactResult, wholesaleResult] = await Promise.all([
      supabase.from("orders").select("id,order_number,customer_name,customer_email,customer_phone,whatsapp_number,delivery_address,delivery_instructions,delivery_region,total,payment_method,payment_status,order_status,created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("contact_messages").select("id,name,email,phone,message,status,created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("wholesale_inquiries").select("id,name,business_name,email,phone,message,status,created_at").order("created_at", { ascending: false }).limit(100),
    ]);

    const firstError = ordersResult.error || contactResult.error || wholesaleResult.error;
    if (firstError) {
      setError(firstError.message || "Could not load assistant information.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const nextOrders = ordersResult.data || [];
    setOrders(nextOrders);
    setMessages([
      ...(contactResult.data || []).map((message) => ({ ...message, kind: "Customer message" })),
      ...(wholesaleResult.data || []).map((message) => ({ ...message, kind: "Wholesale inquiry", name: message.business_name ? `${message.name} · ${message.business_name}` : message.name })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));

    if (nextOrders.length) {
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("order_id,product_name_snapshot,quantity")
        .in("order_id", nextOrders.map((order) => order.id));
      if (itemsError) setError(itemsError.message || "Could not load order items.");
      else {
        const grouped = {};
        for (const item of orderItems || []) {
          (grouped[item.order_id] ||= []).push(item);
        }
        setItemsByOrder(grouped);
      }
    } else {
      setItemsByOrder({});
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const unreadCount = useMemo(() => messages.filter((message) => message.status === "new").length, [messages]);

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111111]">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff1f8f]">Plugged by Ayeley</p><h1 className="font-heading text-2xl font-bold">Assistant workspace</h1><p className="text-sm text-black/45">Signed in as {user?.email || "assistant"} · Read-only access</p></div>
          <button type="button" onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold hover:border-[#ff1f8f]"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex rounded-xl border border-black/[0.07] bg-white p-1">
            {TABS.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${tab === item ? "bg-[#ff1f8f] text-white" : "text-black/55 hover:bg-black/[0.04]"}`}>{item}{item === "Messages" && unreadCount > 0 ? ` (${unreadCount} new)` : ""}</button>)}
          </div>
          <button type="button" onClick={() => void loadData(true)} disabled={loading || refreshing} className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold hover:border-[#ff1f8f] disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</button>
        </div>

        {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {loading ? <div className="py-20 text-center text-sm text-black/45">Loading…</div> : tab === "Orders" ? (
          <section className="space-y-4">
            {orders.length ? orders.map((order) => <article key={order.id} className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-[#e60078]">{order.order_number}</p><h2 className="mt-1 text-lg font-bold">{order.customer_name}</h2><p className="mt-1 text-xs text-black/40">{dateLabel(order.created_at)}</p></div>
                <div className="text-right"><p className="font-bold">{money(order.total)}</p><p className="mt-1 text-xs capitalize text-black/50">{order.order_status || "pending"} · {order.payment_status || "pending"}</p></div>
              </div>
              <div className="mt-4 grid gap-4 border-t border-black/[0.06] pt-4 sm:grid-cols-2">
                <div className="space-y-2 text-sm text-black/65"><a className="flex items-center gap-2 hover:text-[#e60078]" href={`tel:${order.customer_phone}`}><Phone className="h-4 w-4" />{order.customer_phone}</a><a className="flex items-center gap-2 break-all hover:text-[#e60078]" href={`mailto:${order.customer_email}`}><Mail className="h-4 w-4" />{order.customer_email}</a><p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{order.delivery_address}{order.delivery_instructions ? ` · ${order.delivery_instructions}` : ""}</p></div>
                <div className="space-y-2 text-sm text-black/60"><p className="flex items-center gap-2 font-semibold text-black/75"><Package className="h-4 w-4" />Items</p>{(itemsByOrder[order.id] || []).map((item, index) => <p key={`${order.id}-${index}`}>{item.quantity} × {item.product_name_snapshot}</p>)}{!itemsByOrder[order.id]?.length && <p>Item details unavailable</p>}</div>
              </div>
            </article>) : <EmptyState icon={<ShoppingBag className="h-6 w-6" />} text="No orders to show." />}
          </section>
        ) : (
          <section className="space-y-4">
            {messages.length ? messages.map((message) => <article key={`${message.kind}-${message.id}`} className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-[#fff0f7] px-3 py-1 text-xs font-semibold text-[#e60078]">{message.kind}</span><h2 className="mt-3 text-lg font-bold">{message.name}</h2><p className="mt-1 text-xs text-black/40">{dateLabel(message.created_at)} · {message.status}</p></div></div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-black/65">{message.message}</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-black/[0.06] pt-4 text-sm text-black/55">{message.email && <a href={`mailto:${message.email}`} className="inline-flex items-center gap-2 hover:text-[#e60078]"><Mail className="h-4 w-4" />{message.email}</a>}{message.phone && <a href={`tel:${message.phone}`} className="inline-flex items-center gap-2 hover:text-[#e60078]"><Phone className="h-4 w-4" />{message.phone}</a>}</div>
            </article>) : <EmptyState icon={<Mail className="h-6 w-6" />} text="No messages to show." />}
          </section>
        )}
        <p className="mt-7 text-center text-xs text-black/35">Assistant accounts can view these records only. Contact the store administrator to request a correction or update.</p>
      </main>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return <div className="rounded-2xl border border-dashed border-black/15 bg-white py-16 text-center text-sm text-black/45"><span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff0f7] text-[#ff1f8f]">{icon}</span>{text}</div>;
}
