import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';

export default function StatCard({ label, value, decimals = 0, suffix = '', accent = 'var(--accent)', subtext, icon: Icon, urgent = false }) {
  const animatedValue = useAnimatedCounter(value, 1200, decimals);

  return (
    <div className="stat-card">
      <span className="label">{label}</span>
      <span className="value data-number" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {animatedValue}{suffix}
        {urgent && <span className="pulse-dot" />}
      </span>
      {subtext && <span className="subtext">{subtext}</span>}
      {Icon && (
        <div className="stat-icon" style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}>
          <Icon size={18} />
        </div>
      )}
    </div>
  );
}
