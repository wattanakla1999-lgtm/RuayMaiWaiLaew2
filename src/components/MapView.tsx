"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { StationWithDistance } from "@/types";
import { StationPopup } from "@/components/StationPopup";

// Fix broken default icon paths in Next.js / webpack
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

const markerColors: Record<string, { fill: string; glow: string }> = {
  AVAILABLE: { fill: "#10b981", glow: "rgba(16,185,129,0.5)" },
  LOW:       { fill: "#f59e0b", glow: "rgba(245,158,11,0.5)" },
  EMPTY:     { fill: "#ef4444", glow: "rgba(239,68,68,0.5)" },
};
const staleColor = { fill: "#94a3b8", glow: "rgba(148,163,184,0.3)" };
const defaultColor = { fill: "#6366f1", glow: "rgba(99,102,241,0.5)" };

const RADIUS_TO_ZOOM: Record<number, number> = {
  1: 15, 3: 14, 5: 13, 10: 12, 15: 12,
  20: 11, 25: 11, 30: 10, 35: 10,
  40: 9, 45: 9, 50: 8, 55: 8,
};

/** SVG drop-pin with a glowing ring underneath */
function createStationIcon(
  colorSet: { fill: string; glow: string },
  isSelected: boolean
): L.DivIcon {
  const size = isSelected ? 40 : 32;
  const h    = isSelected ? 50 : 42;
  const ring = isSelected ? 28 : 22;

  const svg = `
    <div style="position:relative;display:flex;align-items:flex-end;justify-content:center;width:${size}px;height:${h}px;">
      <!-- glow ring -->
      <div style="
        position:absolute;
        bottom:0;
        left:50%;
        transform:translateX(-50%);
        width:${ring}px;height:${ring * 0.4}px;
        border-radius:50%;
        background:${colorSet.glow};
        filter:blur(4px);
      "></div>
      <!-- pin svg -->
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h - 4}" viewBox="0 0 32 42" style="position:absolute;bottom:4px;">
        <path d="M16 0C9.37 0 4 5.37 4 12c0 9 12 30 12 30S28 21 28 12C28 5.37 22.63 0 16 0z"
          fill="${colorSet.fill}" stroke="rgba(255,255,255,0.9)" stroke-width="1.5"
          filter="drop-shadow(0 2px 6px ${colorSet.glow})"/>
        <circle cx="16" cy="12" r="5.5" fill="white" fill-opacity="0.95"/>
        ${isSelected ? `<circle cx="16" cy="12" r="2.5" fill="${colorSet.fill}"/>` : ""}
      </svg>
    </div>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, h],
    iconAnchor: [size / 2, h],
    popupAnchor: [0, -(h - 4)],
  });
}

/** Animated pulsing user location dot */
const userLocationIcon = L.divIcon({
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <div style="
        position:absolute;inset:0;
        border-radius:50%;
        background:rgba(59,130,246,0.25);
        animation:pulse-ring 2s ease-out infinite;
      "></div>
      <div style="
        position:absolute;
        top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:14px;height:14px;
        background:#3b82f6;
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 0 10px rgba(59,130,246,0.6);
      "></div>
    </div>`,
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// ─── Child: Imperative map controller ───────────────────────────────────────

function MapController({
  selectedStation,
  radius,
}: {
  selectedStation: StationWithDistance | null;
  radius?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedStation) map.panTo([selectedStation.lat, selectedStation.lng]);
  }, [map, selectedStation]);

  useEffect(() => {
    if (radius !== undefined) map.setZoom(RADIUS_TO_ZOOM[radius] ?? 11);
  }, [map, radius]);

  return null;
}

/** Opens Leaflet popup when a station is selected from the sidebar list */
function PopupOpener({
  selectedStation,
  markerRefs,
}: {
  selectedStation: StationWithDistance | null;
  markerRefs: React.MutableRefObject<Record<string, L.Marker | null>>;
}) {
  // we need the map reference to close other popups first
  const map = useMap();
  useEffect(() => {
    if (selectedStation) {
      map.closePopup();
      const marker = markerRefs.current[selectedStation.id];
      marker?.openPopup();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStation]);
  return null;
}

/** Close popup on map click (outside any marker) */
function MapClickCloser({ onClose }: { onClose: () => void }) {
  useMapEvents({ click: onClose });
  return null;
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface MapViewProps {
  stations: StationWithDistance[];
  userLat?: number;
  userLng?: number;
  radius?: number;
  onRefresh?: () => void;
  selectedStationId?: string | null;
  onSelectStationId?: (id: string | null) => void;
}

export function MapView({
  stations,
  userLat,
  userLng,
  radius,
  onRefresh,
  selectedStationId,
  onSelectStationId,
}: MapViewProps) {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  const center: [number, number] = [userLat ?? 13.7563, userLng ?? 100.5018];
  const initialZoom = radius ? (RADIUS_TO_ZOOM[radius] ?? 13) : 13;

  const selectedStation = selectedStationId
    ? (stations.find((s) => s.id === selectedStationId) ?? null)
    : null;

  // radius in metres for the circle (radius prop is in km)
  const radiusM = (radius ?? 5) * 1000;

  return (
    <MapContainer
      center={center}
      zoom={initialZoom}
      style={{ width: "100%", height: "100%" }}
      zoomControl={true}
    >
      {/* ── Light, colourful CartoDB Voyager tiles ── */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />

      <MapController selectedStation={selectedStation} radius={radius} />
      <PopupOpener selectedStation={selectedStation} markerRefs={markerRefs} />
      <MapClickCloser onClose={() => onSelectStationId?.(null)} />

      {/* ── User location radius circle ── */}
      {userLat && userLng && (
        <>
          <Circle
            center={[userLat, userLng]}
            radius={radiusM}
            pathOptions={{
              color: "#f59e0b",
              weight: 1.5,
              opacity: 0.4,
              dashArray: "6 6",
              fillColor: "#f59e0b",
              fillOpacity: 0.04,
            }}
          />
          {/* User dot */}
          <Marker
            position={[userLat, userLng]}
            icon={userLocationIcon}
            zIndexOffset={2000}
            interactive={false}
          />
        </>
      )}

      {/* ── Station Markers ── */}
      {stations.map((station) => {
        const colorSet = station.isStale
          ? staleColor
          : station.fuelStatus
          ? (markerColors[station.fuelStatus] ?? defaultColor)
          : defaultColor;
        const isSelected = selectedStationId === station.id;
        const icon = createStationIcon(colorSet, isSelected);

        return (
          <Marker
            key={station.id}
            position={[station.lat, station.lng]}
            icon={icon}
            zIndexOffset={isSelected ? 1000 : 0}
            ref={(ref) => { markerRefs.current[station.id] = ref; }}
            eventHandlers={{
              click() { onSelectStationId?.(station.id); },
              popupclose() { onSelectStationId?.(null); },
            }}
          >
            <Popup
              minWidth={240}
              maxWidth={320}
              className="leaflet-popup-custom"
            >
              <div className="w-[240px] sm:w-[300px]">
                <StationPopup station={station} onReportSuccess={onRefresh} />
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
