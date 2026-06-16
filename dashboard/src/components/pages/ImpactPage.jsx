import { useState, useEffect } from 'react';
import { PageHeader } from '../layout/TopBar';
import { fetchCounterfactual } from '../../utils/api';
import StatCard from '../common/StatCard';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';
import { Target, Clock, Truck, TrendingDown } from 'lucide-react';

export default function ImpactPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounterfactual(0.9).then(d => { setResult(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const reduction = useAnimatedCounter(result?.reduction_pct || 0, 1000, 1);
  const hoursSaved = useAnimatedCounter(result?.hours_saved_monthly || 0, 1000, 0);
  const deliveryHours = useAnimatedCounter(result?.delivery_hours_saved_monthly || 0, 1000, 0);

  if (!result && !loading) return <div>No data available.</div>;

  return (
    <div>
      <PageHeader title="Impact Assessment" description="Quantified impact of increasing enforcement rate to 90% — before and after comparison." />

      {result && (
        <>
          <div className="stat-cards-row">
            <StatCard label="CongestionIQ Reduction" value={result.reduction_pct} decimals={1} suffix="%" icon={TrendingDown} accent="var(--success)" />
            <StatCard label="Hours Saved / Month" value={result.hours_saved_monthly} icon={Clock} accent="var(--accent)" />
            <StatCard label="Delivery Hours Saved" value={result.delivery_hours_saved_monthly} icon={Truck} accent="var(--accent)" />
            <StatCard label="Zones Impacted" value={result.top_zones_impacted?.length || 0} icon={Target} accent="var(--warning)" />
          </div>

          {/* Before / After comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div className="panel" style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: 16 }}>Baseline CongestionIQ</h3>
              <div className="data-number" style={{ fontSize: 42, color: 'var(--danger)', letterSpacing: '-0.02em' }}>
                {Number(result.baseline_congestiq).toLocaleString()}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Current aggregate score</p>
              <div style={{ height: 8, background: 'var(--danger-subtle)', borderRadius: 4, marginTop: 16 }}>
                <div style={{ height: '100%', background: 'var(--danger)', borderRadius: 4, width: '100%' }} />
              </div>
            </div>
            <div className="panel" style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: 16 }}>Simulated CongestionIQ</h3>
              <div className="data-number" style={{ fontSize: 42, color: 'var(--success)', letterSpacing: '-0.02em' }}>
                {Number(result.simulated_congestiq).toLocaleString()}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>At 90% enforcement rate</p>
              <div style={{ height: 8, background: 'var(--success-subtle)', borderRadius: 4, marginTop: 16 }}>
                <div style={{
                  height: '100%', background: 'var(--success)', borderRadius: 4,
                  width: `${(result.simulated_congestiq / result.baseline_congestiq * 100).toFixed(1)}%`,
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Top impacted zones */}
          {result.top_zones_impacted && result.top_zones_impacted.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <h3>Top Impacted Zones</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Zone ID</th>
                    <th>Baseline CIQ</th>
                    <th>Simulated CIQ</th>
                    <th>Reduction</th>
                  </tr>
                </thead>
                <tbody>
                  {result.top_zones_impacted.map((zone, i) => (
                    <tr key={i}>
                      <td className="data-number" style={{ fontWeight: 600 }}>{zone.zone_id}</td>
                      <td className="data-number">{Number(zone.baseline).toLocaleString()}</td>
                      <td className="data-number" style={{ color: 'var(--success)' }}>{Number(zone.simulated).toLocaleString()}</td>
                      <td>
                        <span className="severity-badge low">
                          -{((1 - zone.simulated / zone.baseline) * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
