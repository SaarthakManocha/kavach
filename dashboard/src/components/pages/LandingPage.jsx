import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Shield, Radio, BarChart3, CalendarClock, ArrowRight, MapPin, AlertTriangle, TrendingUp, ShieldCheck } from 'lucide-react';
import { fetchHeatmap, fetchEnforcement } from '../../utils/api';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';

function SnapshotCard({ label, value, icon: Icon, color }) {
  const animated = useAnimatedCounter(value, 1400, value > 100 ? 0 : 1);
  return (
    <div className="snapshot-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="snap-label">{label}</span>
        <Icon size={16} style={{ color }} />
      </div>
      <span className="snap-value data-number">{animated}</span>
    </div>
  );
}

function RoadNetworkVisual() {
  // Animated SVG road network — urban intelligence identity
  const nodes = [
    { x: 240, y: 200, r: 8, color: 'var(--danger)' },
    { x: 180, y: 160, r: 5, color: 'var(--warning)' },
    { x: 300, y: 150, r: 6, color: 'var(--danger)' },
    { x: 140, y: 240, r: 4, color: 'var(--success)' },
    { x: 320, y: 260, r: 7, color: 'var(--warning)' },
    { x: 200, y: 300, r: 5, color: 'var(--success)' },
    { x: 280, y: 320, r: 4, color: 'var(--success)' },
    { x: 160, y: 100, r: 3, color: 'var(--success)' },
    { x: 350, y: 180, r: 5, color: 'var(--warning)' },
    { x: 100, y: 180, r: 3, color: 'var(--success)' },
    { x: 260, y: 100, r: 4, color: 'var(--accent)' },
    { x: 340, y: 340, r: 3, color: 'var(--success)' },
    { x: 120, y: 320, r: 4, color: 'var(--success)' },
    { x: 380, y: 120, r: 3, color: 'var(--accent)' },
  ];

  const edges = [
    [0, 1], [0, 2], [0, 4], [0, 5], [1, 7], [1, 9],
    [2, 8], [2, 10], [3, 1], [3, 9], [4, 6], [4, 8],
    [5, 6], [5, 12], [6, 11], [7, 10], [8, 13], [9, 12], [10, 13],
  ];

  return (
    <div className="road-network-visual">
      <svg viewBox="0 0 480 440" fill="none">
        {/* Road lines */}
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x} y1={nodes[a].y}
            x2={nodes[b].x} y2={nodes[b].y}
            stroke="var(--border-hover)"
            strokeWidth="1"
            className="road-line"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
        {/* Junction nodes */}
        {nodes.map((node, i) => (
          <circle
            key={i}
            cx={node.x} cy={node.y} r={node.r}
            fill={node.color}
            className="road-node"
            opacity="0.7"
          />
        ))}
        {/* Pulse rings on critical nodes */}
        {nodes.filter(n => n.r > 6).map((node, i) => (
          <circle
            key={`pulse-${i}`}
            cx={node.x} cy={node.y} r={node.r + 12}
            fill="none"
            stroke={node.color}
            strokeWidth="1"
            opacity="0.3"
            className="road-node"
          />
        ))}
      </svg>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [zones, setZones] = useState(0);
  const [avgCIQ, setAvgCIQ] = useState(0);
  const [enfRate, setEnfRate] = useState(0);
  const [alerts, setAlerts] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [heatmap, enforcement] = await Promise.all([fetchHeatmap(), fetchEnforcement()]);
        setZones(heatmap.length);
        setAvgCIQ(Math.round(heatmap.reduce((s, z) => s + (z.congestiq_score || 0), 0) / heatmap.length));
        const avg = enforcement.reduce((s, e) => s + e.enforcement_rate, 0) / enforcement.length;
        setEnfRate(Math.round(avg * 100));
        setAlerts(enforcement.filter(e => e.is_anomaly).length);
      } catch (e) { /* silent — landing still works without data */ }
    };
    load();
  }, []);

  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="nav-brand">
          <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Shield size={18} />
          </div>
          <h1>KAVACH</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            Open Platform <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-eyebrow">Parking Congestion Intelligence</div>
          <h2>
            Monitor. <strong>Analyse.</strong> Enforce.
          </h2>
          <p className="hero-description">
            Real-time monitoring, analytical intelligence, and enforcement planning
            for urban congestion management across Bengaluru.
          </p>
          <div className="hero-ctas">
            <button className="btn-primary" onClick={() => navigate('/operations/overview')}>
              Open Operations Center <ArrowRight size={14} />
            </button>
            <button className="btn-ghost" onClick={() => navigate('/analytics/summary')}>
              View Analytics
            </button>
            <button className="btn-ghost" onClick={() => navigate('/patrol/deployment')}>
              Patrol Planning
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <RoadNetworkVisual />
        </div>
      </section>

      {/* Operational Snapshot */}
      <section className="landing-section">
        <div className="section-eyebrow">Operational Snapshot</div>
        <h3>City at a Glance</h3>
        <p>High-level intelligence across Bengaluru's congestion monitoring network.</p>
        <div className="snapshot-grid">
          <SnapshotCard label="Active Zones" value={zones} icon={MapPin} color="var(--accent)" />
          <SnapshotCard label="Avg CongestionIQ" value={avgCIQ} icon={TrendingUp} color="var(--warning)" />
          <SnapshotCard label="Enforcement Efficiency" value={enfRate} icon={ShieldCheck} color="var(--success)" />
          <SnapshotCard label="High Risk Alerts" value={alerts} icon={AlertTriangle} color="var(--danger)" />
        </div>
      </section>

      {/* Capabilities */}
      <section className="landing-section">
        <div className="section-eyebrow">Platform Capabilities</div>
        <h3>Intelligence at Every Level</h3>
        <div className="capabilities-grid">
          <div className="capability-card" onClick={() => navigate('/operations/overview')} style={{ cursor: 'pointer' }}>
            <div className="cap-icon"><Radio size={20} /></div>
            <h4>Live Operations</h4>
            <p>Monitor congestion in real time. Identify critical zones. Visualise cascade patterns across the urban network.</p>
          </div>
          <div className="capability-card" onClick={() => navigate('/analytics/summary')} style={{ cursor: 'pointer' }}>
            <div className="cap-icon"><BarChart3 size={20} /></div>
            <h4>Analytics</h4>
            <p>Understand trends and anomalies. Measure enforcement effectiveness. Classify junction behaviour patterns.</p>
          </div>
          <div className="capability-card" onClick={() => navigate('/patrol/deployment')} style={{ cursor: 'pointer' }}>
            <div className="cap-icon"><CalendarClock size={20} /></div>
            <h4>Patrol Planning</h4>
            <p>Simulate interventions. Optimise deployment strategies. Quantify impact of enforcement changes.</p>
          </div>
        </div>
      </section>

      {/* Why KAVACH */}
      <section className="landing-section">
        <div className="section-eyebrow">Why KAVACH Exists</div>
        <h3>From Reactive to Predictive</h3>
        <p style={{ marginBottom: 32 }}>
          KAVACH transforms fragmented parking and congestion data into actionable intelligence,
          enabling agencies to anticipate problems, prioritise interventions, and optimise enforcement deployment.
        </p>
        <div className="mission-grid">
          <div className="mission-card">
            <h4>Operational Challenge</h4>
            <p>Illegal and spillover parking near commercial corridors, transit hubs, and event zones silently amplifies congestion across the city.</p>
          </div>
          <div className="mission-card">
            <h4>Why It's Difficult Today</h4>
            <ul>
              <li>Enforcement is reactive, not predictive</li>
              <li>Limited visibility into parking-induced congestion</li>
              <li>Difficult prioritisation of hotspots</li>
              <li>Resource deployment is experience-driven</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 60px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          KAVACH — Parking Congestion Cascade Intelligence Platform — Flipkart Gridlock 2.0
        </p>
      </footer>
    </div>
  );
}
