import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import StatusBadge from "./StatusBadge";
import type { Masjid } from "./types";

// Pin colours come from the design tokens, so they follow the light or dark theme.
const pinIcon = (active: boolean) => L.divIcon({
  className: "admin-pin",
  iconSize: [34, 44],
  iconAnchor: [17, 42],
  popupAnchor: [0, -38],
  html: `<svg width="34" height="44" viewBox="0 0 34 44" aria-hidden="true"><path d="M17 43s15-13.6 15-26A15 15 0 0 0 2 17c0 12.4 15 26 15 26Z" fill="var(${active ? "--d-accent" : "--d-danger"})" stroke="var(--d-surface)" stroke-width="2.5"/><circle cx="17" cy="17" r="5.5" fill="var(--d-surface)"/></svg>`,
});

const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  // Refit only when the set of pins changes, not on every re-render.
  const key = JSON.stringify(positions);
  useEffect(() => {
    const pts = JSON.parse(key) as [number, number][];
    if (pts.length === 0) return;
    if (pts.length === 1) { map.setView(pts[0], 13); return; }
    map.fitBounds(L.latLngBounds(pts), { padding: [48, 48] });
  }, [map, key]);
  return null;
};

const MasjidsMap: React.FC<{ masjids: Masjid[]; dark: boolean }> = ({ masjids, dark }) => {
  const withCoords = masjids.filter(m => m.latitude && m.longitude &&
    !isNaN(parseFloat(m.latitude)) && !isNaN(parseFloat(m.longitude)));
  const positions: [number, number][] = withCoords.map(m => [parseFloat(m.latitude!), parseFloat(m.longitude!)]);
  const center: [number, number] = positions.length ? positions[0] : [43.651070, -79.347015];
  const missing = masjids.length - withCoords.length;

  return (
    <section className="d-card d-card--clip" aria-labelledby="admin-map-h">
      <div className="admin-map-head">
        <h2 id="admin-map-h" className="d-h3">Where the masjids are</h2>
        <div className="admin-legend">
          <span><i className="admin-dot" style={{ background: "var(--d-accent)" }} aria-hidden="true" />Active</span>
          <span><i className="admin-dot" style={{ background: "var(--d-danger)" }} aria-hidden="true" />Suspended</span>
        </div>
      </div>
      <div className={`admin-map${dark ? " is-dark" : ""}`}>
        <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <FitBounds positions={positions} />
          {withCoords.map(m => (
            <Marker key={m.id} position={[parseFloat(m.latitude!), parseFloat(m.longitude!)]} icon={pinIcon(m.status === "active")} title={m.masjid_name} alt={m.masjid_name}>
              <Popup minWidth={240} maxWidth={300}>
                <div className="admin-popup">
                  <span className="admin-popup-name">{m.masjid_name}</span>
                  <StatusBadge status={m.status} />
                  {m.address && <span className="admin-popup-line">{m.address}</span>}
                  <span className="admin-popup-line">{m.masjid_email}</span>
                  <span className="admin-popup-coords">
                    {parseFloat(m.latitude!).toFixed(6)}, {parseFloat(m.longitude!).toFixed(6)}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <p className="admin-map-foot d-muted d-small">
        {withCoords.length === 1 ? "1 masjid is" : `${withCoords.length} masjids are`} on the map.
        {missing > 0 && ` ${missing === 1 ? "1 has" : `${missing} have`} no location saved yet.`}
      </p>
    </section>
  );
};

export default MasjidsMap;
