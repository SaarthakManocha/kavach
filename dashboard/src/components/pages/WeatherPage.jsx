import { useState, useEffect } from 'react';
import { PageHeader } from '../layout/TopBar';
import { fetchWeatherSensitivity } from '../../utils/api';
import StatCard from '../common/StatCard';
import { CloudRain, Sun, Droplets, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function WeatherPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchWeatherSensitivity()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="skeleton skeleton-chart" />;
  if (!data) return <div>No weather data available.</div>;

  const city = data.city_summary || {};
  const zones = data.zones || [];
  const hourly = data.hourly_shift || [];
  const vehicles = data.vehicle_impact || [];

  const surgeZones = zones.filter(z => z.sensitivity === 'high_increase');
  const dropZones = zones.filter(z => z.sensitivity === 'high_decrease');
  const filteredZones = filter === 'all' ? zones
    : filter === 'surge' ? zones.filter(z => z.pct_change > 20)
    : zones.filter(z => z.pct_change < -20);

  return (
    <div>
      <PageHeader title="Weather Sensitivity" description="This page shows how different weather conditions affect traffic violations across the city. It is highly useful for identifying which specific junctions experience the worst congestion during rainfall, allowing you to proactively adjust patrol routes and prevent traffic gridlock before a storm hits." />

      {/* City KPIs */}
      <div className="stat-cards-row">
        <StatCard
          label="Rainy Days"
          value={city.rain_days || 0}
          suffix=" days"
          icon={CloudRain}
          accent="var(--accent)"
          subtext={`${city.dry_days || 0} dry days in dataset`}
        />
        <StatCard
          label="Rain Day Avg"
          value={city.rain_avg_violations || 0}
          suffix=" vpd"
          icon={Droplets}
          accent="var(--accent)"
          subtext={`Dry: ${city.dry_avg_violations || 0} vpd (violations per day)`}
        />
        <StatCard
          label="Surge Zones"
          value={surgeZones.length}
          icon={TrendingUp}
          accent="var(--danger)"
          subtext="Violations increase over 50% on rain"
        />
        <StatCard
          label="Drop Zones"
          value={dropZones.length}
          icon={TrendingDown}
          accent="var(--success)"
          subtext="Violations drop over 50% on rain"
        />
      </div>

      {/* Insight callout */}
      <div className="panel" style={{ marginBottom: 24, background: 'var(--bg-elevated)', border: '1px solid var(--accent)', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <CloudRain size={24} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Key Finding</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              While rainfall has <strong>no significant city-wide effect</strong> (p={city.p_value}), 
              individual zones show extreme sensitivity. <strong>{surgeZones.length} zones</strong> see 
              violations more than double during rain (likely flyover/underpass areas where vehicles shelter), 
              while <strong>{dropZones.length} zones</strong> see violations drop sharply 
              (camera obstruction or route avoidance). Heavy rain ({'>'}2mm) actually <em>reduces</em> total 
              violations to {city.heavy_rain_vpd}/day vs {city.dry_vpd}/day on dry days.
            </div>
          </div>
        </div>
      </div>

      {/* Filter Pills + Zone Table */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <h3>Weather-Sensitive Zones</h3>
          <div className="map-filters">
            {[
              { key: 'all', label: `All (${zones.length})` },
              { key: 'surge', label: `Surge (${zones.filter(z => z.pct_change > 20).length})` },
              { key: 'drop', label: `Drop (${zones.filter(z => z.pct_change < -20).length})` },
            ].map(f => (
              <button
                key={f.key}
                className={`filter-pill ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Zone</th>
                <th>Rain (vpd)</th>
                <th>Dry (vpd)</th>
                <th>Change</th>
                <th>Impact</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {filteredZones.slice(0, 30).map((z, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {z.zone_name}
                  </td>
                  <td className="data-number">{z.rain_vpd}</td>
                  <td className="data-number">{z.dry_vpd}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      color: z.pct_change > 0 ? 'var(--danger)' : 'var(--success)',
                      fontWeight: 600, fontSize: 13,
                    }}>
                      {z.pct_change > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {z.pct_change > 0 ? '+' : ''}{z.pct_change}%
                    </span>
                  </td>
                  <td>
                    <span className={`severity-badge ${
                      z.sensitivity.includes('high') ? 'high' :
                      z.sensitivity.includes('moderate') ? 'medium' : 'low'
                    }`}>
                      {z.label.split(' ').slice(1, 2).join(' ')}
                      {z.sensitivity.includes('increase') ? ' ↑' : z.sensitivity.includes('decrease') ? ' ↓' : ''}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 220 }}>
                    {z.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-column: Hourly shift + Vehicle impact */}
      <div className="charts-grid">
        {/* Hourly shift */}
        <div className="chart-card">
          <h3>Hourly Pattern Shift</h3>
          <p className="chart-description">How rain redistributes violations across the day</p>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {hourly.map((h, i) => {
              const maxVal = Math.max(...hourly.map(x => Math.max(x.rain_avg, x.dry_avg)));
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, fontSize: 12 }}>
                  <span style={{ width: 45, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {String(h.hour).padStart(2, '0')}:00
                  </span>
                  <div style={{ flex: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <div style={{
                      height: 10, borderRadius: 3,
                      background: 'var(--accent)',
                      width: `${(h.rain_avg / maxVal * 100).toFixed(0)}%`,
                      opacity: 0.8,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <div style={{
                      height: 10, borderRadius: 3,
                      background: 'var(--warning)',
                      width: `${(h.dry_avg / maxVal * 100).toFixed(0)}%`,
                      opacity: 0.6,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <span style={{
                    width: 55, textAlign: 'right', fontWeight: 600,
                    color: Math.abs(h.pct_change) > 15
                      ? (h.pct_change > 0 ? 'var(--danger)' : 'var(--success)')
                      : 'var(--text-muted)',
                  }}>
                    {h.pct_change > 0 ? '+' : ''}{h.pct_change}%
                  </span>
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)', opacity: 0.8 }} /> Rain days
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--warning)', opacity: 0.6 }} /> Dry days
              </span>
            </div>
          </div>
        </div>

        {/* Vehicle impact */}
        <div className="chart-card">
          <h3>Vehicle Type Impact</h3>
          <p className="chart-description">Which vehicle types are most affected by rain</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {vehicles.map((v, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{v.vehicle_type}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: v.pct_change > 0 ? 'var(--danger)' : 'var(--success)',
                  }}>
                    {v.pct_change > 0 ? '+' : ''}{v.pct_change}%
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4, height: 6 }}>
                  <div style={{
                    flex: v.rain_vpd, background: 'var(--accent)', borderRadius: 3, opacity: 0.8,
                  }} />
                  <div style={{
                    flex: v.dry_vpd, background: 'var(--warning)', borderRadius: 3, opacity: 0.5,
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  <span>Rain: {v.rain_vpd}/day</span>
                  <span>Dry: {v.dry_vpd}/day</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
