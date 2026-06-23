import { PageHeader } from '../layout/TopBar';
import TrendChart from '../analytics/TrendChart';

export default function TrendsPage() {
  return (
    <div>
      <PageHeader title="Violation Trends" description="This page provides an interactive view of historical violation data over time. It is useful for spotting long term seasonal trends and evaluating how effective past traffic interventions have been. By comparing specific zones against the city wide average, you can easily see if congestion is improving or getting worse." />

      <div className="insight-card">
        Violations increased by 18% from January to March 2024, peaking at 62,100 in March.
        The enforcement rate improved steadily from 78% to 87% over the same period.
      </div>

      <TrendChart />
    </div>
  );
}
