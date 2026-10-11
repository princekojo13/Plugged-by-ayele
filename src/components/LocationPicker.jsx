import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { Search, Loader2, MapPin } from "lucide-react";
import L from "leaflet";
import { ACCRA_HUB } from "@/lib/siteConfig";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:26px;height:26px;background:#e5006f;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

function InvalidateSize() {
  const map = useMap();
  React.useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function LocationPicker({ value, onChange }) {
  const position = value ? [value.lat, value.lng] : ACCRA_HUB;
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(search + ", Ghana")}`,
        { headers: { Accept: "application/json" } }
      );
      const data = await res.json();
      if (data?.length) onChange({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
    } catch {}
    setSearching(false);
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your area or landmark..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-4 py-2.5 bg-carbon text-white text-sm font-bold uppercase tracking-wider rounded-md disabled:opacity-60"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Find"}
        </button>
      </form>
      <div className="h-[300px] w-full border border-border rounded-md overflow-hidden">
        <MapContainer center={position} zoom={13} className="w-full h-full" style={{ zIndex: 0 }}>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <InvalidateSize />
          <Marker
            position={position}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const p = e.target.getLatLng();
                onChange({ lat: p.lat, lng: p.lng });
              },
            }}
          />
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-pink" />
        {value
          ? `Pinned: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
          : "Drag the pink pin to your exact delivery location."}
      </p>
    </div>
  );
}