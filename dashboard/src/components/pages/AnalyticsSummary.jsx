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
      <PageHeader title="Executive Summary" description="Key performance indicators and insights across enforcement operations." />

      <div className="stat-cards-row">
        <StatCard label="Total Violations" value={totalViolations} icon={BarChart3} accent="var(--accent)" subtext="Across all stations" />
        <StatCard label="Anomalous Stations" value={anomalousCount} icon={AlertTriangle} accent="var(--danger)" subtext={`of ${enforcement.length} total`} />
        <StatCard label="Avg Enforcement Rate" value={avgRate} decimals={1} suffix="%" icon={ShieldCheck} accent="var(--success)" subtext="Across BTP" />
        <StatCard label="Junction Archetypes" value={archetypeCount} icon={Waypoints} accent="var(--accent)" subtext={`${archetypes.length} junctions classified`} />
      </div>

      {/* Key Insights */}
      <div className="insight-card" style={{ marginBottom: 16 }}>
        {anomalousCount} of {enforcement.length} police stations show anomalous enforcement patterns.
        The average enforcement rate across BTP is {avgRate.toFixed(1)}%, with {archetypeCount} distinct junction behaviour patterns identified.
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

        {/* Quick links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link to="/analytics/enforcement" className="quick-link-card">
            <div className="ql-icon"><ShieldCheck size={18} /></div>
            <div className="ql-text">
              <h4>Enforcement Analysis</h4>
              <p>Anomaly detection across stations</p>
            </div>
          </Link>
          <Link to="/analytics/trends" className="quick-link-card">
            <div className="ql-icon"><BarChart3 size={18} /></div>
            <div className="ql-text">
              <h4>Violation Trends</h4>
              <p>Monthly patterns and growth</p>
            </div>
          </Link>
          <Link to="/analytics/archetypes" className="quick-link-card">
            <div className="ql-icon"><Waypoints size={18} /></div>
            <div className="ql-text">
              <h4>Junction Archetypes</h4>
              <p>Behaviour classification</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
