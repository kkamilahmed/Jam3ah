import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom pin that matches the dark design language
const pinIcon = L.divIcon({
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: `
    <div style="
      width: 28px; height: 28px; position: relative;
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="
        position: absolute; width: 28px; height: 28px;
        background: rgba(52,211,153,0.15); border-radius: 50%;
        animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
      "></div>
      <div style="
        width: 14px; height: 14px; background: #34d399;
        border-radius: 50%; border: 2.5px solid #fff;
        box-shadow: 0 0 12px rgba(52,211,153,0.6);
        position: relative; z-index: 1;
      "></div>
    </div>
    <style>
      @keyframes ping {
        75%, 100% { transform: scale(2); opacity: 0; }
      }
    </style>
  `,
});

const Recenter: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng]); }, [lat, lng, map]);
  return null;
};

const ClickHandler: React.FC<{ onMove: (lat: number, lng: number) => void }> = ({ onMove }) => {
  useMapEvents({ click(e) { onMove(e.latlng.lat, e.latlng.lng); } });
  return null;
};

interface LocationMapProps {
  latitude: string;
  longitude: string;
  onChange: (lat: string, lng: string) => void;
}

const LocationMap: React.FC<LocationMapProps> = ({ latitude, longitude, onChange }) => {
  const lat = parseFloat(latitude) || 43.651070;
  const lng = parseFloat(longitude) || -79.347015;

  return (
    <div style={{ height: 320 }} className="rounded-2xl overflow-hidden border border-white/[0.07]">
      <style>{`
        .leaflet-container { background: #09090b; }
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
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        attributionControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <Recenter lat={lat} lng={lng} />
        <ClickHandler onMove={(la, lo) => onChange(la.toFixed(6), lo.toFixed(6))} />
        <Marker
          position={[lat, lng]}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend(e) {
              const { lat: la, lng: lo } = (e.target as L.Marker).getLatLng();
              onChange(la.toFixed(6), lo.toFixed(6));
            },
          }}
        />
      </MapContainer>
    </div>
  );
};

export default LocationMap;
