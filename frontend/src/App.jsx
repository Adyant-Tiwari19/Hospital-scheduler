import { useMemo, useState } from "react";

const algorithms = [
  { value: "FCFS", abbreviation: "FCFS", label: "First Come, First Served" },
  { value: "SJF", abbreviation: "SJF", label: "Shortest Job First" },
  { value: "SRTF", abbreviation: "SRTF", label: "Shortest Remaining Time First" },
  { value: "Priority", abbreviation: "Priority", label: "Priority Scheduling" },
  { value: "PreemptivePriority", abbreviation: "Preemptive Priority", label: "Preemptive Priority Scheduling" },
  { value: "RR", abbreviation: "RR", label: "Round Robin" },
];

const metricDefinitions = [
  {
    key: "avgWaitingTime",
    label: "Average waiting time",
    unit: "time units",
    description: "Average time before treatment starts.",
  },
  {
    key: "avgTurnaroundTime",
    label: "Average turnaround time",
    unit: "time units",
    description: "Average time from arrival to completion.",
  },
  {
    key: "avgResponseTime",
    label: "Average response time",
    unit: "time units",
    description: "Average time from arrival to first treatment.",
  },
  {
    key: "doctorUtilization",
    label: "Doctor utilization",
    unit: "%",
    description: "Share of the simulation spent treating patients.",
  },
];

const defaultPatient = (id) => ({
  id,
  arrivalTime: id === 1 ? 0 : id - 1,
  treatmentTime: 3,
  priority: 3,
});

function App() {
  const [patientCount, setPatientCount] = useState(3);
  const [patients, setPatients] = useState(() =>
    Array.from({ length: 3 }, (_, index) => defaultPatient(index + 1)),
  );
  const [algorithm, setAlgorithm] = useState("FCFS");
  const [quantum, setQuantum] = useState(2);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const timelineEnd = Math.max(
    0,
    ...(result?.timeline ?? []).map((slot) => slot.endTime),
  );
  const timelineTicks = Array.from(
    new Set(
      Array.from({ length: 5 }, (_, index) =>
        Math.round((timelineEnd * index) / 4),
      ),
    ),
  );

  const chartSlots = useMemo(() => {
    const timeline = [...(result?.timeline ?? [])].sort(
      (left, right) => left.startTime - right.startTime,
    );
    const slots = [];
    let cursor = 0;

    timeline.forEach((slot, index) => {
      if (slot.startTime > cursor) {
        slots.push({
          key: `idle-${cursor}-${slot.startTime}`,
          startTime: cursor,
          endTime: slot.startTime,
          patientId: null,
          width: slot.startTime - cursor,
        });
      }
      slots.push({
        ...slot,
        key: `${slot.patientId}-${slot.startTime}-${index}`,
        width: Math.max(slot.endTime - slot.startTime, 0),
      });
      cursor = Math.max(cursor, slot.endTime);
    });

    return slots;
  }, [result]);

  function changePatientCount(event) {
    const rawValue = event.target.value;
    if (rawValue === "") {
      setPatientCount("");
      setResult(null);
      return;
    }

    const nextCount = Math.min(20, Math.max(0, Number(rawValue) || 0));
    setPatientCount(nextCount);
    setPatients((current) =>
      Array.from({ length: nextCount }, (_, index) => current[index] ?? defaultPatient(index + 1)),
    );
    setResult(null);
  }

  function updatePatient(index, field, value) {
    const nextValue = value === "" ? "" : Number(value);
    setPatients((current) =>
      current.map((patient, patientIndex) =>
        patientIndex === index
          ? { ...patient, [field]: nextValue }
          : patient,
      ),
    );
    setResult(null);
  }

  function normalizePatientField(index, field) {
    setPatients((current) =>
      current.map((patient, patientIndex) =>
        patientIndex === index && patient[field] === ""
          ? { ...patient, [field]: 0 }
          : patient,
      ),
    );
  }

  function normalizePatientCount() {
    if (patientCount === "") {
      setPatientCount(0);
      setPatients([]);
    }
  }

  function resetSimulation() {
    setPatientCount(3);
    setPatients(Array.from({ length: 3 }, (_, index) => defaultPatient(index + 1)));
    setAlgorithm("FCFS");
    setQuantum(2);
    setResult(null);
    setError("");
  }

  async function runSchedule(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!Number.isInteger(patientCount) || patientCount < 1) {
      setError("Number of patients must be at least 1.");
      return;
    }

    const invalidPatient = patients.find((patient) =>
      ["arrivalTime", "treatmentTime", "priority"].some(
        (field) => getPatientFieldError(patient, field),
      ),
    );
    if (invalidPatient) {
      setError(`Fix the highlighted fields for P${invalidPatient.id} before running the simulation.`);
      return;
    }

    const quantumError = algorithm === "RR" ? getQuantumError(quantum) : "";
    if (quantumError) {
      setError(quantumError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          algorithm,
          ...(algorithm === "RR" ? { quantum: Number(quantum) } : {}),
          patients,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "The scheduling request failed.");
      }
      setResult(payload);
    } catch (requestError) {
      setError(
        requestError.message.includes("Failed to fetch")
          ? "Unable to connect to the backend. Start the server on port 18080 and try again."
          : requestError.message,
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div className="header-content">
          <div className="header-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" role="presentation">
              <circle className="doctor-hair" cx="24" cy="14" r="8" />
              <circle className="doctor-face" cx="24" cy="17" r="6" />
              <path className="doctor-coat" d="M12 40c1-8 5-12 12-12s11 4 12 12H12Z" />
              <path className="doctor-stethoscope" d="M19 29v3c0 3 2 5 5 5s5-2 5-5v-1" />
              <circle className="doctor-chest-piece" cx="29" cy="36" r="1.5" />
            </svg>
          </div>
          <div>
            <p className="eyebrow">Emergency department operations</p>
            <h1>ED Scheduler</h1>
            <p className="subtitle">Operating Systems Scheduling Simulator</p>
          </div>
        </div>
        <div className="header-controls">
          <label className="policy-control" htmlFor="algorithm">
            <span>Scheduling policy</span>
            <select
              id="algorithm"
              value={algorithm}
              onChange={(event) => {
                setAlgorithm(event.target.value);
                setError("");
              }}
            >
              {algorithms.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.abbreviation} — {option.label}
                </option>
              ))}
            </select>
          </label>
          {algorithm === "RR" && (
            <label className={`quantum-control${getQuantumError(quantum) ? " has-error" : ""}`} htmlFor="quantum">
              <span>Quantum <small>(time units)</small></span>
              <input
                id="quantum"
                type="number"
                min="1"
                value={quantum}
                onChange={(event) => setQuantum(event.target.value)}
                onKeyDown={preventNumberStepping}
                aria-invalid={Boolean(getQuantumError(quantum))}
                aria-describedby={getQuantumError(quantum) ? "quantum-error" : undefined}
              />
              {getQuantumError(quantum) && <span className="field-error" id="quantum-error">{getQuantumError(quantum)}</span>}
            </label>
          )}
        </div>
      </header>

      <form className="workspace" onSubmit={runSchedule}>
        <section className="panel setup-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 / Incoming Patients</p>
              <h2>Patient details</h2>
            </div>
            <label className={`count-control${patientCount === 0 ? " has-error" : ""}`}>
              <span>Number of patients</span>
              <input
                type="number"
                min="1"
                max="20"
                value={patientCount}
                onChange={changePatientCount}
                onBlur={normalizePatientCount}
                onKeyDown={preventNumberStepping}
                aria-label="Number of patients"
                aria-invalid={patientCount === 0}
                aria-describedby={patientCount === 0 ? "patient-count-error" : undefined}
              />
              {patientCount === 0 && <span className="count-error" id="patient-count-error">Enter 1–20.</span>}
            </label>
          </div>

          <div className="patient-table">
            <div className="table-row table-header" aria-hidden="true">
              <span>Patient</span>
              <span>Arrival time <small>(time units)</small></span>
              <span>Treatment time <small>(time units)</small></span>
              <span>Priority <small>(1–5)</small></span>
            </div>
            {patients.map((patient, index) => (
              <div className="table-row patient-row" key={patient.id}>
                <div className="patient-identity">
                  <span>Patient</span>
                  <strong>P{patient.id}</strong>
                </div>
                <PatientField
                  id={`patient-${patient.id}-arrival`}
                  label="Arrival time"
                  hint="time units"
                  min="0"
                  value={patient.arrivalTime}
                  error={getPatientFieldError(patient, "arrivalTime")}
                  onChange={(event) => updatePatient(index, "arrivalTime", event.target.value)}
                  onBlur={() => normalizePatientField(index, "arrivalTime")}
                />
                <PatientField
                  id={`patient-${patient.id}-treatment`}
                  label="Treatment time"
                  hint="time units"
                  min="1"
                  value={patient.treatmentTime}
                  error={getPatientFieldError(patient, "treatmentTime")}
                  onChange={(event) => updatePatient(index, "treatmentTime", event.target.value)}
                  onBlur={() => normalizePatientField(index, "treatmentTime")}
                />
                <PatientField
                  id={`patient-${patient.id}-priority`}
                  label="Priority"
                  hint="1–5"
                  min="1"
                  max="5"
                  value={patient.priority}
                  error={getPatientFieldError(patient, "priority")}
                  onChange={(event) => updatePatient(index, "priority", event.target.value)}
                  onBlur={() => normalizePatientField(index, "priority")}
                />
              </div>
            ))}
          </div>
          <div className="simulation-toolbar">
            <div className="toolbar-context">Ready to simulate with the selected policy.</div>
            <div className="toolbar-actions">
              <button className="run-button" type="submit" disabled={isLoading} aria-busy={isLoading}>
                {isLoading && <span className="button-spinner" aria-hidden="true" />}
                <span>{isLoading ? "Running simulation..." : "Run simulation"}</span>
              </button>
              <button className="reset-button" type="button" onClick={resetSimulation} disabled={isLoading}>
                Reset
              </button>
            </div>
          </div>
          {error && <p className="error-message" role="alert" aria-live="assertive">{error}</p>}
        </section>
      </form>

      {result ? (
        <section className="results">
          <div className="results-heading">
            <div>
              <p className="eyebrow">03 / Latest simulation</p>
              <h2>{result.metrics.algorithmName}</h2>
            </div>
            <span className="result-tag">Latest run · {result.processedPatients.length} patients processed</span>
          </div>

          <div className="metrics-grid" aria-label="Simulation summary metrics">
            {metricDefinitions
              .filter(({ key }) => isMetricAvailable(result.metrics?.[key]))
              .map((metric) => (
                <Metric
                  key={metric.key}
                  label={metric.label}
                  value={result.metrics[metric.key]}
                  unit={metric.unit}
                  description={metric.description}
                />
              ))}
          </div>

          <div className="panel patient-results-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Patient breakdown</p>
                <h2>Individual performance</h2>
              </div>
            </div>
            <div className="results-table-wrap">
              {result.processedPatients?.length ? (
                <table className="results-table">
                  <caption className="sr-only">Per-patient scheduling results</caption>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Arrival</th>
                    <th>Treatment</th>
                    <th>Priority</th>
                    <th>First start</th>
                    <th>Completion</th>
                    <th>Waiting</th>
                    <th>Turnaround</th>
                    <th>Response</th>
                  </tr>
                </thead>
                <tbody>
                  {[...result.processedPatients]
                    .sort((left, right) => left.id - right.id)
                    .map((patient) => (
                      <tr key={patient.id}>
                        <th scope="row">{formatPatientId(patient.id)}</th>
                        <td>{formatTableValue(patient.arrivalTime)}</td>
                        <td>{formatTableValue(patient.treatmentTime)}</td>
                        <td>{formatTableValue(patient.priority)}</td>
                        <td>{formatTableValue(patient.firstStartTime)}</td>
                        <td>{formatTableValue(patient.completionTime)}</td>
                        <td>{formatTableValue(patient.waitingTime)}</td>
                        <td>{formatTableValue(patient.turnaroundTime)}</td>
                        <td>{formatTableValue(getResponseTime(patient))}</td>
                      </tr>
                    ))}
                </tbody>
                </table>
              ) : (
                <div className="table-empty-state">
                  <strong>No patient results available</strong>
                  <span>Run a simulation with at least one patient to populate this table.</span>
                </div>
              )}
            </div>
          </div>

          <div className="panel gantt-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Timeline</p>
                <h2>Doctor treatment timeline</h2>
              </div>
              <span className="timeline-total">0 — {timelineEnd} time units</span>
            </div>
            <p className="chart-helper">
              One lane represents the single doctor. Repeated patient labels show preemption or time-sliced treatment.
            </p>
            <div className="gantt-scroll">
              <div
                className="gantt-chart"
                role="list"
                aria-label={`Doctor treatment timeline from 0 to ${timelineEnd} time units`}
                style={{ minWidth: `${Math.max(620, chartSlots.length * 76)}px` }}
              >
                {chartSlots.map((slot) => {
                  const duration = slot.endTime - slot.startTime;
                  const patientLabel = slot.patientId === null ? "Idle" : `Patient P${slot.patientId}`;
                  return (
                    <div
                      className="gantt-slot"
                      data-idle={slot.patientId === null}
                      key={slot.key}
                      role="listitem"
                      style={{ flexGrow: slot.width }}
                      title={`${patientLabel}: ${slot.startTime} to ${slot.endTime} (${duration} time units)`}
                      aria-label={`${patientLabel}, start ${slot.startTime}, end ${slot.endTime}, duration ${duration} time units`}
                    >
                      <strong>{slot.patientId === null ? "Idle" : `P${slot.patientId}`}</strong>
                      <span>{slot.startTime}–{slot.endTime}</span>
                      <small>{duration} unit{duration === 1 ? "" : "s"}</small>
                    </div>
                  );
                })}
              </div>
              <div
                className="time-axis"
                style={{ gridTemplateColumns: `repeat(${Math.max(timelineTicks.length, 1)}, minmax(0, 1fr))` }}
              >
                {timelineTicks.map((tick) => <span key={tick}>{tick}</span>)}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="empty-results">
          <span className="empty-icon" aria-hidden="true">↗</span>
          <div>
            <h2>Your schedule will appear here</h2>
            <p>Enter your patients, select a scheduling algorithm, and run the simulation to see performance metrics and the treatment timeline.</p>
          </div>
        </section>
      )}
    </main>
  );
}

function Metric({ label, value, unit, description }) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <strong>{formatMetric(value)}</strong>
      <span className="metric-unit">{unit}</span>
      <p>{description}</p>
    </div>
  );
}

function isMetricAvailable(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function formatPatientId(value) {
  return isMetricAvailable(value) ? `P${value}` : "—";
}

function formatTableValue(value) {
  return isMetricAvailable(value) ? formatMetric(value) : "—";
}

function getResponseTime(patient) {
  if (!isMetricAvailable(patient.firstStartTime) || !isMetricAvailable(patient.arrivalTime)) {
    return null;
  }
  return patient.firstStartTime - patient.arrivalTime;
}

function PatientField({ id, label, hint, min, max, value, error, onChange, onBlur }) {
  return (
    <div className={`patient-field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>
        {label} <span>({hint})</span>
      </label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={preventNumberStepping}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <span className="field-error" id={`${id}-error`}>{error}</span>}
    </div>
  );
}

function preventNumberStepping(event) {
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
  }
}

function getPatientFieldError(patient, field) {
  const value = patient[field];
  if (!Number.isFinite(value)) return "Enter a number.";
  if (field === "arrivalTime" && value < 0) return "Use 0 or more.";
  if (field === "treatmentTime" && value < 1) return "Use at least 1.";
  if (field === "priority" && (value < 1 || value > 5)) return "Use 1–5.";
  return "";
}

function getQuantumError(value) {
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue)) return "Enter a whole number.";
  if (numericValue <= 0) return "Quantum must be greater than zero.";
  return "";
}

function formatMetric(value) {
  return Number(value).toFixed(2);
}

export default App;
