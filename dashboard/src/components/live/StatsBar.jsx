import { MapPin, TrendingUp, AlertTriangle } from 'lucide-react';

export default function StatsBar({ zones }) {
  if (!zones || zones.length === 0) return null;

  const totalZones = zones.length;
  const avgScore = (zones.reduce((sum, z) => sum + (z.congestiq_score || 0), 0) / totalZones).toFixed(1);
  const highestRisk = zones.reduce((max, z) => (z.congestiq_score || 0) > (max.congestiq_score || 0) ? z : max, zones[0]);

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <div className="filter-pill" style={{ cursor: 'default', display: 'flex', alignItems: 'center', gap: 6 }}>
        <MapPin size={12} />
        Zones: <span className="data-number" style={{ fontWeight: 600 }}>{totalZones}</span>
      </div>
      <div className="filter-pill" style={{ cursor: 'default', display: 'flex', alignItems: 'center', gap: 6 }}>
        <TrendingUp size={12} />
        Avg CIQ: <span className="data-number" style={{ fontWeight: 600 }}>{Number(avgScore).toLocaleString()}</span>
      </div>
      <div className="filter-pill" style={{ cursor: 'default', display: 'flex', alignItems: 'center', gap: 6 }}>
        <AlertTriangle size={12} style={{ color: 'var(--danger)' }} />
        Highest: <span className="data-number" style={{ fontWeight: 600 }}>{highestRisk?.zone_id || '—'}</span>
        <span className="data-number" style={{ color: 'var(--danger)', fontSize: 12 }}>
          ({Number(highestRisk?.congestiq_score || 0).toLocaleString()})
        </span>
      </div>
    </div>
  );
}
