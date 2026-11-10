// api.js
// All talking to the C++ backend happens here.
// Both the "Run simulation" button and the "Compare" button use postSchedule(),
// so there is exactly one place that builds the request and handles errors.

import { ALGORITHMS } from "./constants";

const BACKEND_HINT = "Make sure the C++ backend is running on port 18080.";

// Sends ONE scheduling request to the existing endpoint POST /api/schedule.
// Resolves with the parsed JSON response or throws an Error with a readable message.
export async function postSchedule(algorithm, quantum, patients) {
  let response;
  try {
    response = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        algorithm,
        ...(algorithm === "RR" ? { quantum: Number(quantum) } : {}),
        patients,
      }),
    });
  } catch {
    // fetch itself failed: no network / server unreachable
    throw new Error(`Cannot reach the scheduling server. ${BACKEND_HINT}`);
  }

  // The body might not be JSON. For example, when the backend is down the Vite
  // dev server answers with an empty HTTP 500, so we must not assume JSON.
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error ?? `The server returned HTTP ${response.status}. ${BACKEND_HINT}`);
  }
  if (!payload || !payload.metrics || !Array.isArray(payload.timeline)) {
    throw new Error("The server sent a response that could not be understood.");
  }
  return payload;
}

// Runs ALL six algorithms on the SAME patients.
//
// 1. We copy the patients ONCE into `workload`.
// 2. The same `workload` array is handed to every request, so the JSON body is
//    identical for all six calls except for the "algorithm" field.
// 3. Promise.allSettled lets all six run in parallel and keeps going even if one fails.
export async function runAllAlgorithms(patients, quantum) {
  const workload = patients.map((patient) => ({ ...patient }));

  const outcomes = await Promise.allSettled(
    ALGORITHMS.map((algorithm) => postSchedule(algorithm.value, quantum, workload)),
  );

  const rows = outcomes.map((outcome, index) =>
    outcome.status === "fulfilled"
      ? { algorithm: ALGORITHMS[index], ok: true, data: outcome.value }
      : { algorithm: ALGORITHMS[index], ok: false, error: outcome.reason.message },
  );

  return { workload, rows };
}
