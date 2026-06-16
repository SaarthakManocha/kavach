import { useState, useEffect } from 'react';
import { fetchHeatmap, fetchCascade, fetchPatrolPlan } from '../../utils/api';
import { PageHeader } from '../layout/TopBar';
import HeatmapMap from '../live/HeatmapMap';
import ZoneInfoPanel from '../live/ZoneInfoPanel';
import StatsBar from '../live/StatsBar';

export default function LiveMapPage() {
  const [zones, setZones] = useState([]);
  const [patrolData, setPatrolData] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [cascadeData, setCascadeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ high: true, medium: true, low: true });

  useEffect(() => {
    const load = async () => {
      try {
        const [h, p] = await Promise.all([fetchHeatmap(), fetchPatrolPlan(new Date().getHours())]);
        setZones(h);
        setPatrolData(p);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleZoneClick = async (zone) => {
    setSelectedZone(zone);
    setCascadeData(null);
    try {
      const c = await fetchCascade(zone.zone_id);
      setCascadeData(c);
    } catch (e) { console.error(e); }
  };

  const filteredZones = zones.filter(z => {
    const s = z.congestiq_score;
    if (s > 700 && !filters.high) return false;
    if (s > 300 && s <= 700 && !filters.medium) return false;
    if (s <= 300 && !filters.low) return false;
    return true;
  });

  const toggleFilter = (key) => setFilters(f => ({ ...f, [key]: !f[key] }));

  return (
    <div>
      <PageHeader title="Live Map" description="Real-time congestion monitoring across Bengaluru." />
      <StatsBar zones={zones} />

      <div className="map-filters">
        <button className={`filter-pill ${filters.high ? 'active' : ''}`} onClick={() => toggleFilter('high')}>
          Critical (&gt;700)
        </button>
        <button className={`filter-pill ${filters.medium ? 'active' : ''}`} onClick={() => toggleFilter('medium')}>
          Moderate (300–700)
        </button>
        <button className={`filter-pill ${filters.low ? 'active' : ''}`} onClick={() => toggleFilter('low')}>
          Normal (&lt;300)
        </button>
      </div>

      <div className={`map-layout ${selectedZone ? '' : 'no-panel'}`}>
        <HeatmapMap
          zones={filteredZones}
          patrolData={patrolData}
          cascadeData={cascadeData}
          selectedZone={selectedZone}
          onZoneClick={handleZoneClick}
        />
        {selectedZone && (
          <ZoneInfoPanel
            zone={selectedZone}
            cascadeData={cascadeData}
            onClose={() => { setSelectedZone(null); setCascadeData(null); }}
          />
        )}
      </div>
    </div>
  );
}
