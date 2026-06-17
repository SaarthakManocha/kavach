import { useState, useEffect } from 'react';
import { PageHeader } from '../layout/TopBar';
import { fetchEnforcement } from '../../utils/api';
import EnforcementChart from '../analytics/EnforcementChart';
import StatCard from '../common/StatCard';
import { Search, ShieldCheck, AlertTriangle, BarChart3, X, TrendingDown, TrendingUp, Info } from 'lucide-react';

export default function EnforcementPage() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);

  useEffect(() => {
    fetchEnforcement().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = search
    ? data.filter(d => d.police_station.toLowerCase().includes(search.toLowerCase()))
    : data;

  const anomalyCount = filtered.filter(d => d.is_anomaly).length;
  const avgRate = filtered.length ? (filtered.reduce((s, d) => s + d.enforcement_rate, 0) / filtered.length * 100) : 0;
  const totalViolations = filtered.reduce((s, d) => s + d.total_violations, 0);
  const lowestStation = [...filtered].sort((a, b) => a.enforcement_rate - b.enforcement_rate)[0];

  return (
    <div>
      <PageHeader title="Enforcement Analysis" description="Identify stations with anomalous enforcement patterns using Isolation Forest detection." />

      {/* KPI strip */}
      <div className="stat-cards-row" style={{ marginBottom: 20 }}>
        <StatCard label="Total Violations" value={totalViolations} icon={BarChart3} accent="var(--accent)" subtext={`${filtered.length} stations`} />
        <StatCard label="Anomalous Stations" value={anomalyCount} icon={AlertTriangle} accent="var(--danger)" subtext={`of ${filtered.length} total`} />
        <StatCard label="Avg Enforcement Rate" value={avgRate} decimals={1} suffix="%" icon={ShieldCheck} accent="var(--success)" subtext="Across filtered" />
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
        <div className="search-wrapper">
          <Search size={14} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search stations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            Anomaly detected
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Normal
          </span>
          <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 8 }}>
            Click any bar to see SHAP explanation
          </span>
        </div>
      </div>

      {!loading && <EnforcementChart data={filtered} onBarClick={(station) => {
        const found = data.find(d => d.police_station === station);
        setSelectedStation(found);
      }} />}

      {/* Anomalous Stations Table */}
      {!loading && (
        <div className="panel" style={{ marginTop: 24 }}>
          <div className="panel-header">
            <h3>Flagged Stations</h3>
            <span className="badge" style={{ background: 'var(--danger-subtle)', color: 'var(--danger)' }}>{anomalyCount} anomalies</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Station</th>
                <th>Violations</th>
                <th>Enforcement</th>
                <th>Approval</th>
                <th>Status</th>
                <th>Primary Reason</th>
              </tr>
            </thead>
            <tbody>
              {filtered.filter(d => d.is_anomaly).map((s, i) => (
                <tr key={i} onClick={() => setSelectedStation(s)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>{s.police_station}</td>
                  <td className="data-number">{s.total_violations.toLocaleString()}</td>
                  <td className="data-number" style={{ color: s.enforcement_rate < avgRate/100 ? 'var(--danger)' : 'var(--success)' }}>
                    {(s.enforcement_rate * 100).toFixed(1)}%
                  </td>
                  <td className="data-number">{(s.approval_rate * 100).toFixed(1)}%</td>
                  <td><span className="severity-badge high">Anomaly</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {s.anomaly_reasons?.[0]
                      ? `${s.anomaly_reasons[0].factor}: ${s.anomaly_reasons[0].detail}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Interactive explanation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <div className="insight-card">
          <strong>How Anomaly Detection Works</strong>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            KAVACH uses an Isolation Forest algorithm to identify police stations where the enforcement rate
            is statistically unusual given total violations, approval rates, and disposal patterns.
            Anomalous stations (red bars) may indicate under-enforcement or systemic resource constraints.
          </p>
        </div>
        <div className="insight-card" style={{ borderLeftColor: 'var(--danger)' }}>
          <strong>Key Finding</strong>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            {anomalyCount} of {filtered.length} stations flagged as anomalous.
            {lowestStation && <> Lowest enforcement: <strong>{lowestStation.police_station}</strong> at {(lowestStation.enforcement_rate * 100).toFixed(0)}%.</>}
            {' '}Average enforcement rate: {avgRate.toFixed(1)}%.
          </p>
        </div>
      </div>

      {/* SHAP Explanation Slide-in Panel */}
      {selectedStation && (
        <div className="shap-overlay" onClick={() => setSelectedStation(null)}>
          <div className="shap-panel" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>{selectedStation.police_station}</h2>
                <span className={`severity-badge ${selectedStation.is_anomaly ? 'high' : 'low'}`} style={{ marginTop: 6, display: 'inline-block' }}>
                  {selectedStation.is_anomaly ? 'Anomaly Detected' : 'Normal'}
                </span>
              </div>
              <button onClick={() => setSelectedStation(null)} className="close-btn" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Station Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div className="shap-stat">
                <span className="shap-stat-label">Violations</span>
                <span className="shap-stat-value">{selectedStation.total_violations.toLocaleString()}</span>
              </div>
              <div className="shap-stat">
                <span className="shap-stat-label">Enforcement Rate</span>
                <span className="shap-stat-value" style={{ color: selectedStation.enforcement_rate < avgRate/100 ? 'var(--danger)' : 'var(--success)' }}>
                  {(selectedStation.enforcement_rate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="shap-stat">
                <span className="shap-stat-label">Approval Rate</span>
                <span className="shap-stat-value">{(selectedStation.approval_rate * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* SHAP Reasons */}
            <h3 style={{ fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={14} />
              Why This Station Was {selectedStation.is_anomaly ? 'Flagged' : 'Classified Normal'}
            </h3>

            {selectedStation.anomaly_reasons && selectedStation.anomaly_reasons.length > 0 ? (
              <div className="shap-reasons">
                {selectedStation.anomaly_reasons.map((reason, i) => (
                  <div key={i} className="shap-reason-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {reason.direction === 'low' ? (
                        <TrendingDown size={16} style={{ color: 'var(--danger)' }} />
                      ) : (
                        <TrendingUp size={16} style={{ color: 'var(--warning)' }} />
                      )}
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{reason.factor}</span>
                      <span className={`severity-badge ${reason.direction === 'low' ? 'high' : 'medium'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                        {reason.direction.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 24px' }}>
                      {reason.detail}
                    </p>
                    {/* SHAP impact bar */}
                    <div style={{ margin: '8px 0 0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 50 }}>Impact:</span>
                      <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(Math.abs(reason.shap_value) * 500, 100)}%`,
                          background: reason.shap_value < 0 ? 'var(--danger)' : 'var(--success)',
                          borderRadius: 3,
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No SHAP explanations available for this station.</p>
            )}

            {/* Recommendation */}
            {selectedStation.is_anomaly && (
              <div className="shap-recommendation">
                <strong>Recommended Action</strong>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  {selectedStation.enforcement_rate < avgRate/100
                    ? `Increase enforcement capacity at ${selectedStation.police_station}. Current rate is significantly below the network average of ${avgRate.toFixed(0)}%.`
                    : `Review violation processing pipeline at ${selectedStation.police_station}. High violation volume with unusual patterns detected.`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
