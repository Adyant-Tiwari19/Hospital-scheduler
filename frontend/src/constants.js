// constants.js
// Fixed lists and limits that the whole frontend shares.
// Keeping them in one place means the Simulate tab and the Compare tab
// can never disagree about which algorithms exist or how a metric is defined.

export const ALGORITHMS = [
  {
    value: "FCFS",
    short: "FCFS",
    label: "First Come, First Served",
    preemptive: false,
    description: "Patients are treated strictly in the order they arrive.",
  },
  {
    value: "SJF",
    short: "SJF",
    label: "Shortest Job First",
    preemptive: false,
    description: "The waiting patient with the shortest treatment goes next.",
  },
  {
    value: "SRTF",
    short: "SRTF",
    label: "Shortest Remaining Time First",
    preemptive: true,
    description: "Like SJF, but a new arrival with less time left can interrupt.",
  },
  {
    value: "Priority",
    short: "Priority",
    label: "Priority Scheduling",
    preemptive: false,
    description: "The most urgent waiting patient (priority 1 is highest) goes next.",
  },
  {
    value: "PreemptivePriority",
    short: "Preemptive Priority",
    label: "Preemptive Priority Scheduling",
    preemptive: true,
    description: "A more urgent arrival interrupts the current treatment.",
  },
  {
    value: "RR",
    short: "Round Robin",
    label: "Round Robin",
    preemptive: true,
    description: "Each patient gets one time quantum, then rejoins the back of the queue.",
  },
];

// Triage levels. Priority 1 is the MOST urgent (same meaning as the C++ backend).
export const PRIORITY_LEVELS = [
  { value: 1, label: "Critical" },
  { value: 2, label: "Emergent" },
  { value: 3, label: "Urgent" },
  { value: 4, label: "Less urgent" },
  { value: 5, label: "Non-urgent" },
];

// Limits are enforced here in the browser. The backend does not cap values,
// and the preemptive algorithms advance one time unit at a time, so very
// large numbers would make a request slow.
export const LIMITS = {
  maxPatients: 20,
  maxTime: 1000, // largest allowed arrival time / treatment time
  maxQuantum: 1000,
};

// The metrics shown on cards and in the comparison table.
// "better" says which direction wins: lowest value or highest value.
export const METRICS = [
  {
    key: "avgWaitingTime",
    label: "Average waiting time",
    short: "Avg waiting",
    unit: "time units",
    better: "lower",
    decimals: 2,
    icon: "clock",
    accent: "#0b63a8",
    description: "Average time a patient spends waiting (turnaround minus treatment).",
  },
  {
    key: "avgTurnaroundTime",
    label: "Average turnaround time",
    short: "Avg turnaround",
    unit: "time units",
    better: "lower",
    decimals: 2,
    icon: "hourglass",
    accent: "#0b7f82",
    description: "Average time from arrival until treatment is complete.",
  },
  {
    key: "avgResponseTime",
    label: "Average response time",
    short: "Avg response",
    unit: "time units",
    better: "lower",
    decimals: 2,
    icon: "bolt",
    accent: "#6d4fc2",
    description: "Average time from arrival until treatment first starts.",
  },
  {
    key: "criticalCaseAvgResponseTime",
    label: "Critical-case response time",
    short: "Critical response",
    unit: "time units",
    better: "lower",
    decimals: 2,
    icon: "alert",
    accent: "#b3261e",
    needsCritical: true, // only meaningful if a priority 1-2 patient exists
    description: "Average response time for priority 1 and 2 patients only.",
  },
  {
    key: "doctorUtilization",
    label: "Doctor utilization",
    short: "Utilization",
    unit: "%",
    better: "higher",
    decimals: 1,
    icon: "gauge",
    accent: "#0a7a4a",
    description: "Share of the simulation the doctor spent treating patients.",
  },
  {
    key: "totalSimulationTime",
    label: "Total simulation time",
    short: "Total time",
    unit: "time units",
    better: "lower",
    decimals: 0,
    icon: "flag",
    accent: "#5a6e82",
    description: "Time at which the last patient finishes treatment.",
  },
];

// One colour per patient on the Gantt chart. Every colour keeps white text readable.
export const PATIENT_COLORS = [
  "#1d4ed8", "#0f766e", "#b45309", "#7e22ce", "#be123c", "#15803d",
  "#c2410c", "#0369a1", "#4d7c0f", "#a21caf", "#475569", "#854d0e",
];

// A small ready-made workload (the classic textbook example) to try the algorithms.
export const EXAMPLE_PATIENTS = [
  { id: 1, arrivalTime: 0, treatmentTime: 8, priority: 3 },
  { id: 2, arrivalTime: 1, treatmentTime: 4, priority: 2 },
  { id: 3, arrivalTime: 2, treatmentTime: 9, priority: 4 },
  { id: 4, arrivalTime: 3, treatmentTime: 5, priority: 1 },
];
