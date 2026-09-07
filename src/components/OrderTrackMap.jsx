import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { Loader2, Navigation, Clock, Route as RouteIcon, Bike } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { ACCRA_HUB } from "@/lib/siteConfig";
import "leaflet/dist/leaflet.css";

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
}

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) map.fitBounds(points, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

export default function OrderTrackMap({ order }) {
  const [state, setState] = useState({ loading: true });
  const [rider, setRider] = useState(
    order?.rider_lat && order?.rider_lng
      ? { lat: order.rider_lat, lng: order.rider_lng, name: order.rider_name, bolt_link: order.bolt_link, status: order.ride_status }
      : null
  );
  const orderNumber = order?.order_number;

  // Resolve destination + driving route once per order
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let dest = null;
        if (order.delivery_lat && order.delivery_lng) {
          dest = [order.delivery_lat, order.delivery_lng];
        } else if (order.delivery_address) {
          const address = [order.delivery_address, order.delivery_region, "Ghana"].filter(Boolean).join(", ");
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`);
          const geo = await geoRes.json();
          if (geo?.length) dest = [parseFloat(geo[0].lat), parseFloat(geo[0].lon)];
        }
        if (!dest) { if (active) setState({ loading: false, fallback: true }); return; }
        const routeRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${ACCRA_HUB[1]},${ACCRA_HUB[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`);
        const routeData = await routeRes.json();
        if (!routeData?.routes?.length) { if (active) setState({ loading: false, fallback: true, dest }); return; }
        const route = routeData.routes[0];
        const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        if (!active) return;
        setState({ loading: false, dest, coords, distanceKm: (route.distance / 1000).toFixed(1), eta: formatDuration(route.duration) });
      } catch {
        if (active) setState({ loading: false, fallback: true });
      }
    })();
    return () => { active = false; };
  }, [order.id]);

  // Poll for live rider position every 5s (works for anonymous customers too)
  useEffect(() => {
    if (!orderNumber) return;
    const t = setInterval(async () => {
      try {
        const res = await base44.functions.invoke("lookup-order", { order_number: orderNumber });
        const o = (res.data?.orders || [])[0];
        if (o && o.rider_lat && o.rider_lng) {
          setRider({ lat: o.rider_lat, lng: o.rider_lng, name: o.rider_name, bolt_link: o.bolt_link, status: o.ride_status });
        }
      } catch {}
    }, 5000);
    return () => clearInterval(t);
  }, [orderNumber]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-pink" />
      </div>
    );
  }

  const hasRider = rider && rider.lat && rider.lng;
  const points = state.coords ? [ACCRA_HUB, state.dest] : [ACCRA_HUB];
  const fitPoints = hasRider ? [...points, [rider.lat, rider.lng]] : points;
  const center = state.dest ? [(ACCRA_HUB[0] + state.dest[0]) / 2, (ACCRA_HUB[1] + state.dest[1]) / 2] : ACCRA_HUB;

  return (
    <div className="border border-border bg-white">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <Navigation className="w-4 h-4 text-pink" />
          <h3 className="font-heading font-bold text-sm text-carbon">Live Delivery Map</h3>
          {hasRider && (
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded">
              Rider on the way
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {state.fallback ? "Live map unavailable for this address." : "From our Accra hub to your delivery address."}
        </p>
      </div>

      <div className="h-[360px] w-full">
        <MapContainer center={center} zoom={state.dest ? 7 : 6} className="w-full h-full" style={{ zIndex: 0 }}>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <InvalidateSize />
          {state.coords && (
            <>
              <FitBounds points={fitPoints} />
              <Polyline positions={state.coords} pathOptions={{ color: "#e5006f", weight: 4, opacity: 0.8 }} />
            </>
          )}
          <CircleMarker center={ACCRA_HUB} radius={8} pathOptions={{ color: "#0A0A0A", fillColor: "#0A0A0A", fillOpacity: 1 }}>
            <Tooltip sticky>Accra Dispatch Hub</Tooltip>
          </CircleMarker>
          {state.dest && (
            <CircleMarker center={state.dest} radius={8} pathOptions={{ color: "#e5006f", fillColor: "#e5006f", fillOpacity: 1 }}>
              <Tooltip sticky>Your Delivery Address</Tooltip>
            </CircleMarker>
          )}
          {hasRider && (
            <CircleMarker center={[rider.lat, rider.lng]} radius={10} pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 1 }}>
              <Tooltip sticky>{rider.name ? `Rider: ${rider.name}` : "Rider"}</Tooltip>
            </CircleMarker>
          )}
        </MapContainer>
      </div>

      {!state.fallback && state.distanceKm && (
        <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
          <div className="p-4 flex items-center gap-3">
            <RouteIcon className="w-5 h-5 text-pink" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Distance</p>
              <p className="font-heading font-bold text-carbon">{state.distanceKm} km</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-pink" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Drive time from Accra hub</p>
              <p className="font-heading font-bold text-carbon">{state.eta}</p>
            </div>
          </div>
        </div>
      )}

      {hasRider && rider.bolt_link && (
        <div className="p-4 border-t border-border flex items-center gap-2">
          <Bike className="w-4 h-4 text-pink" />
          <a href={rider.bolt_link} target="_blank" rel="noreferrer" className="text-sm font-semibold text-pink hover:text-carbon">
            Open Bolt ride
          </a>
        </div>
      )}
    </div>
  );
}