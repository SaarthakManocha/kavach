import { PageHeader } from '../layout/TopBar';
import TrendChart from '../analytics/TrendChart';

export default function TrendsPage() {
  return (
    <div>
      <PageHeader title="Violation Trends" description="Monthly violation patterns across the monitoring period." />

      <div className="insight-card">
        Violations increased by 18% from January to March 2024, peaking at 62,100 in March.
        The enforcement rate improved steadily from 78% to 87% over the same period.
      </div>

      <TrendChart />
    </div>
  );
}
