import React, { useState, useRef, useEffect } from "react";
import { Bike, Loader2, MapPin, Navigation, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const RIDE_STATUSES = [
  { value: "unassigned", label: "Not assigned" },
  { value: "assigned", label: "Rider assigned" },
  { value: "en_route", label: "En route to customer" },
  { value: "delivered", label: "Delivered" },
];

export default function RideManager({ order, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [riderName, setRiderName] = useState(order.rider_name || "");
  const [riderPhone, setRiderPhone] = useState(order.rider_phone || "");
  const [boltLink, setBoltLink] = useState(order.bolt_link || "");
  const [rideStatus, setRideStatus] = useState(order.ride_status || "unassigned");
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [loc, setLoc] = useState(
    order.rider_lat && order.rider_lng ? { lat: order.rider_lat, lng: order.rider_lng } : null
  );
  const watchId = useRef(null);
  const lastUpdate = useRef(0);

  useEffect(() => () => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  const saveDetails = async () => {
    setSaving(true);
    try {
      await base44.entities.Order.update(order.id, {
        rider_name: riderName,
        rider_phone: riderPhone,
        bolt_link: boltLink,
        ride_status: rideStatus,
      });
      onUpdated?.();
    } catch (e) {
      alert(e?.message || "Failed to save ride details");
    }
    setSaving(false);
  };

  const pushLocation = async (lat, lng) => {
    try {
      await base44.entities.Order.update(order.id, { rider_lat: lat, rider_lng: lng, ride_status: "en_route" });
      setLoc({ lat, lng });
      onUpdated?.();
    } catch (e) {}
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported by this device");
    navigator.geolocation.getCurrentPosition(
      (pos) => pushLocation(pos.coords.latitude, pos.coords.longitude),
      (e) => alert("Could not get location: " + e.message),
      { enableHighAccuracy: true }
    );
  };

  const toggleLive = () => {
    if (sharing) {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      setSharing(false);
    } else {
      if (!navigator.geolocation) return alert("Geolocation not supported by this device");
      setSharing(true);
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const now = Date.now();
          if (now - lastUpdate.current < 4000) return;
          lastUpdate.current = now;
          pushLocation(pos.coords.latitude, pos.coords.longitude);
        },
        (e) => { setSharing(false); alert("Location error: " + e.message); },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
      );
    }
  };

  return (
    <div className="mt-3 border-t border-dashed border-border pt-3">
      <button onClick={() => setOpen((o) => !o)} className="text-xs font-bold uppercase tracking-wider text-pink flex items-center gap-1.5">
        <Bike className="w-3.5 h-3.5" /> {open ? "Hide" : "Arrange"} Bolt Ride
      </button>
      {open && (
        <div className="mt-3 space-y-3 bg-london/40 p-3 rounded">
          <div className="grid sm:grid-cols-2 gap-2">
            <input value={riderName} onChange={(e) => setRiderName(e.target.value)} placeholder="Rider name" className="ck-input" />
            <input value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} placeholder="Rider phone" className="ck-input" />
          </div>
          <input value={boltLink} onChange={(e) => setBoltLink(e.target.value)} placeholder="Bolt ride link (https://...)" className="ck-input" />
          <select value={rideStatus} onChange={(e) => setRideStatus(e.target.value)} className="ck-input">
            {RIDE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {loc && <p className="text-xs text-muted-foreground">Rider location: {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</p>}
          <div className="flex flex-wrap gap-2">
            <button onClick={saveDetails} disabled={saving} className="px-3 py-2 bg-carbon text-white text-xs font-bold uppercase rounded flex items-center gap-1.5 disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
            </button>
            <button onClick={useMyLocation} className="px-3 py-2 border border-carbon text-xs font-bold uppercase rounded flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Set my location
            </button>
            <button
              onClick={toggleLive}
              className={cn("px-3 py-2 text-xs font-bold uppercase rounded flex items-center gap-1.5", sharing ? "bg-red-600 text-white" : "bg-pink text-white")}
            >
              <Navigation className="w-3.5 h-3.5" /> {sharing ? "Stop live" : "Share live"}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            "Share live" uses your device GPS to update the rider's position on the customer's tracking map in real time. Order the Bolt ride in the Bolt app first, then paste the link above.
          </p>
        </div>
      )}
    </div>
  );
}