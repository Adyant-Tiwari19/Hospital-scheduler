// SimulationView.jsx - everything we show for ONE algorithm run:
// metric cards, per-patient table and the Gantt chart.
// The Simulate tab uses it directly, and the Compare tab reuses it when the
// user clicks "Inspect" on one algorithm, so the code exists only once.

import { METRICS } from "../constants";
import { clamp, formatMetric, hasCriticalPatients } from "../utils";
import GanttChart from "./GanttChart";
import { Icon } from "./Icons";
import ResultsTable from "./ResultsTable";

function MetricCard({ metric, value, applicable, index }) {
  return (
    <div className="metric-card" style={{ "--accent": metric.accent, animationDelay: `${index * 60}ms` }}>
      <div className="metric-top">
        <span className="metric-icon">
          <Icon name={metric.icon} size={18} />
        </span>
        <span className="metric-label">{metric.label}</span>
      </div>
      <div className="metric-value">
        <strong>{applicable ? formatMetric(metric, value) : "—"}</strong>
        {applicable && <span className="metric-unit">{metric.unit}</span>}
      </div>
      {metric.key === "doctorUtilization" && applicable && (
        <div className="meter" role="img" aria-label={`${formatMetric(metric, value)} percent utilization`}>
          <span style={{ width: `${clamp(value, 0, 100)}%` }} />
        </div>
      )}
      <p className="metric-desc">
        {applicable ? metric.description : "No priority 1 or 2 patients in this workload."}
      </p>
    </div>
  );
}

// algorithm: the entry from ALGORITHMS, quantum: number used (only matters for RR)
export default function SimulationView({ algorithm, quantum, data, headingLevel = 2 }) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const { metrics, processedPatients, timeline } = data;
  const criticalExists = hasCriticalPatients(processedPatients);

  return (
    <div className="simulation-view">
      <div className="result-header">
        <div>
          <p className="eyebrow">Result</p>
          <Heading className="result-title">
            {algorithm.label}
            {algorithm.value === "RR" && <span className="result-quantum"> · quantum {quantum}</span>}
          </Heading>
        </div>
        <div className="chip-row">
          <span className={`tag ${algorithm.preemptive ? "tag-pre" : "tag-non"}`}>
            {algorithm.preemptive ? "Preemptive" : "Non-preemptive"}
          </span>
          <span className="tag tag-plain">{processedPatients.length} patients</span>
        </div>
      </div>

      <div className="metrics-grid">
        {METRICS.map((metric, index) => (
          <MetricCard
            key={metric.key}
            metric={metric}
            value={metrics[metric.key]}
            applicable={!metric.needsCritical || criticalExists}
            index={index}
          />
        ))}
      </div>

      <section className="panel" aria-labelledby={`gantt-${algorithm.value}-${headingLevel}`}>
        <div className="panel-header compact">
          <div>
            <p className="eyebrow">Timeline</p>
            <h3 id={`gantt-${algorithm.value}-${headingLevel}`}>Doctor treatment timeline</h3>
          </div>
          <span className="count-pill">0 – {metrics.totalSimulationTime} time units</span>
        </div>
        <p className="panel-sub">
          One lane = the single doctor. Block width is proportional to time. The same colour appearing
          several times means that patient was interrupted or time-sliced.
        </p>
        <GanttChart timeline={timeline} patients={processedPatients} />
      </section>

      <section className="panel" aria-labelledby={`table-${algorithm.value}-${headingLevel}`}>
        <div className="panel-header compact">
          <div>
            <p className="eyebrow">Patients</p>
            <h3 id={`table-${algorithm.value}-${headingLevel}`}>Individual performance</h3>
          </div>
        </div>
        <ResultsTable patients={processedPatients} />
      </section>
    </div>
  );
}
