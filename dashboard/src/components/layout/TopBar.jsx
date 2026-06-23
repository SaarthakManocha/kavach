import { useLocation, Link } from 'react-router-dom';
import { Sun, Moon, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';

function ThemeToggleBtn() {
  const [theme, setTheme] = useState(() => localStorage.getItem('kavach-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kavach-theme', theme);
  }, [theme]);

  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      title={`Switch theme`}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

const PATH_LABELS = {
  '/dashboard': ['Dashboard'],
  '/operations/overview': ['Operations', 'Overview'],
  '/operations/live-map': ['Operations', 'Live Map'],
  '/operations/high-risk': ['Operations', 'High Risk Zones'],
  '/analytics/summary': ['Analytics', 'Executive Summary'],
  '/analytics/enforcement': ['Analytics', 'Enforcement Analysis'],
  '/analytics/trends': ['Analytics', 'Violation Trends'],
  '/analytics/archetypes': ['Analytics', 'Junction Archetypes'],
  '/patrol/deployment': ['Patrol Planning', 'Deployment Schedule'],
  '/patrol/simulation': ['Patrol Planning', 'Simulation Lab'],
  '/patrol/impact': ['Patrol Planning', 'Impact Assessment'],
  '/settings': ['Settings'],
};

export default function TopBar({ onMenuToggle }) {
  const location = useLocation();
  const parts = PATH_LABELS[location.pathname] || [];

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
      </div>
      <div className="topbar-right">
        <ThemeToggleBtn />
      </div>
    </div>
  );
}

export function PageHeader({ title, description }) {
  return (
    <div className="page-header">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
