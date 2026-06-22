import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip, useMap } from 'react-leaflet';

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; <a href="https://carto.com/">CARTO</a>';
const BENGALURU_CENTER = [12.9716, 77.5946];

function getZoneColor(score) {
  if (score > 700) return '#ef4444';
  if (score > 300) return '#f59e0b';
  return '#10b981';
}

function getZoneRadius(score) {
  const min = 6, max = 30;
  const clamped = Math.min(Math.max(score, 100), 2000);
  return min + ((clamped - 100) / (2000 - 100)) * (max - min);
}

// Distance formula to calculate if a zone is within the cascade ring
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Sub-component to switch tile layer when theme changes */
function ThemeAwareTiles() {
  const map = useMap();
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return (
    <TileLayer
      key={theme}
      attribution={ATTRIBUTION}
      url={theme === 'dark' ? DARK_TILES : LIGHT_TILES}
    />
  );
}

/** Cascade animation rings */
function CascadeRings({ cascadeData, visibleFrames }) {
  if (!cascadeData || !cascadeData.frames) return null;

  // Reduced transparency to make the rings more solid and clear
  const colors = ['rgba(139, 92, 246, 1.0)', 'rgba(139, 92, 246, 0.8)', 'rgba(139, 92, 246, 0.6)'];
  const radii = [300, 700, 1400];

  return (
    <>
      {cascadeData.frames.slice(0, visibleFrames).map((frame, i) => (
        <Circle
          key={`cascade-${i}`}
          center={[cascadeData.center_lat, cascadeData.center_lng]}
          radius={radii[i]}
          pathOptions={{
            color: colors[i],
            fillColor: colors[i],
            fillOpacity: 0.3, // Slightly raised fill opacity so it stands out but map still visible
            weight: 3,        // Thicker border
          }}
        />
      ))}
    </>
  );
}

export default function HeatmapMap({ zones, patrolData, cascadeData, selectedZone, onZoneClick }) {
  const [cascadeStep, setCascadeStep] = useState(0);

  // Lifted the timer logic so HeatmapMap knows how far the cascade has rippled
  useEffect(() => {
    if (cascadeData) {
      setCascadeStep(0);
      const timers = [
        setTimeout(() => setCascadeStep(1), 300),
        setTimeout(() => setCascadeStep(2), 1300),
        setTimeout(() => setCascadeStep(3), 2300),
      ];
      return () => timers.forEach(clearTimeout);
    } else {
      setCascadeStep(0);
    }
  }, [cascadeData]);

  const radii = [300, 700, 1400];

  return (
    <div className="map-container">
      <MapContainer
        center={BENGALURU_CENTER}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <ThemeAwareTiles />

        {/* Heatmap zone circles */}
        {zones.map(zone => {
          let glowColor = getZoneColor(zone.congestiq_score);
          let glowWeight = selectedZone?.zone_id === zone.zone_id ? 3 : 1;
          let fillOpacity = 0.7;

          // Highlight zones if they are touched by the current cascade ripple
          if (cascadeData && cascadeStep > 0) {
            const currentRadius = radii[cascadeStep - 1];
            const dist = getDistanceMeters(cascadeData.center_lat, cascadeData.center_lng, zone.lat, zone.lng);
            if (dist <= currentRadius) {
              glowColor = '#ff0000'; // Bright red for cascaded zones
              glowWeight = 4;
              fillOpacity = 1.0;
            }
          }

          return (
            <CircleMarker
              key={zone.zone_id}
              center={[zone.lat, zone.lng]}
              radius={getZoneRadius(zone.congestiq_score)}
              pathOptions={{
                color: glowColor,
                fillColor: glowColor,
                fillOpacity: fillOpacity,
                weight: glowWeight,
              }}
              eventHandlers={{
                click: () => onZoneClick(zone),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12 }}>
                 <strong>{zone.display_name || zone.zone_id}</strong><br />
                 <span style={{ opacity: 0.6, fontSize: 10 }}>{zone.zone_id}</span><br />
                 Score: {Number(zone.congestiq_score).toLocaleString()}<br />
                 {zone.primary_violation}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Patrol markers */}
        {patrolData && patrolData.slice(0, 10).map((p, i) => (
          <CircleMarker
            key={`patrol-${i}`}
            center={[p.zone_lat, p.zone_lng]}
            radius={5}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11 }}>
                Patrol: {p.units_assigned} units<br />
                Priority: #{p.priority_rank}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Cascade animation */}
        {cascadeData && <CascadeRings cascadeData={cascadeData} visibleFrames={cascadeStep} />}
      </MapContainer>
    </div>
  );
}
