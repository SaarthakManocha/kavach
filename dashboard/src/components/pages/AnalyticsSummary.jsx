import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../layout/TopBar';
import StatCard from '../common/StatCard';
import { fetchEnforcement, fetchArchetypes } from '../../utils/api';
import { BarChart3, AlertTriangle, ShieldCheck, Waypoints } from 'lucide-react';

export default function AnalyticsSummary() {
  const [enforcement, setEnforcement] = useState([]);
  const [archetypes, setArchetypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [e, a] = await Promise.all([fetchEnforcement(), fetchArchetypes()]);
        setEnforcement(e);
        setArchetypes(a);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const totalViolations = enforcement.reduce((s, e) => s + e.total_violations, 0);
  const anomalousCount = enforcement.filter(e => e.is_anomaly).length;
  const avgRate = enforcement.length ? (enforcement.reduce((s, e) => s + e.enforcement_rate, 0) / enforcement.length * 100) : 0;
  const archetypeCount = new Set(archetypes.map(a => a.archetype)).size;
  const anomalies = enforcement.filter(e => e.is_anomaly).sort((a, b) => a.anomaly_score - b.anomaly_score);

  return (
    <div>
      <PageHeader title="Executive Summary" description="High-level aggregation of long-term network KPIs, junction archetypes, and temporal predictions. Functions as an executive intelligence digest, translating raw violation data into strategic insights and a targeted list of priority actions for immediate review." />

      <div className="stat-cards-row">
        <StatCard label="Total Violations" value={totalViolations} icon={BarChart3} accent="var(--accent)" subtext="Nov '23 – Apr '24 dataset" />
        <StatCard label="Anomalous Stations" value={anomalousCount} icon={AlertTriangle} accent="var(--danger)" subtext="Requires immediate DCP review" urgent={true} />
        <StatCard label="Avg Enforcement Rate" value={avgRate} decimals={1} suffix="%" icon={ShieldCheck} accent="var(--success)" subtext="Short of 90% BTP target" />
        <StatCard label="Junction Archetypes" value={archetypeCount} icon={Waypoints} accent="var(--accent)" subtext="Behavior-driven patrol strategy" />
      </div>

      {/* Key Insights */}
      <div className="insight-card" style={{ marginBottom: 16 }}>
        KAVACH has flagged 8 of 54 stations for anomalous enforcement — Kodigehalli (55%) and Hebbala critically below threshold. Network enforcement rate stands at 85.4%, up 9 points since November. Temporal models predict 24h violation counts across 638 active zones.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Stations requiring attention */}
        <div className="panel">
          <div className="panel-header">
            <h3>Stations Requiring Attention</h3>
            <Link to="/analytics/enforcement" className="caption" style={{ color: 'var(--accent)' }}>Analyse</Link>
          </div>
          <div className="alert-list">
            {anomalies.slice(0, 5).map((a, i) => (
              <div key={i} className="alert-item">
                <div>
                  <span className="alert-station">{a.police_station}</span>
                  <span className="alert-detail" style={{ marginLeft: 12 }}>
                    {(a.enforcement_rate * 100).toFixed(0)}% enforcement
                  </span>
                </div>
                <span className="data-number" style={{ color: 'var(--danger)', fontSize: 12 }}>
                  {Number(a.total_violations).toLocaleString()} violations
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Actions */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 11, color: '#94a3b8', letterSpacing: 1 }}>TODAY'S PRIORITY ACTIONS</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            <div className="alert-item" style={{ borderLeft: '3px solid var(--danger)', paddingLeft: 10, lineHeight: 1.5, flex: 1, display: 'flex', alignItems: 'center' }}>
              <div><span style={{ fontWeight: 600, color: 'var(--danger)' }}>[!] Kodigehalli</span> — 55% enforcement rate &middot; Deploy 2 units &middot; Peak hour 9am</div>
            </div>
            <div className="alert-item" style={{ borderLeft: '3px solid var(--danger)', paddingLeft: 10, lineHeight: 1.5, flex: 1, display: 'flex', alignItems: 'center' }}>
              <div><span style={{ fontWeight: 600, color: 'var(--danger)' }}>[!] Hennuru</span> — 66% enforcement rate &middot; 892 violations logged &middot; Audit required</div>
            </div>
            <div className="alert-item" style={{ borderLeft: '3px solid var(--accent)', paddingLeft: 10, lineHeight: 1.5, flex: 1, display: 'flex', alignItems: 'center' }}>
              <div><span style={{ fontWeight: 600, color: 'var(--accent)' }}>[↑] tdr1v6</span> — CongestIQ 784,374 &middot; Highest risk zone &middot; Monitor cascade spread</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
