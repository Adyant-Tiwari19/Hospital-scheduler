// utils.js
// Small pure helper functions (no React in here), so they are easy to read and test.

import { LIMITS, PATIENT_COLORS } from "./constants";

export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

// ---------- Patients ----------

export function defaultPatient(id) {
  return { id, arrivalTime: id === 1 ? 0 : id - 1, treatmentTime: 3, priority: 3 };
}

export function makeDefaultPatients(count) {
  return Array.from({ length: count }, (_, index) => defaultPatient(index + 1));
}

// After removing a patient we renumber so ids are always 1..n and never duplicated.
export function renumber(patients) {
  return patients.map((patient, index) => ({ ...patient, id: index + 1 }));
}

export function patientColor(id) {
  return PATIENT_COLORS[(id - 1) % PATIENT_COLORS.length];
}

// Returns "" when the field is fine, otherwise a short message for the user.
export function getPatientFieldError(patient, field) {
  const value = patient[field];
  if (value === "" || !Number.isFinite(value)) return "Enter a number";
  if (!Number.isInteger(value)) return "Whole numbers only";
  if (field === "arrivalTime") {
    if (value < 0) return "Must be 0 or more";
    if (value > LIMITS.maxTime) return `Max ${LIMITS.maxTime}`;
  }
  if (field === "treatmentTime") {
    if (value < 1) return "Must be at least 1";
    if (value > LIMITS.maxTime) return `Max ${LIMITS.maxTime}`;
  }
  if (field === "priority" && (value < 1 || value > 5)) return "Use 1 to 5";
  return "";
}

export function getQuantumError(value) {
  const number = Number(value);
  if (value === "" || !Number.isFinite(number)) return "Enter a number";
  if (!Number.isInteger(number)) return "Whole numbers only";
  if (number < 1) return "Must be at least 1";
  if (number > LIMITS.maxQuantum) return `Max ${LIMITS.maxQuantum}`;
  return "";
}

// Counts invalid fields in the whole patient list (used to block a run).
export function countInvalidFields(patients) {
  let count = 0;
  for (const patient of patients) {
    for (const field of ["arrivalTime", "treatmentTime", "priority"]) {
      if (getPatientFieldError(patient, field)) count += 1;
    }
  }
  return count;
}

export function hasCriticalPatients(patients) {
  return patients.some((patient) => patient.priority <= 2);
}

// ---------- Comparison helpers ----------

const EPSILON = 1e-9; // tolerance for comparing decimal numbers

// Which algorithms are best for one metric?
// rows: [{ algorithm, ok, data }]. Returns an array of algorithm values.
// Returns [] when there is nothing meaningful to highlight (fewer than two
// successful runs, or every algorithm scored exactly the same).
export function findBestKeys(rows, metric) {
  const okRows = rows.filter((row) => row.ok);
  if (okRows.length < 2) return [];

  const values = okRows.map((row) => row.data.metrics[metric.key]);
  const best = metric.better === "lower" ? Math.min(...values) : Math.max(...values);
  const worst = metric.better === "lower" ? Math.max(...values) : Math.min(...values);
  if (Math.abs(best - worst) < EPSILON) return []; // all tied

  return okRows
    .filter((row) => Math.abs(row.data.metrics[metric.key] - best) < EPSILON)
    .map((row) => row.algorithm.value);
}

// Fairness check: did every successful run really process the SAME patients?
// We compare what the server reports back with what we sent.
export function sameWorkload(rows, workload) {
  const simplify = (list) =>
    [...list]
      .sort((a, b) => a.id - b.id)
      .map(({ id, arrivalTime, treatmentTime, priority }) => ({ id, arrivalTime, treatmentTime, priority }));

  const expected = JSON.stringify(simplify(workload));
  return rows
    .filter((row) => row.ok)
    .every((row) => JSON.stringify(simplify(row.data.processedPatients)) === expected);
}

// ---------- Formatting ----------

export function formatMetric(metric, value) {
  return Number(value).toFixed(metric.decimals);
}
