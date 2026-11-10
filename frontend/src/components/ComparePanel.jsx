// ComparePanel.jsx - the "Compare algorithms" tab.
//
// It does NOT run any scheduling itself. App.jsx calls runAllAlgorithms()
// (see api.js) and passes the six results in as `comparison.rows`.
// This file only decides how to DISPLAY them:
//   1. a side-by-side table (best value in each column highlighted)
//   2. one small bar chart per metric
//   3. an "Inspect" button that shows one algorithm's full details

import { useEffect, useRef } from "react";
import { METRICS } from "../constants";
import { findBestKeys, formatMetric, hasCriticalPatients, sameWorkload } from "../utils";
import { Alert, LoadingSkeleton, QuantumField, Spinner } from "./Controls";
import { Icon } from "./Icons";
import SimulationView from "./SimulationView";

// Should this metric be compared at all for this workload?
// (Critical-case response is meaningless if nobody has priority 1 or 2.)
const isApplicable = (metric, workload) => !metric.needsCritical || hasCriticalPatients(workload);

// ---------- Bar chart for one metric ----------
function MetricBars({ metric, rows, bestKeys }) {
  const okRows = rows.filter((row) => row.ok);
  const maxValue = Math.max(...okRows.map((row) => row.data.metrics[metric.key]), 0);
  const scaleMax = metric.key === "doctorUtilization" ? 100 : maxValue;

  return (
    <div className="bars-card" style={{ "--accent": metric.accent }}>
      <h4>{metric.label}</h4>
      <p className="bars-hint">{metric.better === "lower" ? "Shorter bar is better" : "Longer bar is better"}</p>
      <ul className="bars">
        {okRows.map((row) => {
          const value = row.data.metrics[metric.key];
          const percent = scaleMax > 0 ? (value / scaleMax) * 100 : 0;
          const isBest = bestKeys.includes(row.algorithm.value);
          return (
            <li key={row.algorithm.value} className={isBest ? "is-best" : ""}>
              <span className="bar-name">{row.algorithm.short}</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: `${percent}%` }} />
              </span>
              <span className="bar-value">{formatMetric(metric, value)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function ComparePanel({
  patientCount,
  quantum,
  onQuantumChange,
  quantumError,
  comparison, // null, or { rows, workload, quantum }
  isStale, // true when inputs changed after the comparison was run
  isLoading,
  error,
  onCompare,
  inspectedKey,
  onInspect,
}) {
  const inspectRef = useRef(null);

  // When the user picks an algorithm, scroll down to its details.
  useEffect(() => {
    if (inspectedKey && inspectRef.current) {
      inspectRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [inspectedKey]);

  const rows = comparison?.rows ?? [];
  const workload = comparison?.workload ?? [];
  const failedRows = rows.filter((row) => !row.ok);
  const inspectedRow = rows.find((row) => row.ok && row.algorithm.value === inspectedKey);

  // Work out the winner(s) of every metric once, then reuse for the table and the bars.
  const bestByMetric = {};
  const tiedMetrics = [];
  METRICS.forEach((metric) => {
    if (!comparison || !isApplicable(metric, workload)) {
      bestByMetric[metric.key] = [];
      return;
    }
    bestByMetric[metric.key] = findBestKeys(rows, metric);
    if (bestByMetric[metric.key].length === 0 && rows.filter((row) => row.ok).length > 1) {
      tiedMetrics.push(metric.short);
    }
  });

  return (
    <div className="compare-panel">
      <section className="panel" aria-labelledby="compare-heading">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Step 2</p>
            <h2 id="compare-heading">Compare all six algorithms</h2>
            <p className="panel-sub">
              Runs FCFS, SJF, SRTF, Priority, Preemptive Priority and Round Robin on the{" "}
              <strong>{patientCount} patient{patientCount === 1 ? "" : "s"}</strong> entered above.
              Every algorithm receives exactly the same patient data.
            </p>
          </div>
        </div>
        <div className="compare-controls">
          <QuantumField id="compare-quantum" value={quantum} onChange={onQuantumChange} />
          <button type="button" className="btn btn-primary" onClick={onCompare} disabled={isLoading || Boolean(quantumError)}>
            {isLoading ? <Spinner /> : <Icon name="compare" size={18} />}
            {isLoading ? "Comparing…" : "Compare all algorithms"}
          </button>
        </div>
        {error && <Alert kind="error" title="Comparison failed">{error}</Alert>}
      </section>

      {isLoading && <LoadingSkeleton label="Running all six algorithms on the same patients…" />}

      {!isLoading && !comparison && !error && (
        <div className="empty-state">
          <span className="empty-icon"><Icon name="compare" size={26} /></span>
          <div>
            <h3>No comparison yet</h3>
            <p>Choose a Round Robin quantum and press “Compare all algorithms” to see all six policies side by side.</p>
          </div>
        </div>
      )}

      {!isLoading && comparison && (
        <div className="compare-results">
          {isStale && (
            <Alert kind="warning" title="These results are out of date">
              The patients or the quantum changed after this comparison was run. Press “Compare all algorithms” again to refresh.
            </Alert>
          )}
          {failedRows.length > 0 && (
            <Alert kind="warning" title={`${failedRows.length} of 6 algorithms failed`}>
              {failedRows.map((row) => `${row.algorithm.short}: ${row.error}`).join(" · ")}
            </Alert>
          )}
          {sameWorkload(rows, workload) ? (
            <Alert kind="success" title="Fair comparison">
              All {rows.length - failedRows.length} successful runs processed the identical {workload.length} patients
              (checked against what the server reported back).
            </Alert>
          ) : (
            <Alert kind="error" title="Workload mismatch">
              The server reported different patients for at least one algorithm, so this comparison may not be fair.
            </Alert>
          )}

          {/* ---------- Side-by-side table ---------- */}
          <section className="panel" aria-labelledby="table-heading">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Side by side</p>
                <h3 id="table-heading">Metrics for every algorithm</h3>
              </div>
              <span className="legend-best"><Icon name="star" size={14} /> Best in column</span>
            </div>
            <div className="table-scroll">
              <table className="data-table compare-table">
                <caption className="sr-only">Comparison of the six scheduling algorithms. The best value in each column is marked.</caption>
                <thead>
                  <tr>
                    <th scope="col">Algorithm</th>
                    {METRICS.map((metric) => (
                      <th scope="col" key={metric.key}>
                        {metric.short}
                        <span className="better-hint">
                          {metric.unit === "%" ? "% · " : ""}
                          {metric.better === "lower" ? "lower is better" : "higher is better"}
                        </span>
                      </th>
                    ))}
                    <th scope="col"><span className="sr-only">Inspect</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const key = row.algorithm.value;
                    if (!row.ok) {
                      return (
                        <tr key={key} className="row-failed">
                          <th scope="row">{row.algorithm.short}</th>
                          <td colSpan={METRICS.length + 1}>Failed: {row.error}</td>
                        </tr>
                      );
                    }
                    return (
                      <tr
                        key={key}
                        className={inspectedKey === key ? "is-selected" : ""}
                        onClick={() => onInspect(key)}
                      >
                        <th scope="row">
                          <span className="algo-cell">
                            {row.algorithm.short}
                            {key === "RR" && <small>quantum {comparison.quantum}</small>}
                          </span>
                        </th>
                        {METRICS.map((metric) => {
                          const applicable = isApplicable(metric, workload);
                          const isBest = bestByMetric[metric.key].includes(key);
                          return (
                            <td key={metric.key} className={isBest ? "cell-best" : ""}>
                              {applicable ? formatMetric(metric, row.data.metrics[metric.key]) : "—"}
                              {isBest && (
                                <>
                                  <Icon name="star" size={13} />
                                  <span className="sr-only"> (best)</span>
                                </>
                              )}
                            </td>
                          );
                        })}
                        <td>
                          <button
                            type="button"
                            className="btn btn-small"
                            aria-pressed={inspectedKey === key}
                            onClick={(event) => {
                              event.stopPropagation(); // the row also has a click handler
                              onInspect(key);
                            }}
                          >
                            {inspectedKey === key ? "Inspecting" : "Inspect"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="table-note">
              {tiedMetrics.length > 0 && <>No highlight for <strong>{tiedMetrics.join(", ")}</strong>: every algorithm scored the same. </>}
              {!hasCriticalPatients(workload) && <>Critical-case response is skipped because no patient has priority 1 or 2. </>}
              Click a row or “Inspect” to see that algorithm’s Gantt chart and patient results.
            </p>
          </section>

          {/* ---------- Bar charts ---------- */}
          <section aria-labelledby="bars-heading">
            <div className="section-title">
              <p className="eyebrow">Visual comparison</p>
              <h3 id="bars-heading">One chart per metric</h3>
            </div>
            <div className="bars-grid">
              {METRICS.filter((metric) => isApplicable(metric, workload)).map((metric) => (
                <MetricBars key={metric.key} metric={metric} rows={rows} bestKeys={bestByMetric[metric.key]} />
              ))}
            </div>
          </section>

          {/* ---------- Inspect one algorithm ---------- */}
          <section ref={inspectRef} className="inspect-section" aria-labelledby="inspect-heading">
            <div className="section-title">
              <p className="eyebrow">Inspect</p>
              <h3 id="inspect-heading">
                {inspectedRow ? `Details: ${inspectedRow.algorithm.short}` : "Details for one algorithm"}
              </h3>
            </div>
            {inspectedRow ? (
              <SimulationView
                algorithm={inspectedRow.algorithm}
                quantum={comparison.quantum}
                data={inspectedRow.data}
                headingLevel={3}
              />
            ) : (
              <div className="empty-state">
                <span className="empty-icon"><Icon name="list" size={26} /></span>
                <div>
                  <h3>Select an algorithm</h3>
                  <p>Press “Inspect” on any row above to see its Gantt chart and the result for each patient.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
