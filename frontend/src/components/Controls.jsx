// Controls.jsx - small reusable UI pieces: algorithm picker, quantum field,
// alert banner, spinner and loading skeleton.

import { ALGORITHMS, LIMITS } from "../constants";
import { getQuantumError } from "../utils";
import { Icon } from "./Icons";

// Six selectable cards. Each card is a real radio button, so the keyboard
// (arrow keys) and screen readers work without extra code.
export function AlgorithmPicker({ value, onChange, disabled }) {
  return (
    <fieldset className="algo-picker" disabled={disabled}>
      <legend>Scheduling policy</legend>
      <div className="algo-grid">
        {ALGORITHMS.map((algorithm) => (
          <label
            key={algorithm.value}
            className={`algo-card${value === algorithm.value ? " is-selected" : ""}`}
          >
            <input
              type="radio"
              name="algorithm"
              value={algorithm.value}
              checked={value === algorithm.value}
              onChange={() => onChange(algorithm.value)}
            />
            <div className="algo-card-body">
              <div className="algo-card-top">
                <strong>{algorithm.short}</strong>
                <span className={`tag ${algorithm.preemptive ? "tag-pre" : "tag-non"}`}>
                  {algorithm.preemptive ? "Preemptive" : "Non-preemptive"}
                </span>
              </div>
              <span className="algo-name">{algorithm.label}</span>
              <span className="algo-desc">{algorithm.description}</span>
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// Time quantum input used by Round Robin (shared by the Simulate and Compare tabs).
export function QuantumField({ value, onChange, id }) {
  const error = getQuantumError(value);
  return (
    <div className={`field quantum-field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>
        Round Robin time quantum <span className="hint">(time units)</span>
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min="1"
        max={LIMITS.maxQuantum}
        value={value}
        onChange={(event) => onChange(event.target.value)}
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

// kind: "error" | "warning" | "info" | "success"
export function Alert({ kind = "error", title, children }) {
  const icon = kind === "success" ? "check" : kind === "info" ? "info" : "alert";
  return (
    <div className={`alert alert-${kind}`} role={kind === "error" ? "alert" : "status"}>
      <Icon name={icon} />
      <div>
        <strong>{title}</strong>
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

// Placeholder blocks shown while the backend is working.
export function LoadingSkeleton({ label }) {
  return (
    <div className="skeleton-wrap" role="status" aria-live="polite">
      <p className="skeleton-label">
        <Spinner /> {label}
      </p>
      <div className="skeleton-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="skeleton-card" key={index} />
        ))}
      </div>
      <div className="skeleton-bar" />
    </div>
  );
}
