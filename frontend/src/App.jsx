import { useMemo, useState } from "react";

const algorithms = [
  { value: "FCFS", label: "First-Come, First-Served" },
  { value: "SJF", label: "Shortest Job First (non-preemptive)" },
  { value: "SRTF", label: "Shortest Remaining Time First (preemptive)" },
  { value: "Priority", label: "Priority (non-preemptive)" },
  { value: "PreemptivePriority", label: "Priority (preemptive)" },
  { value: "RR", label: "Round Robin" },
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

  const selectedAlgorithm = algorithms.find(({ value }) => value === algorithm);
  const timelineEnd = result?.timeline?.at(-1)?.endTime ?? 0;

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
    const nextCount = Math.min(20, Math.max(1, Number(event.target.value) || 1));
    setPatientCount(nextCount);
    setPatients((current) =>
      Array.from({ length: nextCount }, (_, index) => current[index] ?? defaultPatient(index + 1)),
    );
    setResult(null);
  }

  function updatePatient(index, field, value) {
    setPatients((current) =>
      current.map((patient, patientIndex) =>
        patientIndex === index
          ? { ...patient, [field]: Number(value) }
          : patient,
      ),
    );
    setResult(null);
  }

  async function runSchedule(event) {
    event.preventDefault();
    setError("");
    setResult(null);
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
        <div>
          <p className="eyebrow">Emergency department operations</p>
          <h1>Hospital Scheduler</h1>
          <p className="intro">
            Compare scheduling policies against the same patient workload.
          </p>
        </div>
        <div className="header-mark" aria-hidden="true">HS</div>
      </header>

      <form className="workspace" onSubmit={runSchedule}>
        <section className="panel setup-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 / Workload</p>
              <h2>Patient details</h2>
            </div>
            <label className="count-control">
              <span>Patients</span>
              <input
                type="number"
                min="1"
                max="20"
                value={patientCount}
                onChange={changePatientCount}
              />
            </label>
          </div>

          <div className="patient-table">
            <div className="table-row table-header">
              <span>Patient</span>
              <span>Arrival time</span>
              <span>Treatment time</span>
              <span>Priority</span>
            </div>
            {patients.map((patient, index) => (
              <div className="table-row" key={patient.id}>
                <strong>P{patient.id}</strong>
                <input
                  type="number"
                  min="0"
                  value={patient.arrivalTime}
                  onChange={(event) => updatePatient(index, "arrivalTime", event.target.value)}
                  aria-label={`P${patient.id} arrival time`}
                />
                <input
                  type="number"
                  min="1"
                  value={patient.treatmentTime}
                  onChange={(event) => updatePatient(index, "treatmentTime", event.target.value)}
                  aria-label={`P${patient.id} treatment time`}
                />
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={patient.priority}
                  onChange={(event) => updatePatient(index, "priority", event.target.value)}
                  aria-label={`P${patient.id} priority`}
                />
              </div>
            ))}
          </div>
          <p className="helper-text">Priority 1 is the most urgent. Values are measured in time units.</p>
        </section>

        <section className="panel options-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">02 / Policy</p>
              <h2>Scheduling algorithm</h2>
            </div>
          </div>
          <label className="field-label" htmlFor="algorithm">Algorithm</label>
          <select id="algorithm" value={algorithm} onChange={(event) => setAlgorithm(event.target.value)}>
            {algorithms.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {algorithm === "RR" && (
            <label className="field-label quantum-field" htmlFor="quantum">
              Time quantum
              <input
                id="quantum"
                type="number"
                min="1"
                value={quantum}
                onChange={(event) => setQuantum(event.target.value)}
              />
            </label>
          )}
          <div className="selection-note">
            <span className="status-dot" />
            {selectedAlgorithm?.label}
          </div>
          <button className="run-button" type="submit" disabled={isLoading}>
            {isLoading ? "Running simulation..." : "Run simulation"}
          </button>
          {error && <p className="error-message" role="alert">{error}</p>}
        </section>
      </form>

      {result ? (
        <section className="results">
          <div className="results-heading">
            <div>
              <p className="eyebrow">03 / Results</p>
              <h2>{result.metrics.algorithmName}</h2>
            </div>
            <span className="result-tag">{result.processedPatients.length} patients processed</span>
          </div>

          <div className="metrics-grid">
            <Metric label="Average waiting" value={result.metrics.avgWaitingTime} />
            <Metric label="Average turnaround" value={result.metrics.avgTurnaroundTime} />
            <Metric label="Average response" value={result.metrics.avgResponseTime} />
            <Metric label="Doctor utilization" value={result.metrics.doctorUtilization} suffix="%" />
          </div>

          <div className="panel patient-results-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Patient breakdown</p>
                <h2>Individual performance</h2>
              </div>
            </div>
            <div className="results-table-wrap">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Arrival</th>
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
                        <th scope="row">P{patient.id}</th>
                        <td>{patient.arrivalTime}</td>
                        <td>{patient.completionTime}</td>
                        <td>{formatMetric(patient.waitingTime)}</td>
                        <td>{formatMetric(patient.turnaroundTime)}</td>
                        <td>{formatMetric(patient.firstStartTime - patient.arrivalTime)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel gantt-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Timeline</p>
                <h2>Gantt chart</h2>
              </div>
              <span className="timeline-total">0 — {timelineEnd} time units</span>
            </div>
            <div className="gantt-chart">
              {chartSlots.map((slot) => (
                <div
                  className="gantt-slot"
                  data-idle={slot.patientId === null}
                  key={slot.key}
                  style={{ flexGrow: slot.width }}
                  title={`${slot.patientId === null ? "Idle" : `P${slot.patientId}`}: ${slot.startTime} to ${slot.endTime}`}
                >
                  <strong>{slot.patientId === null ? "Idle" : `P${slot.patientId}`}</strong>
                  <span>{slot.startTime}–{slot.endTime}</span>
                </div>
              ))}
            </div>
            <div className="time-axis">
              <span>0</span>
              <span>{timelineEnd}</span>
            </div>
          </div>
        </section>
      ) : (
        <section className="empty-results">
          <span className="empty-icon">↗</span>
          <div>
            <h2>Your schedule will appear here</h2>
            <p>Enter a workload and run a simulation to see performance metrics and the treatment timeline.</p>
          </div>
        </section>
      )}
    </main>
  );
}

function Metric({ label, value, suffix = "" }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{formatMetric(value)}{suffix}</strong>
    </div>
  );
}

function formatMetric(value) {
  return Number(value).toFixed(2);
}

export default App;
