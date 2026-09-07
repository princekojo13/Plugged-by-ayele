import React from "react";
import { Link } from "react-router-dom";
import { Phone } from "lucide-react";
import Logo from "./Logo";
import { SITE_CONFIG } from "@/lib/siteConfig";

export default function Footer() {
  return (
    <footer className="bg-carbon text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          {/* Brand */}
          <div>
            <Logo variant="light" />
            <p className="mt-4 text-sm text-white/60 leading-relaxed max-w-xs">
              Original UK-sourced products delivered across Ghana. Stay Plugged In.
            </p>
            <div className="mt-5">
              <a
                href={`tel:${SITE_CONFIG.phone}`}
                className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-pink transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call: {SITE_CONFIG.phone}
              </a>
            </div>
          </div>

          {/* Contact + Social */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-4 font-body font-semibold">Get In Touch</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li>
                <a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-pink transition-colors">
                  {SITE_CONFIG.email}
                </a>
              </li>
              <li>
                <a href={`tel:${SITE_CONFIG.phone}`} className="hover:text-pink transition-colors">
                  {SITE_CONFIG.phone}
                </a>
              </li>
              <li className="pt-2">
                <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Follow Us</p>
                {SITE_CONFIG.social.map((s) => (
                  <a
                    key={s.platform}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-pink transition-colors mr-4"
                  >
                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                      {s.platform[0]}
                    </span>
                    {s.handle}
                  </a>
                ))}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} {SITE_CONFIG.brandName}. All rights reserved.
          </p>
          <p className="text-xs text-white/50">{SITE_CONFIG.domain}</p>
        </div>
      </div>
    </footer>
  );
}