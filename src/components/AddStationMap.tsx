"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";


import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
});

const pickIcon = L.divIcon({
  html: `<div style="
    width:20px;height:20px;
    background:#f97316;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 2px 6px rgba(0,0,0,0.4);
  "></div>`,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface PickLocationMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

/** Handles map click events to pick a new location */
function ClickListener({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Pans map when props change (e.g., when geolocation finishes) */
function MapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.panTo([lat, lng]);
  }, [map, lat, lng]);
  return null;
}

export function AddStationMap({ lat, lng, onChange }: PickLocationMapProps) {
  const markerRef = useRef<L.Marker | null>(null);

  // Move marker programmatically when lat/lng props change externally
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-inner border border-gray-200">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        <MapController lat={lat} lng={lng} />
        <ClickListener onChange={onChange} />
        <Marker
          position={[lat, lng]}
          icon={pickIcon}
          draggable={true}
          ref={markerRef}
          eventHandlers={{
            dragend(e) {
              const pos = (e.target as L.Marker).getLatLng();
              onChange(pos.lat, pos.lng);
            },
          }}
        />
      </MapContainer>
      <p className="absolute bottom-2 left-2 text-xs text-gray-700 bg-white/80 px-2 py-1 rounded z-[1000]">
        แตะบนแผนที่หรือลากหมุดเพื่อเลือกตำแหน่ง
      </p>
    </div>
  );
}
