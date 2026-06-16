import { useState, useEffect } from 'react';
import { PageHeader } from '../layout/TopBar';
import { fetchArchetypes } from '../../utils/api';
import ArchetypeChart from '../analytics/ArchetypeChart';

const ARCHETYPE_DESCRIPTIONS = {
  'Commercial Morning Rush': 'High violation density during morning hours (7–10 AM) near commercial zones. Enforcement should focus on pre-peak deployment.',
  'Transit Hub Chaos': 'Persistent congestion around transit stations with high vehicle mix. Requires dedicated enforcement presence.',
  'IT Corridor Bottleneck': 'Evening peak violations (5–8 PM) in IT corridors. Predictable patterns enable proactive deployment.',
  'Market Zone Persistent': 'All-day violations near market areas. Chronic problem requiring structural interventions.',
  'Residential Evening Surge': 'Evening residential area congestion from commercial spillover. Lower severity, responsive enforcement.',
};

export default function ArchetypesPage() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchetypes().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const archetypes = [...new Set(data.map(d => d.archetype))];
  const filtered = filter === 'all' ? data : data.filter(d => d.archetype === filter);

  return (
    <div>
      <PageHeader title="Junction Archetypes" description="Classification of junction behaviour patterns for targeted enforcement strategies." />

      <div className="map-filters" style={{ marginBottom: 20 }}>
        <button className={`filter-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        {archetypes.map(a => (
          <button key={a} className={`filter-pill ${filter === a ? 'active' : ''}`} onClick={() => setFilter(a)}>
            {a}
          </button>
        ))}
      </div>

      {!loading && <ArchetypeChart data={filtered} />}

      {/* Archetype explanations */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Archetype Definitions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {archetypes.map(a => (
            <div key={a} className="insight-card" style={{ borderLeftColor: 'var(--accent)' }}>
              <strong>{a}</strong>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {ARCHETYPE_DESCRIPTIONS[a] || 'Junction behaviour pattern requiring analysis.'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
