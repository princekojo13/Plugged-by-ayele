import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { SITE_CONFIG } from "@/lib/siteConfig";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await base44.entities.ContactMessage.create({ ...form, status: "new" });
      try {
        await base44.functions.invoke("notify-team", { type: "contact", ...form });
      } catch (e) {
        // message saved — email alert is non-critical
      }
      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-carbon text-white py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-pink font-semibold mb-4">Get In Touch</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-white/70 max-w-xl mx-auto">
            Have a question about our products or your order? We're here to help. Reach out and we'll get back to you as soon as possible.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact info */}
            <div>
              <h2 className="font-heading text-2xl font-bold text-carbon mb-6">Contact Details</h2>
              <div className="space-y-5">
                <a href={`mailto:${SITE_CONFIG.email}`} className="flex items-center gap-4 p-4 border border-border hover:border-pink transition-colors group">
                  <div className="w-12 h-12 bg-pink/10 flex items-center justify-center group-hover:bg-pink transition-colors">
                    <Mail className="w-6 h-6 text-pink group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Email</p>
                    <p className="font-semibold text-carbon">{SITE_CONFIG.email}</p>
                  </div>
                </a>
                <a href={`tel:${SITE_CONFIG.phone}`} className="flex items-center gap-4 p-4 border border-border hover:border-pink transition-colors group">
                  <div className="w-12 h-12 bg-pink/10 flex items-center justify-center group-hover:bg-pink transition-colors">
                    <Phone className="w-6 h-6 text-pink group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Phone</p>
                    <p className="font-semibold text-carbon">{SITE_CONFIG.phone}</p>
                  </div>
                </a>
                <div className="flex items-center gap-4 p-4 border border-border">
                  <div className="w-12 h-12 bg-pink/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-pink" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Delivery Area</p>
                    <p className="font-semibold text-carbon">All across Ghana</p>
                  </div>
                </div>
              </div>

              {/* Social */}
              <div className="mt-8">
                <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-carbon mb-4">Follow Us</h3>
                <div className="flex flex-wrap gap-3">
                  {SITE_CONFIG.social.map((s) => (
                    <a
                      key={s.platform}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 border border-border hover:border-pink hover:text-pink transition-colors text-sm font-medium"
                    >
                      <span className="w-7 h-7 rounded-full bg-pink/10 flex items-center justify-center text-xs font-bold text-pink">{s.platform[0]}</span>
                      {s.handle}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Form */}
            <div>
              {sent ? (
                <div className="border border-green-200 bg-green-50 p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-carbon mb-2">Message Sent!</h3>
                  <p className="text-sm text-muted-foreground mb-6">Thank you for reaching out. We'll get back to you shortly.</p>
                  <button onClick={() => setSent(false)} className="text-sm font-semibold text-pink hover:text-carbon transition-colors">
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="font-heading text-2xl font-bold text-carbon mb-2">Send a Message</h2>
                  <p className="text-sm text-muted-foreground mb-4">Fill out the form below and we'll respond as soon as we can.</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">Name *</label>
                      <input value={form.name} onChange={(e) => set("name", e.target.value)} required className="ck-input" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">Phone</label>
                      <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="ck-input" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">Email</label>
                      <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="ck-input" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">Subject</label>
                      <input value={form.subject} onChange={(e) => set("subject", e.target.value)} className="ck-input" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-carbon mb-1.5">Message *</label>
                    <textarea value={form.message} onChange={(e) => set("message", e.target.value)} required rows={5} className="ck-input" />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-pink text-white font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-carbon transition-colors disabled:opacity-60"
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Message</>}
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