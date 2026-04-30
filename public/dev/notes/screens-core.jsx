/* The Daily Now — screens core (shared primitives) */
/* eslint-disable */

// ---------- Phone / standalone detection ----------
// Hide the simulated status bar on real phones — the OS already renders one
// above us. The fake status bar only makes sense in desktop phone-frame review.
function isOnPhoneOrStandalone() {
  if (typeof window === "undefined") return false;
  if (window.navigator && window.navigator.standalone === true) return true;
  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia && window.matchMedia("(pointer: coarse) and (max-width: 480px)").matches) return true;
  return false;
}

// ---------- Icons (hand-drawn, 1.5px stroke, paper aesthetic) ----------
const Icon = ({ name, size = 18, opacity = 1 }) => {
  const s = { width: size, height: size, display: "block", opacity };
  const stroke = "currentColor";
  const sw = 1.5;
  const common = { stroke, strokeWidth: sw, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "notebook":
      return (
        <svg viewBox="0 0 20 20" style={s}>
          <rect x="5.5" y="3" width="11" height="14" rx="1" {...common}/>
          <line x1="3" y1="6" x2="6" y2="6" {...common}/>
          <line x1="3" y1="10" x2="6" y2="10" {...common}/>
          <line x1="3" y1="14" x2="6" y2="14" {...common}/>
          <line x1="8" y1="7" x2="14" y2="7" {...common} strokeOpacity="0.45"/>
          <line x1="8" y1="10" x2="14" y2="10" {...common} strokeOpacity="0.45"/>
          <line x1="8" y1="13" x2="12" y2="13" {...common} strokeOpacity="0.45"/>
        </svg>
      );
    case "desk":
      return (
        <svg viewBox="0 0 20 20" style={s}>
          <line x1="2.5" y1="7" x2="17.5" y2="7" {...common}/>
          <line x1="4" y1="7" x2="4" y2="16.5" {...common}/>
          <line x1="16" y1="7" x2="16" y2="16.5" {...common}/>
          <rect x="6" y="9.5" width="8" height="3.5" {...common}/>
          <line x1="9" y1="11.25" x2="11" y2="11.25" {...common} strokeOpacity="0.55"/>
        </svg>
      );
    case "drawer":
      return (
        <svg viewBox="0 0 20 20" style={s}>
          <rect x="3" y="6" width="14" height="9" rx="0.5" {...common}/>
          <line x1="3" y1="10.5" x2="17" y2="10.5" {...common}/>
          <line x1="9" y1="12.75" x2="11" y2="12.75" {...common} strokeOpacity="0.55"/>
        </svg>
      );
    case "trash":
      return (
        <svg viewBox="0 0 20 20" style={s}>
          <line x1="3" y1="6" x2="17" y2="6" {...common}/>
          <path d="M8 6 V4.5 a1 1 0 0 1 1 -1 h2 a1 1 0 0 1 1 1 V6" {...common}/>
          <path d="M5.5 6 L6.5 16.5 a1 1 0 0 0 1 0.9 h5 a1 1 0 0 0 1 -0.9 L14.5 6" {...common}/>
          <line x1="9" y1="9" x2="9" y2="14.5" {...common} strokeOpacity="0.5"/>
          <line x1="11" y1="9" x2="11" y2="14.5" {...common} strokeOpacity="0.5"/>
        </svg>
      );
    case "journal":
      return (
        <svg viewBox="0 0 20 20" style={s}>
          <path d="M5 3 H15 a1 1 0 0 1 1 1 V17 H6 a1 1 0 0 1 -1 -1 z" {...common}/>
          <path d="M5 16 a1 1 0 0 0 1 1" {...common}/>
          <path d="M11 3 V10 L12.5 8.5 L14 10 V3" {...common} fill="var(--paper)"/>
        </svg>
      );
    case "comment":
      return (
        <svg viewBox="0 0 20 20" style={s}>
          <path d="M3.5 5 a1.5 1.5 0 0 1 1.5 -1.5 H15 a1.5 1.5 0 0 1 1.5 1.5 V12 a1.5 1.5 0 0 1 -1.5 1.5 H9 L5.5 16.5 V13.5 H5 a1.5 1.5 0 0 1 -1.5 -1.5 z" {...common}/>
          <line x1="6.5" y1="7.5" x2="13.5" y2="7.5" {...common} strokeOpacity="0.45"/>
          <line x1="6.5" y1="10" x2="11.5" y2="10" {...common} strokeOpacity="0.45"/>
        </svg>
      );
    case "share":
      return (
        <svg viewBox="0 0 20 20" style={s}>
          <path d="M10 13 V3 M6 6.5 L10 2.5 L14 6.5" {...common}/>
          <path d="M3.5 11 V15 a1 1 0 0 0 1 1 H15.5 a1 1 0 0 0 1 -1 V11" {...common}/>
        </svg>
      );
    case "rethink":
      // circular arrow — look at this again
      return (
        <svg viewBox="0 0 20 20" style={s}>
          <path d="M16 11 a6 6 0 1 1 -1.6 -5.5" {...common}/>
          <path d="M16 3 V6 H13" {...common}/>
        </svg>
      );
    case "decide":
      // a question-mark-as-decision — slightly different from rethink
      return (
        <svg viewBox="0 0 20 20" style={s}>
          <path d="M7 7 a3 3 0 1 1 3 3 V12" {...common}/>
          <circle cx="10" cy="15.5" r="0.9" fill="currentColor"/>
        </svg>
      );
    case "break-down":
      // checklist: one becomes many small steps
      return (
        <svg viewBox="0 0 20 20" style={s}>
          <circle cx="3" cy="5.5" r="1.1" fill="currentColor"/>
          <circle cx="3" cy="10" r="1.1" fill="currentColor" opacity="0.55"/>
          <circle cx="3" cy="14.5" r="1.1" fill="currentColor" opacity="0.4"/>
          <line x1="6" y1="5.5" x2="16" y2="5.5" {...common}/>
          <line x1="6" y1="10" x2="14" y2="10" {...common} strokeOpacity="0.55"/>
          <line x1="6" y1="14.5" x2="12" y2="14.5" {...common} strokeOpacity="0.4"/>
        </svg>
      );
    case "start-one":
      // a single bullet + forward arrow — "the smallest piece, go"
      return (
        <svg viewBox="0 0 20 20" style={s}>
          <circle cx="4" cy="10" r="2.2" fill="currentColor"/>
          <path d="M8 10 H16" {...common}/>
          <path d="M13 7 L16 10 L13 13" {...common}/>
        </svg>
      );
    case "set-down":
      // a sheet of paper with a luggage tag dangling — "parked, labeled"
      return (
        <svg viewBox="0 0 20 20" style={s}>
          <path d="M4 3 H10 L13 6 V16 H4 z" {...common}/>
          <path d="M10 3 V6 H13" {...common}/>
          <line x1="11" y1="12" x2="14" y2="15.5" {...common}/>
          <circle cx="14.8" cy="16.4" r="1.6" {...common}/>
          <circle cx="14.8" cy="16.4" r="0.45" fill="currentColor"/>
        </svg>
      );
    case "highlight":
      // angled marker pen with a stroke beneath — "mark this important"
      return (
        <svg viewBox="0 0 20 20" style={s}>
          <path d="M12 3 L17 8 L8 17 L3 12 z" {...common}/>
          <line x1="11" y1="4" x2="13" y2="6" {...common} strokeOpacity="0.5"/>
          <line x1="2.5" y1="17.5" x2="13" y2="17.5" {...common} strokeOpacity="0.4"/>
        </svg>
      );
    default:
      return null;
  }
};

function StatusBar() {
  if (isOnPhoneOrStandalone()) return null;
  return (
    <div className="status-bar">
      <span>9:24</span>
      <div className="icons">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
          <rect x="0" y="6" width="3" height="5" rx="0.5" fill="currentColor"/>
          <rect x="4.5" y="4" width="3" height="7" rx="0.5" fill="currentColor"/>
          <rect x="9" y="2" width="3" height="9" rx="0.5" fill="currentColor"/>
          <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="currentColor"/>
        </svg>
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none" style={{marginLeft: 4}}>
          <rect x="1" y="1" width="17" height="9" rx="2" stroke="currentColor" strokeOpacity="0.5" fill="none"/>
          <rect x="3" y="3" width="13" height="5" rx="0.5" fill="currentColor"/>
          <rect x="19" y="4" width="1.5" height="3" rx="0.5" fill="currentColor" opacity="0.5"/>
        </svg>
      </div>
    </div>
  );
}

// ---------- Task parsing ----------
function parseMarks(text) {
  // Recognize trailing/leading marks: > >> ?
  // We treat ? as decision-point, >> as moved-twice, > as carried-once
  const m = text.match(/(\?|>>|>)\s*$/);
  if (!m) return { clean: text, mark: null };
  return { clean: text.replace(/\s*(\?|>>|>)\s*$/, "").trim(), mark: m[1] };
}

Object.assign(window, {
  isOnPhoneOrStandalone,
  Icon,
  StatusBar,
  parseMarks,
});
