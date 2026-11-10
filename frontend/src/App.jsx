// App.jsx - owns the shared state and the two ways of talking to the backend:
//   * "Run simulation"      -> ONE algorithm   (Simulate tab)
//   * "Compare all"         -> ALL SIX at once (Compare tab)
// The patient list, the chosen algorithm and the quantum live HERE so both tabs share them.

import { useState } from "react";
import { postSchedule, runAllAlgorithms } from "./api";
import { ALGORITHMS, EXAMPLE_PATIENTS, LIMITS } from "./constants";
import ComparePanel from "./components/ComparePanel";
import { Alert, AlgorithmPicker, LoadingSkeleton, QuantumField, Spinner } from "./components/Controls";
import { Icon } from "./components/Icons";
import PatientInput from "./components/PatientInput";
import SimulationView from "./components/SimulationView";
import { countInvalidFields, defaultPatient, getQuantumError, makeDefaultPatients, renumber } from "./utils";

function App() {
  // ----- shared inputs -----
  const [patients, setPatients] = useState(() => makeDefaultPatients(3));
  const [algorithm, setAlgorithm] = useState("FCFS");
  const [quantum, setQuantum] = useState(2);
  const [activeTab, setActiveTab] = useState("simulate");

  // ----- Simulate tab -----
  const [single, setSingle] = useState(null); // { algorithm, quantum, data, inputKey }
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState("");

  // ----- Compare tab -----
  const [comparison, setComparison] = useState(null); // { rows, workload, quantum, inputKey }
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState("");
  const [inspectedKey, setInspectedKey] = useState(null);

  // A "key" is a text fingerprint of the inputs. If the fingerprint of the current
  // inputs differs from the one saved with a result, that result is out of date.
  // (Quantum only matters for Round Robin, so it is left out for other algorithms.)
  const singleKey = JSON.stringify({ patients, algorithm, quantum: algorithm === "RR" ? Number(quantum) : null });
  const compareKey = JSON.stringify({ patients, quantum: Number(quantum) });
  const singleIsStale = single !== null && single.inputKey !== singleKey;
  const compareIsStale = comparison !== null && comparison.inputKey !== compareKey;

  const selectedAlgorithm = ALGORITHMS.find((item) => item.value === algorithm);
  const quantumError = getQuantumError(quantum);

  // ----- patient list handlers -----
  function updatePatient(index, field, value) {
    const nextValue = value === "" ? "" : Number(value);
    setPatients((current) =>
      current.map((patient, i) => (i === index ? { ...patient, [field]: nextValue } : patient)),
    );
  }

  function addPatient() {
    setPatients((current) =>
      current.length >= LIMITS.maxPatients ? current : [...current, defaultPatient(current.length + 1)],
    );
  }

  function removePatient(index) {
    setPatients((current) => (current.length <= 1 ? current : renumber(current.filter((_, i) => i !== index))));
  }

  function loadExample() {
    setPatients(EXAMPLE_PATIENTS.map((patient) => ({ ...patient })));
  }

  function resetAll() {
    setPatients(makeDefaultPatients(3));
    setAlgorithm("FCFS");
    setQuantum(2);
    setSingle(null);
    setRunError("");
    setComparison(null);
    setCompareError("");
    setInspectedKey(null);
  }

  // Returns a message if the inputs cannot be sent yet, otherwise "".
  function validateBeforeRun(needsQuantum) {
    const invalid = countInvalidFields(patients);
    if (invalid > 0) {
      return `Fix the ${invalid} highlighted field${invalid === 1 ? "" : "s"} in the patient list first.`;
    }
    if (needsQuantum && quantumError) return `Round Robin quantum: ${quantumError}.`;
    return "";
  }

  // ----- Simulate: one algorithm -----
  async function runSimulation() {
    setRunError("");
    const problem = validateBeforeRun(algorithm === "RR");
    if (problem) {
      setRunError(problem);
      return;
    }

    const workload = patients.map((patient) => ({ ...patient }));
    setIsRunning(true);
    try {
      const data = await postSchedule(algorithm, quantum, workload);
      setSingle({
        algorithm: selectedAlgorithm,
        quantum: Number(quantum),
        data,
        inputKey: singleKey,
      });
    } catch (error) {
      setRunError(error.message);
    } finally {
      setIsRunning(false);
    }
  }

  // ----- Compare: all six algorithms, same patients -----
  async function runComparison() {
    setCompareError("");
    const problem = validateBeforeRun(true); // Round Robin is always part of a comparison
    if (problem) {
      setCompareError(problem);
      return;
    }

    setIsComparing(true);
    setInspectedKey(null);
    try {
      const { workload, rows } = await runAllAlgorithms(patients, quantum);
      if (rows.every((row) => !row.ok)) {
        // all six failed, so there is nothing to show
        setComparison(null);
        setCompareError(rows[0].error);
      } else {
        setComparison({ rows, workload, quantum: Number(quantum), inputKey: compareKey });
      }
    } catch (error) {
      setCompareError(error.message);
    } finally {
      setIsComparing(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <span className="logo" aria-hidden="true">
            <Icon name="doctor" size={26} />
          </span>
          <div>
            <p className="topbar-eyebrow">Emergency department operations</p>
            <h1>ED Scheduler</h1>
            <p className="topbar-sub">Operating Systems CPU scheduling simulator · one doctor, many patients</p>
          </div>
        </div>
      </header>

      <main className="page">
        <PatientInput
          patients={patients}
          onUpdate={updatePatient}
          onAdd={addPatient}
          onRemove={removePatient}
          onLoadExample={loadExample}
          onReset={resetAll}
        />

        <div className="tabs" role="tablist" aria-label="Simulation mode">
          <button
            type="button"
            role="tab"
            id="tab-simulate"
            aria-selected={activeTab === "simulate"}
            aria-controls="panel-simulate"
            className={`tab${activeTab === "simulate" ? " is-active" : ""}`}
            onClick={() => setActiveTab("simulate")}
          >
            <Icon name="single" size={18} /> Simulate one algorithm
          </button>
          <button
            type="button"
            role="tab"
            id="tab-compare"
            aria-selected={activeTab === "compare"}
            aria-controls="panel-compare"
            className={`tab${activeTab === "compare" ? " is-active" : ""}`}
            onClick={() => setActiveTab("compare")}
          >
            <Icon name="compare" size={18} /> Compare algorithms
          </button>
        </div>

        {activeTab === "simulate" && (
          <div role="tabpanel" id="panel-simulate" aria-labelledby="tab-simulate" className="tab-panel">
            <section className="panel" aria-labelledby="controls-heading">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Step 2</p>
                  <h2 id="controls-heading">Choose a policy and run</h2>
                  <p className="panel-sub">Study one algorithm in detail: metrics, timeline and every patient’s result.</p>
                </div>
              </div>

              <AlgorithmPicker
                value={algorithm}
                onChange={(value) => {
                  setAlgorithm(value);
                  setRunError("");
                }}
                disabled={isRunning}
              />

              <div className="run-bar">
                {algorithm === "RR" && <QuantumField id="single-quantum" value={quantum} onChange={setQuantum} />}
                <p className="run-summary">
                  <strong>{selectedAlgorithm.label}</strong> on {patients.length} patient
                  {patients.length === 1 ? "" : "s"}
                </p>
                <button type="button" className="btn btn-primary" onClick={runSimulation} disabled={isRunning}>
                  {isRunning ? <Spinner /> : <Icon name="play" size={16} />}
                  {isRunning ? "Running simulation…" : "Run simulation"}
                </button>
              </div>

              {runError && <Alert kind="error" title="Cannot run the simulation">{runError}</Alert>}
            </section>

            {isRunning && <LoadingSkeleton label="Running the simulation…" />}

            {!isRunning && single && (
              <>
                {singleIsStale && (
                  <Alert kind="warning" title="These results are out of date">
                    The patients or the policy changed after this run. Press “Run simulation” to refresh.
                  </Alert>
                )}
                <SimulationView algorithm={single.algorithm} quantum={single.quantum} data={single.data} />
              </>
            )}

            {!isRunning && !single && (
              <div className="empty-state">
                <span className="empty-icon"><Icon name="play" size={24} /></span>
                <div>
                  <h3>Your schedule will appear here</h3>
                  <p>Enter your patients, pick a scheduling policy and run the simulation to see the metrics and the treatment timeline.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "compare" && (
          <div role="tabpanel" id="panel-compare" aria-labelledby="tab-compare" className="tab-panel">
            <ComparePanel
              patientCount={patients.length}
              quantum={quantum}
              onQuantumChange={setQuantum}
              quantumError={quantumError}
              comparison={comparison}
              isStale={compareIsStale}
              isLoading={isComparing}
              error={compareError}
              onCompare={runComparison}
              inspectedKey={inspectedKey}
              onInspect={setInspectedKey}
            />
          </div>
        )}
      </main>

      <footer className="footer">ED Scheduler · Operating Systems project · results come from the C++ scheduling backend</footer>
    </div>
  );
}

export default App;
