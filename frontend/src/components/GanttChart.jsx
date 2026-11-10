// GanttChart.jsx - the doctor's treatment timeline.
//
// Every time unit gets the SAME pixel width (`unitWidth`), so a block that
// lasts 4 units is exactly twice as wide as a block that lasts 2 units, and
// the axis labels below line up with the block edges.

import { useMemo } from "react";
import { clamp, patientColor } from "../utils";

// Turns the backend timeline into a list of blocks and fills the gaps with "idle" blocks.
function buildSlots(timeline) {
  const sorted = [...timeline].sort((a, b) => a.startTime - b.startTime);
  const slots = [];
  let cursor = 0; // the time up to which the chart is already filled

  sorted.forEach((slot, index) => {
    if (slot.startTime > cursor) {
      slots.push({ key: `idle-${cursor}`, startTime: cursor, endTime: slot.startTime, patientId: null });
    }
    slots.push({ ...slot, key: `${slot.patientId}-${slot.startTime}-${index}` });
    cursor = Math.max(cursor, slot.endTime);
  });
  return slots;
}

// Picks a tick spacing (1, 2, 5, 10, ...) so axis labels never overlap.
function tickStep(unitWidth) {
  const minUnits = Math.ceil(44 / unitWidth);
  return [1, 2, 5, 10, 20, 50, 100, 200, 500].find((step) => step >= minUnits) ?? 1000;
}

export default function GanttChart({ timeline, patients }) {
  const slots = useMemo(() => buildSlots(timeline), [timeline]);
  const total = slots.length ? slots[slots.length - 1].endTime : 0;

  if (total === 0) {
    return <p className="empty-note">There is no treatment to show on the timeline.</p>;
  }

  const unitWidth = clamp(Math.floor(1100 / total), 14, 48);
  const step = tickStep(unitWidth);
  const ticks = [];
  for (let time = 0; time <= total; time += step) ticks.push(time);
  const lastTick = ticks[ticks.length - 1];
  if (lastTick !== total && (total - lastTick) * unitWidth >= 32) ticks.push(total);

  return (
    <div>
      <div className="gantt-scroll">
        <div
          className="gantt-track"
          role="list"
          aria-label={`Doctor treatment timeline from 0 to ${total} time units`}
          style={{ width: total * unitWidth, "--unit": `${unitWidth}px` }}
        >
          {slots.map((slot, index) => {
            const duration = slot.endTime - slot.startTime;
            const width = duration * unitWidth;
            const idle = slot.patientId === null;
            const name = idle ? "Doctor idle" : `Patient P${slot.patientId}`;
            return (
              <div
                key={slot.key}
                role="listitem"
                className={`gantt-slot${idle ? " is-idle" : ""}`}
                style={{
                  width,
                  background: idle ? undefined : patientColor(slot.patientId),
                  animationDelay: `${Math.min(index * 35, 500)}ms`,
                }}
                title={`${name}: ${slot.startTime} to ${slot.endTime} (${duration} time units)`}
                aria-label={`${name}, from ${slot.startTime} to ${slot.endTime}, ${duration} time units`}
              >
                {width >= 26 && <strong>{idle ? "Idle" : `P${slot.patientId}`}</strong>}
                {width >= 70 && (
                  <span>
                    {slot.startTime}–{slot.endTime}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="gantt-axis" style={{ width: total * unitWidth }} aria-hidden="true">
          {ticks.map((time) => (
            <span key={time} style={{ left: time * unitWidth }}>
              {time}
            </span>
          ))}
        </div>
      </div>

      <ul className="gantt-legend" aria-label="Patient colours">
        {patients.map((patient) => (
          <li key={patient.id}>
            <span className="swatch" style={{ background: patientColor(patient.id) }} />
            P{patient.id}
            <span className={`prio-dot prio-dot-${patient.priority}`} title={`Priority ${patient.priority}`} />
            <small>priority {patient.priority}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
