import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Package, ArrowRight, Loader2, Phone, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { SITE_CONFIG } from "@/lib/siteConfig";

export default function Wholesale() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", products: "", quantity: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await base44.entities.WholesaleInquiry.create({ ...form, status: "new" });
      try {
        await base44.functions.invoke("notify-team", { type: "wholesale", ...form });
      } catch (e) {
        // enquiry saved — email alert is non-critical
      }
      setSent(true);
      setForm({ name: "", email: "", phone: "", company: "", products: "", quantity: "", message: "" });
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-carbon text-white py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-pink/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-8 h-8 text-pink" />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-pink font-semibold mb-4">Wholesale Enquiries</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-4">Buy in Bulk</h1>
          <p className="text-white/70 max-w-xl mx-auto">
            Interested in purchasing our UK-sourced products in larger quantities? We offer wholesale options for businesses and resellers across Ghana.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Info */}
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-carbon mb-4">Wholesale with Plugged by Ayeley</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Whether you're a retailer, reseller, or business owner, we can supply you with original UK-sourced products at competitive wholesale rates. Get in touch with us directly to discuss your needs.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "Original UK-sourced products in bulk",
                  "Competitive wholesale pricing",
                  "Reliable supply and delivery across Ghana",
                  "Direct support from our team",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink mt-0.5 shrink-0" />
                    <span className="text-sm text-carbon">{item}</span>
                  </div>
                ))}
              </div>
              <a
                href={`tel:${SITE_CONFIG.phone}`}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-pink text-white font-bold uppercase tracking-wider text-sm hover:bg-carbon transition-colors"
              >
                <Phone className="w-4 h-4" /> Call Us for Wholesale
              </a>
            </div>

            {/* Form */}
            <div className="bg-london/50 border border-border p-6 sm:p-8">
              {sent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-carbon mb-2">Enquiry Sent!</h3>
                  <p className="text-sm text-muted-foreground mb-6">Thank you for your interest. Our team will contact you shortly to discuss wholesale options.</p>
                  <button onClick={() => setSent(false)} className="text-sm font-semibold text-pink hover:text-carbon transition-colors">
                    Submit another enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="font-heading text-xl font-bold text-carbon">Wholesale Enquiry Form</h3>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">Full Name *</label>
                    <input value={form.name} onChange={(e) => set("name", e.target.value)} required className="ck-input" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">Phone / WhatsApp *</label>
                      <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} required className="ck-input" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">Email</label>
                      <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="ck-input" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">Company / Business Name</label>
                    <input value={form.company} onChange={(e) => set("company", e.target.value)} className="ck-input" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">Products of Interest</label>
                      <input value={form.products} onChange={(e) => set("products", e.target.value)} placeholder="e.g. Perfumes, Supplements" className="ck-input" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">Estimated Quantity</label>
                      <input value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="e.g. 50+ units" className="ck-input" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">Message *</label>
                    <textarea value={form.message} onChange={(e) => set("message", e.target.value)} required rows={4} placeholder="Tell us about your wholesale needs..." className="ck-input" />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-carbon text-white font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-pink transition-colors disabled:opacity-60"
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <>Submit Enquiry <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}