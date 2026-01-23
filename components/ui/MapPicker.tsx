"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Button } from "./Button";

// Fix for default marker icon in Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

function LocationMarker({
  position,
  onPositionChange
}: {
  position: { lat: number; lng: number } | null;
  onPositionChange: (pos: { lat: number; lng: number }) => void;
}) {
  const map = useMapEvents({
    click(e) {
      onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });

  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], map.getZoom());
    }
  }, [position, map]);

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

export function MapPicker({
  value,
  onChange
}: {
  value: { lat: number; lng: number } | null;
  onChange: (pos: { lat: number; lng: number }) => void;
}) {
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mounted, setMounted] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onChange(newPos);
        if (mapRef.current) {
          mapRef.current.flyTo([newPos.lat, newPos.lng], 16);
        }
        setGettingLocation(false);
      },
      (err) => {
        alert("Could not get your location: " + err.message);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Default center (San Francisco)
  const center = value ?? { lat: 37.7749, lng: -122.4194 };

  if (!mounted) {
    return (
      <div className="h-[250px] w-full rounded-xl border border-white/10 bg-card2 flex items-center justify-center">
        <p className="text-sm text-muted">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-white/10">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={value ? 16 : 12}
          className="h-[250px] w-full"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={value} onPositionChange={onChange} />
        </MapContainer>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={gettingLocation}
          onClick={handleUseMyLocation}
        >
          {gettingLocation ? "Getting..." : "Use my location"}
        </Button>
        {value ? (
          <p className="text-xs text-muted truncate">
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </p>
        ) : (
          <p className="text-xs text-muted">Tap map to set location</p>
        )}
      </div>
    </div>
  );
}
