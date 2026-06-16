import { useState, useEffect } from 'react';
import { PageHeader } from '../layout/TopBar';
import { fetchPatrolPlan } from '../../utils/api';
import DeploymentGrid from '../patrol/DeploymentGrid';

export default function DeploymentPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatrolPlan().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Deployment Schedule" description="24-hour patrol unit allocation across monitored zones. Current hour is highlighted." />
      {!loading && <DeploymentGrid data={data} />}
    </div>
  );
}
