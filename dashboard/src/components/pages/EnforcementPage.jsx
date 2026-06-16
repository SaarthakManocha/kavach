import { useState, useEffect } from 'react';
import { PageHeader } from '../layout/TopBar';
import { fetchEnforcement } from '../../utils/api';
import EnforcementChart from '../analytics/EnforcementChart';
import { Search } from 'lucide-react';

export default function EnforcementPage() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnforcement().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = search
    ? data.filter(d => d.police_station.toLowerCase().includes(search.toLowerCase()))
    : data;

  return (
    <div>
      <PageHeader title="Enforcement Analysis" description="Identify stations with anomalous enforcement patterns using Isolation Forest detection." />

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
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
        </div>
      </div>

      {!loading && <EnforcementChart data={filtered} />}

      {filtered.length > 0 && (
        <div className="insight-card" style={{ marginTop: 24 }}>
          {filtered.filter(d => d.is_anomaly).length} of {filtered.length} stations flagged as anomalous.
          Average enforcement rate: {(filtered.reduce((s, d) => s + d.enforcement_rate, 0) / filtered.length * 100).toFixed(1)}%.
        </div>
      )}
    </div>
  );
}
