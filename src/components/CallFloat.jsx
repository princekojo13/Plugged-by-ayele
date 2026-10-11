import React, { useState } from "react";
import { Phone, X } from "lucide-react";
import { SITE_CONFIG } from "@/lib/siteConfig";

export default function CallFloat() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {expanded && (
        <div className="bg-white rounded-lg shadow-xl border border-border p-4 max-w-xs animate-fade-up">
          <div className="flex items-start justify-between mb-2">
            <p className="font-heading font-bold text-sm text-carbon">Call us</p>
            <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Have a question about our UK-sourced products or your order? We're here to help.
          </p>
          <a
            href={`tel:${SITE_CONFIG.phone}`}
            className="block w-full text-center py-2.5 bg-pink text-white rounded-md font-semibold text-sm hover:bg-carbon transition-colors"
          >
            Call {SITE_CONFIG.phone}
          </a>
        </div>
      )}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-14 h-14 rounded-full bg-pink text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform pulse-momo"
        aria-label="Call us"
      >
        {expanded ? <X className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
      </button>
    </div>
  );
}