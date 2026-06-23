import { useState } from 'react';
import { PageHeader } from '../layout/TopBar';
import CounterfactualSlider from '../patrol/CounterfactualSlider';
import { CheckCircle } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Current State' },
  { id: 2, label: 'Adjust Enforcement' },
  { id: 3, label: 'Projected Outcomes' },
];

export default function SimulationLab() {
  const [step, setStep] = useState(1);

  return (
    <div>
      <PageHeader title="Simulation Lab" description="Welcome to an interactive sandbox where you can safely test hypothetical policy changes. It allows you to tweak variables like targeted enforcement rates and immediately see the projected reduction in congestion. This is incredibly useful for planning because it lets you visualize the impact of your decisions before committing real world resources." />

      {/* Guided steps */}
      <div className="guided-steps">
        {STEPS.map(s => (
          <button
            key={s.id}
            className={`step-indicator ${step === s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}
            onClick={() => setStep(s.id)}
          >
            {step > s.id && <CheckCircle size={12} />}
            Step {s.id}: {s.label}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div>
          <div className="insight-card">
            The current baseline CongestionIQ across all monitored zones is calculated from real-time data.
            Adjust the enforcement rate in the next step to see how interventions would reduce congestion.
          </div>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button className="btn-primary" onClick={() => setStep(2)}>
              Begin Simulation
            </button>
          </div>
        </div>
      )}

      {step >= 2 && (
        <div>
          <CounterfactualSlider />
          {step === 2 && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button className="btn-primary" onClick={() => setStep(3)}>
                View Full Impact Assessment
              </button>
            </div>
          )}
          {step === 3 && (
            <div className="insight-card" style={{ marginTop: 24 }}>
              Simulation complete. Review the projected outcomes above, or visit the
              <a href="/patrol/impact" style={{ marginLeft: 4 }}>Impact Assessment</a> page
              for a detailed comparison.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
