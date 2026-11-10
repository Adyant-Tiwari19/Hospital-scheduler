// Icons.jsx - a handful of small inline SVG icons (no icon library needed).

const PATHS = {
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  hourglass: (<path d="M6 3h12M6 21h12M7 3v4l5 5-5 5v4M17 3v4l-5 5 5 5v4" />),
  bolt: (<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />),
  alert: (<><path d="M10.3 4 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>),
  gauge: (<><path d="M4 18a9 9 0 1 1 16 0" /><path d="m12 14 4-4" /></>),
  flag: (<path d="M5 21V4h12l-2 4.5L17 13H5" />),
  plus: (<path d="M12 5v14M5 12h14" />),
  close: (<path d="M6 6l12 12M18 6 6 18" />),
  play: (<path d="M7 4.5v15l12-7.5z" />),
  compare: (<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />),
  single: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>),
  check: (<path d="m5 12.5 4.5 4.5L19 7.5" />),
  star: (<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />),
  reset: (<path d="M4 12a8 8 0 1 0 3-6.2M4 4v4.5h4.5" />),
  doctor: (<><circle cx="12" cy="7" r="3.5" /><path d="M5 21c.6-4.6 3.2-7 7-7s6.4 2.4 7 7M9 14v2.5a3 3 0 0 0 6 0V14" /></>),
  list: (<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />),
};

export function Icon({ name, size = 20 }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
