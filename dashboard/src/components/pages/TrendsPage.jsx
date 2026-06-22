import { PageHeader } from '../layout/TopBar';
import TrendChart from '../analytics/TrendChart';

export default function TrendsPage() {
  return (
    <div>
      <PageHeader title="Violation Trends" description="Interactive time-series analysis of historical violation data across various temporal scales. Empowers analytical staff to identify long-term seasonal trends, evaluate the historical effectiveness of past interventions, and compare specific zones against the city-wide baseline." />

      <div className="insight-card">
        Violations increased by 18% from January to March 2024, peaking at 62,100 in March.
        The enforcement rate improved steadily from 78% to 87% over the same period.
      </div>

      <TrendChart />
    </div>
  );
}
