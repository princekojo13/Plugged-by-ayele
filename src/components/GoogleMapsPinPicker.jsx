import { useEffect, useRef, useState } from "react";
import { ACCRA_HUB } from "@/lib/siteConfig";

let googleMapsLoadPromise;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google.maps);
  }

  if (!googleMapsLoadPromise) {
    googleMapsLoadPromise = new Promise((resolve, reject) => {
      const callbackName = "__pluggedByAyeleyGoogleMapsReady";
      const script = document.createElement("script");
      const timeout = window.setTimeout(() => {
        reject(new Error("Google Maps took too long to load."));
      }, 20000);

      window[callbackName] = () => {
        window.clearTimeout(timeout);
        delete window[callbackName];

        if (window.google?.maps?.importLibrary) {
          resolve(window.google.maps);
        } else {
          reject(new Error("Google Maps did not finish loading."));
        }
      };

      script.async = true;
      script.defer = true;
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
        `&loading=async&callback=${callbackName}&v=weekly&region=GH`;
      script.dataset.googleMapsLoader = "true";
      script.onerror = () => {
        window.clearTimeout(timeout);
        delete window[callbackName];
        reject(new Error("Google Maps could not be loaded."));
      };

      document.head.appendChild(script);
    }).catch((error) => {
      googleMapsLoadPromise = undefined;
      throw error;
    });
  }

  return googleMapsLoadPromise;
}

export default function GoogleMapsPinPicker({ location, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState("");
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setError("Google Maps needs a browser API key before it can load.");
      return undefined;
    }

    let active = true;

    loadGoogleMaps(apiKey)
      .then(async (maps) => {
        const { Map } = await maps.importLibrary("maps");
        if (!active || !containerRef.current) return;

        const map = new Map(containerRef.current, {
          center: { lat: ACCRA_HUB[0], lng: ACCRA_HUB[1] },
          zoom: 12,
          minZoom: 6,
          maxZoom: 20,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "cooperative",
          restriction: {
            latLngBounds: {
              north: 11.5,
              south: 4.5,
              east: 1.5,
              west: -3.5,
            },
            strictBounds: true,
          },
        });

        map.addListener("click", (event) => {
          if (!event.latLng) return;
          onSelect({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          });
        });

        mapRef.current = map;
        setError("");
        setMapReady(true);
      })
      .catch((loadError) => {
        if (active) {
          console.error("Google Maps picker failed to load:", loadError);
          setError(
            "Google Maps could not load. Check that the Maps JavaScript API is enabled and the browser key allows this site."
          );
        }
      });

    return () => {
      active = false;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [apiKey, onSelect]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.google?.maps) return;

    if (!location) {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      return;
    }

    const position = { lat: location.lat, lng: location.lng };
    if (!markerRef.current) {
      markerRef.current = new window.google.maps.Marker({
        map: mapRef.current,
        position,
        draggable: true,
        title: "Delivery location",
      });

      markerRef.current.addListener("dragend", (event) => {
        if (!event.latLng) return;
        onSelect({
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        });
      });
    } else {
      markerRef.current.setPosition(position);
    }
  }, [location, mapReady, onSelect]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[320px] w-full bg-slate-100"
        aria-label="Google Maps delivery location picker"
      />
      {!mapReady && !error && apiKey && (
        <p className="absolute left-3 top-3 rounded bg-white px-3 py-2 text-sm shadow">
          Loading Google Maps…
        </p>
      )}
      {error && (
        <p role="alert" className="bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </p>
      )}
    </div>
  );
}
