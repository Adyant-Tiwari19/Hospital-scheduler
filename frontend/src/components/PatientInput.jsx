// PatientInput.jsx - the shared patient list.
// Both the Simulate tab and the Compare tab read the SAME list from App.jsx,
// so users enter their patients only once.

import { LIMITS, PRIORITY_LEVELS } from "../constants";
import { getPatientFieldError, patientColor } from "../utils";
import { Icon } from "./Icons";

function NumberField({ id, label, ariaLabel, value, error, onChange, min, max, className }) {
  return (
    <div className={`field ${className}${error ? " has-error" : ""}`}>
      <label htmlFor={id} className="mobile-label">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <span className="field-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}

export default function PatientInput({ patients, onUpdate, onAdd, onRemove, onLoadExample, onReset }) {
  const atMax = patients.length >= LIMITS.maxPatients;

  return (
    <section className="panel" aria-labelledby="patients-heading">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Step 1</p>
          <h2 id="patients-heading">Incoming patients</h2>
          <p className="panel-sub">
            Set when each patient arrives, how long treatment takes and their triage priority.
            This list is used by both Simulate and Compare.
          </p>
        </div>
        <div className="panel-actions">
          <span className="count-pill" aria-label={`${patients.length} of ${LIMITS.maxPatients} patients`}>
            {patients.length} / {LIMITS.maxPatients}
          </span>
          <button type="button" className="btn btn-ghost" onClick={onLoadExample}>
            <Icon name="list" size={16} /> Load example
          </button>
          <button type="button" className="btn btn-ghost" onClick={onReset}>
            <Icon name="reset" size={16} /> Reset
          </button>
          <button type="button" className="btn btn-secondary" onClick={onAdd} disabled={atMax}>
            <Icon name="plus" size={16} /> Add patient
          </button>
        </div>
      </div>

      <div className="patient-head" aria-hidden="true">
        <span>Patient</span>
        <span>Arrival time</span>
        <span>Treatment time</span>
        <span>Priority (1 = most urgent)</span>
        <span />
      </div>

      <ul className="patient-list">
        {patients.map((patient, index) => (
          <li className="patient-row" key={patient.id}>
            <span className="patient-badge cell-badge" style={{ background: patientColor(patient.id) }}>
              P{patient.id}
            </span>

            <NumberField
              className="cell-arrival"
              id={`p${patient.id}-arrival`}
              label="Arrival time"
              ariaLabel={`Arrival time for P${patient.id}`}
              min="0"
              max={LIMITS.maxTime}
              value={patient.arrivalTime}
              error={getPatientFieldError(patient, "arrivalTime")}
              onChange={(event) => onUpdate(index, "arrivalTime", event.target.value)}
            />

            <NumberField
              className="cell-treatment"
              id={`p${patient.id}-treatment`}
              label="Treatment time"
              ariaLabel={`Treatment time for P${patient.id}`}
              min="1"
              max={LIMITS.maxTime}
              value={patient.treatmentTime}
              error={getPatientFieldError(patient, "treatmentTime")}
              onChange={(event) => onUpdate(index, "treatmentTime", event.target.value)}
            />

            <div className="field cell-priority">
              <label htmlFor={`p${patient.id}-priority`} className="mobile-label">
                Priority
              </label>
              <select
                id={`p${patient.id}-priority`}
                value={patient.priority}
                aria-label={`Priority for P${patient.id}`}
                data-priority={patient.priority}
                onChange={(event) => onUpdate(index, "priority", event.target.value)}
              >
                {PRIORITY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.value} · {level.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="icon-button cell-remove"
              onClick={() => onRemove(index)}
              disabled={patients.length <= 1}
              aria-label={`Remove patient P${patient.id}`}
              title={patients.length <= 1 ? "At least one patient is required" : "Remove patient"}
            >
              <Icon name="close" size={16} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
