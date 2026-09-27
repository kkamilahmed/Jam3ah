import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "jam3ah-pin",
  iconSize: [34, 44],
  iconAnchor: [17, 42],
  html: `<svg width="34" height="44" viewBox="0 0 34 44" aria-hidden="true"><path d="M17 43s15-13.6 15-26A15 15 0 0 0 2 17c0 12.4 15 26 15 26Z" fill="var(--d-accent, #1f5fad)" stroke="#fff" stroke-width="2.5"/><circle cx="17" cy="17" r="5.5" fill="#fff"/></svg>`,
});

// Keeps the map centred on the pin when the coordinates change from outside the map.
const Recenter: React.FC<{ lat: number; lng: number; flyTrigger: number }> = ({ lat, lng, flyTrigger }) => {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    map.setView([lat, lng], Math.max(map.getZoom(), 15));
  }, [lat, lng, flyTrigger, map]);
  return null;
};

const ClickHandler: React.FC<{ onMove: (lat: number, lng: number) => void }> = ({ onMove }) => {
  useMapEvents({ click(e) { onMove(e.latlng.lat, e.latlng.lng); } });
  return null;
};

interface LocationMapProps {
  latitude: string;
  longitude: string;
  flyTrigger?: number;
  onChange?: (lat: string, lng: string) => void;
  readOnly?: boolean;
  height?: number | string;
  dark?: boolean;
}

const LocationMap: React.FC<LocationMapProps> = ({
  latitude, longitude, flyTrigger = 0, onChange, readOnly = false, height = 300, dark = false,
}) => {
  const lat = parseFloat(latitude) || 43.65107;
  const lng = parseFloat(longitude) || -79.347015;
  const editable = !readOnly && !!onChange;

  return (
    <div className={`jam3ah-map${dark ? " is-dark" : ""}`} style={{ height, isolation: "isolate", borderRadius: "var(--d-r-btn, 10px)", overflow: "hidden", border: "1px solid var(--d-border, #e3dfd5)" }}>
      <style>{`
        .jam3ah-pin { background: transparent !important; border: none !important; }
        .jam3ah-map .leaflet-container { background: var(--d-surface-2, #f4f4f4); font-family: inherit; }
        .jam3ah-map .leaflet-container img.leaflet-tile { mix-blend-mode: normal; }
        .jam3ah-map.is-dark .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9); }
        .jam3ah-map .leaflet-control-zoom { border: 1px solid var(--d-border-strong, #ccc) !important; border-radius: var(--d-r-btn, 10px) !important; overflow: hidden; box-shadow: none !important; }
        .jam3ah-map .leaflet-control-zoom a { width: 40px !important; height: 40px !important; line-height: 40px !important; font-size: 20px !important; background: var(--d-surface, #fff) !important; color: var(--d-text, #111) !important; border-bottom: 1px solid var(--d-border, #ddd) !important; }
        .jam3ah-map .leaflet-control-zoom a:hover { background: var(--d-surface-2, #f4f4f4) !important; }
        .jam3ah-map .leaflet-control-attribution { font-size: 12px; background: var(--d-surface, #fff) !important; color: var(--d-text-2, #555) !important; }
        .jam3ah-map .leaflet-control-attribution a { color: var(--d-accent, #1f5fad) !important; }
      `}</style>
      <MapContainer center={[lat, lng]} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl scrollWheelZoom={false}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <Recenter lat={lat} lng={lng} flyTrigger={flyTrigger} />
        {editable && <ClickHandler onMove={(la, lo) => onChange!(la.toFixed(6), lo.toFixed(6))} />}
        <Marker
          position={[lat, lng]}
          icon={pinIcon}
          draggable={editable}
          eventHandlers={editable ? {
            dragend(e) {
              const p = (e.target as L.Marker).getLatLng();
              onChange!(p.lat.toFixed(6), p.lng.toFixed(6));
            },
          } : {}}
        />
      </MapContainer>
    </div>
  );
};

export default LocationMap;
