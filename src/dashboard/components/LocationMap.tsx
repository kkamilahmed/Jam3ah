import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "jam3ah-pin",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: `
    <div style="width:28px;height:28px;position:relative;display:flex;align-items:center;justify-content:center;">
      <div class="jam3ah-ping" style="position:absolute;width:28px;height:28px;background:rgba(52,211,153,0.15);border-radius:50%;"></div>
      <div style="width:14px;height:14px;background:#34d399;border-radius:50%;border:2.5px solid #fff;box-shadow:0 0 12px rgba(52,211,153,0.6);position:relative;z-index:1;"></div>
    </div>
  `,
});

// Flies to new coordinates on explicit trigger (button) or when lat/lng change after mount (autoCenter)
const Recenter: React.FC<{ lat: number; lng: number; flyTrigger: number; autoCenter: boolean }> = ({ lat, lng, flyTrigger, autoCenter }) => {
  const map = useMap();
  const triggerMounted = useRef(false);
  const autoCenterMounted = useRef(false);

  useEffect(() => {
    if (!triggerMounted.current) { triggerMounted.current = true; return; }
    map.flyTo([lat, lng], 15);
  }, [flyTrigger]);

  useEffect(() => {
    if (!autoCenter) return;
    if (!autoCenterMounted.current) { autoCenterMounted.current = true; return; }
    map.setView([lat, lng], 15);
  }, [lat, lng]);

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
  autoCenter?: boolean;
  height?: number | string;
}

const LocationMap: React.FC<LocationMapProps> = ({
  latitude, longitude, flyTrigger = 0, onChange,
  readOnly = false, autoCenter = false, height = 300,
}) => {
  const lat = parseFloat(latitude) || 43.651070;
  const lng = parseFloat(longitude) || -79.347015;

  return (
    <div style={{ height, isolation: "isolate" }} className="rounded-2xl overflow-hidden border border-white/[0.07]">
      <style>{`
        .leaflet-container { background: #09090b; }
        .jam3ah-pin { background: transparent !important; border: none !important; }
        .jam3ah-ping { animation: jam3ah-ping 1.5s cubic-bezier(0,0,0.2,1) infinite; }
        @keyframes jam3ah-ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        .leaflet-control-zoom {
          border: 1px solid rgba(255,255,255,0.07) !important;
          border-radius: 12px !important;
          overflow: hidden;
          box-shadow: none !important;
        }
        .leaflet-control-zoom a {
          background: #18181b !important;
          color: #a1a1aa !important;
          border-bottom: 1px solid rgba(255,255,255,0.07) !important;
          width: 32px !important; height: 32px !important;
          line-height: 32px !important;
          font-size: 16px !important;
        }
        .leaflet-control-zoom a:hover { background: #27272a !important; color: #fff !important; }
        .leaflet-control-zoom-out { border-bottom: none !important; }
      `}</style>
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        attributionControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <Recenter lat={lat} lng={lng} flyTrigger={flyTrigger} autoCenter={autoCenter} />
        {!readOnly && onChange && <ClickHandler onMove={(la, lo) => onChange(la.toFixed(6), lo.toFixed(6))} />}
        <Marker
          position={[lat, lng]}
          icon={pinIcon}
          draggable={!readOnly}
          eventHandlers={!readOnly && onChange ? {
            dragend(e) {
              const { lat: la, lng: lo } = (e.target as L.Marker).getLatLng();
              onChange(la.toFixed(6), lo.toFixed(6));
            },
          } : {}}
        />
      </MapContainer>
    </div>
  );
};

export default LocationMap;
