import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Radio, BarChart3, CalendarClock, MapPin, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../layout/TopBar';
import StatCard from '../common/StatCard';
import { fetchHeatmap, fetchEnforcement } from '../../utils/api';

export default function DashboardPage() {
  const [zones, setZones] = useState([]);
  const [enforcement, setEnforcement] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [h, e] = await Promise.all([fetchHeatmap(), fetchEnforcement()]);
        setZones(h);
        setEnforcement(e);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const totalZones = zones.length;
  const avgCIQ = totalZones ? Math.round(zones.reduce((s, z) => s + (z.congestiq_score || 0), 0) / totalZones) : 0;
  const highestRisk = zones.length > 0 ? zones.reduce((max, z) => (z.congestiq_score || 0) > (max.congestiq_score || 0) ? z : max, zones[0]) : null;
  const avgEnf = enforcement.length ? (enforcement.reduce((s, e) => s + e.enforcement_rate, 0) / enforcement.length * 100).toFixed(1) : 0;
  const anomalies = enforcement.filter(e => e.is_anomaly);

  return (
    <div>
      <PageHeader title="Dashboard" description="Executive overview of KAVACH operations across Bengaluru." />

      {/* KPI Cards */}
      <div className="stat-cards-row">
        <StatCard label="Active Zones" value={totalZones} icon={MapPin} accent="var(--accent)" subtext="Monitored locations" />
        <StatCard label="Avg CongestionIQ" value={avgCIQ} icon={TrendingUp} accent="var(--warning)" subtext="Across all zones" />
        <StatCard label="Highest Risk" value={highestRisk?.congestiq_score || 0} icon={AlertTriangle} accent="var(--danger)" subtext={highestRisk?.zone_id || '—'} />
        <StatCard label="Enforcement Rate" value={parseFloat(avgEnf)} decimals={1} suffix="%" icon={ShieldCheck} accent="var(--success)" subtext="Avg across BTP" />
      </div>

      {/* Quick Links */}
      <div className="quick-links">
        <Link to="/operations/live-map" className="quick-link-card">
          <div className="ql-icon"><Radio size={18} /></div>
          <div className="ql-text">
            <h4>Live Operations</h4>
            <p>Real-time congestion map</p>
          </div>
        </Link>
        <Link to="/analytics/enforcement" className="quick-link-card">
          <div className="ql-icon"><BarChart3 size={18} /></div>
          <div className="ql-text">
            <h4>Analytics</h4>
            <p>Enforcement analysis</p>
          </div>
        </Link>
        <Link to="/patrol/simulation" className="quick-link-card">
          <div className="ql-icon"><CalendarClock size={18} /></div>
          <div className="ql-text">
            <h4>Patrol Planning</h4>
            <p>Simulate interventions</p>
          </div>
        </Link>
      </div>

      {/* Alerts */}
      {anomalies.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <h3>Alerts Requiring Attention</h3>
            <Link to="/analytics/enforcement" className="caption" style={{ color: 'var(--accent)' }}>View all</Link>
          </div>
          <div className="alert-list">
            {anomalies.slice(0, 5).map((a, i) => (
              <div key={i} className="alert-item">
                <div>
                  <span className="alert-station">{a.police_station}</span>
                  <span className="alert-detail" style={{ marginLeft: 12 }}>
                    {Number(a.total_violations).toLocaleString()} violations
                  </span>
                </div>
                <div className="severity-badge high">
                  {(a.enforcement_rate * 100).toFixed(0)}% enforcement
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
