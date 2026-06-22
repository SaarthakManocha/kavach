import { PageHeader } from '../layout/TopBar';
import TrendChart from '../analytics/TrendChart';

export default function TrendsPage() {
  return (
    <div>
      <PageHeader title="Violation Trends" description="Tracks historical and projected violation trends across all zones. Empowers command staff to validate the effectiveness of their interventions by comparing local growth curves against network baselines." />

      <div className="insight-card">
        Violations increased by 18% from January to March 2024, peaking at 62,100 in March.
        The enforcement rate improved steadily from 78% to 87% over the same period.
      </div>

      <TrendChart />
    </div>
  );
}
