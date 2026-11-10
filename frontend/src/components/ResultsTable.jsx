// ResultsTable.jsx - one row per patient, sortable by clicking a column heading.

import { useMemo, useState } from "react";
import { PRIORITY_LEVELS } from "../constants";

const COLUMNS = [
  { key: "id", label: "Patient" },
  { key: "priority", label: "Priority" },
  { key: "arrivalTime", label: "Arrival" },
  { key: "treatmentTime", label: "Treatment" },
  { key: "firstStartTime", label: "First start" },
  { key: "completionTime", label: "Completion" },
  { key: "waitingTime", label: "Waiting" },
  { key: "turnaroundTime", label: "Turnaround" },
  { key: "responseTime", label: "Response" },
];

const average = (values) => (values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0);

export default function ResultsTable({ patients }) {
  const [sort, setSort] = useState({ key: "id", direction: "asc" });

  // Response time is not sent by the backend per patient, but it is simply
  // (first start - arrival), so we calculate it here.
  const rows = useMemo(() => {
    const withResponse = patients.map((p) => ({ ...p, responseTime: p.firstStartTime - p.arrivalTime }));
    const factor = sort.direction === "asc" ? 1 : -1;
    return withResponse.sort((a, b) => (a[sort.key] - b[sort.key]) * factor || a.id - b.id);
  }, [patients, sort]);

  const maxWaiting = Math.max(1, ...rows.map((row) => row.waitingTime));

  function toggleSort(key) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  }

  if (rows.length === 0) {
    return <p className="empty-note">No patient results to show.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="data-table results-table">
        <caption className="sr-only">Per-patient scheduling results. Click a heading to sort.</caption>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={sort.key === column.key ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
              >
                <button type="button" className="sort-button" onClick={() => toggleSort(column.key)}>
                  {column.label}
                  <span aria-hidden="true" className="sort-arrow">
                    {sort.key === column.key ? (sort.direction === "asc" ? "▲" : "▼") : ""}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">P{row.id}</th>
              <td>
                <span className={`prio-badge prio-${row.priority}`}>
                  {row.priority} · {PRIORITY_LEVELS[row.priority - 1]?.label}
                </span>
              </td>
              <td>{row.arrivalTime}</td>
              <td>{row.treatmentTime}</td>
              <td>{row.firstStartTime}</td>
              <td>{row.completionTime}</td>
              <td>
                <div className="wait-cell">
                  <span>{row.waitingTime}</span>
                  <span className="wait-bar" style={{ width: `${(row.waitingTime / maxWaiting) * 100}%` }} />
                </div>
              </td>
              <td>{row.turnaroundTime}</td>
              <td>{row.responseTime}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={6}>
              Average
            </th>
            <td>{average(rows.map((r) => r.waitingTime)).toFixed(2)}</td>
            <td>{average(rows.map((r) => r.turnaroundTime)).toFixed(2)}</td>
            <td>{average(rows.map((r) => r.responseTime)).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
