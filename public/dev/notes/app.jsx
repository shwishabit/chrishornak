/* The Daily Now — main app */
/* eslint-disable */

const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "paper",
  "openOn": "anchor",
  "fontScale": 1.0,
  "showGrain": true,
  "showTutorial": true,
  "momentumPreview": "auto"
}/*EDITMODE-END*/;

const SEED_TASKS = [
  { id: 1, text: "Reply to Mara about Friday", mark: null, tenMin: null, done: false },
  { id: 2, text: "Walk — twenty minutes is plenty", mark: null, tenMin: null, done: false },
  { id: 3, text: "Draft the proposal intro", mark: ">", tenMin: "Open the doc, write one paragraph", done: false },
  { id: 4, text: "Untangle the budget spreadsheet", mark: ">>", tenMin: "Just open it. Look once.", done: false },
  { id: 5, text: "Decide on the contractor for the kitchen", mark: "?", tenMin: null, done: false },
  { id: 6, text: "Make tea", mark: null, tenMin: null, done: true },
];

const SEED_NOTES = [
  { id: 101, text: "Look into that podcast Maya mentioned.", savedOn: "saved Apr 21" },
  { id: 102, text: "Birthday gift for dad — something handmade?", savedOn: "saved Apr 19" },
];

const SEED_SHELF = [
  {
    id: 201,
    text: "Sort through the storage closet",
    parentText: null,
    reasonTag: "unclear",
    reasonNote: "Don't know where to start, and it's not really mine to decide.",
    waitingOn: null,
    shelvedOn: "Apr 18",
    daysOnShelf: 9,
  },
];

// === Day boundary ===
// "Today" runs 3am to 3am, not midnight to midnight. Late-night work (1am,
// 2am) still rolls up to the prior calendar date — matches Chris's printable
// Daily Now habit and ADHD-friendly day pacing. Single source of truth: any
// "now" that drives day-of-the-week display, ISO key, or rollover passes
// through effectiveNow() instead of `new Date()`.
// v=51: the hour is now a user setting ("day starts at…", default 3am).
// Module-level `let` read at call time; initialized from the settings slice
// below and updated live by the settings sheet.
let _dayStartHour = 3;
function effectiveNow() {
  const d = new Date();
  d.setHours(d.getHours() - _dayStartHour);
  return d;
}

function dateInfo(offset = 0) {
  const d = effectiveNow();
  d.setDate(d.getDate() + offset);
  return {
    weekday: d.toLocaleDateString(undefined, { weekday: "long" }),
    dateStr: d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }),
    short: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  };
}

// Build a dateInfo-shaped object from a stored ISO ("YYYY-MM-DD"), used by
// the natural-day-flip Recap so prevDateStr reflects the actual last-opened
// day (which may be 1, 3, or 14 days back) — not "yesterday."
function dateStrFromIso(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return {
    weekday: dt.toLocaleDateString(undefined, { weekday: "long" }),
    dateStr: dt.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }),
    short: dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  };
}

function nextMarkAfterCarry(mark) {
  if (!mark) return ">";
  if (mark === ">") return ">>";
  return "?";
}

// === Boot config ===
// Read once from <div id="root" data-namespace data-admin data-seed>. Each
// HTML host (e.g. /dev/notes vs /dev/notes-test) writes its own attributes
// so the same source ships two app instances with isolated localStorage and
// a different chrome — no fork, no build flag, no URL sniffing.
const _bootRoot = (typeof document !== "undefined") ? document.getElementById("root") : null;
const STORAGE_NS = (_bootRoot && _bootRoot.getAttribute("data-namespace")) || "dn";
const ADMIN_VISIBLE = !!(_bootRoot && _bootRoot.getAttribute("data-admin") === "true");
const SEED_DEMO = !!(_bootRoot && _bootRoot.getAttribute("data-seed") === "true");
// Expose for deferred modules (screens-rituals.jsx fetches at mount).
if (typeof window !== "undefined") {
  window.STORAGE_NS = STORAGE_NS;
  window.SEED_DEMO = SEED_DEMO;
}

// === Persistence ===
const STORAGE_KEY = `${STORAGE_NS}:state.v1`;
// Bump SCHEMA_VERSION when the persisted shape changes, and add a case to
// migrate() so older saves are upgraded in place rather than silently zeroed.
const SCHEMA_VERSION = 2;

function migrate(state, fromVersion) {
  if (fromVersion === SCHEMA_VERSION) return state;
  // A save from a future version we don't recognize — refuse rather than load
  // partial garbage. wipeAllDailyNow() is the user-facing recovery path.
  if (fromVersion > SCHEMA_VERSION) return null;
  if (fromVersion === 1) {
    // v=43 simplification: chains, goals, progress, and mood were cut. Strip
    // their fields from every stored task so the pruned app loads a clean
    // shape. isWin stays — wins-on-the-page is the kept win mechanism.
    const strip = (t) => {
      const { prevTaskId, groupName, progress, goalRef, winId, completedAt, ...rest } = t || {};
      return rest;
    };
    return {
      ...state,
      tasks: Array.isArray(state.tasks) ? state.tasks.map(strip) : [],
    };
  }
  return state;
}

// v=43 one-time storage purge. The simplification cut journal, sketchbook,
// mood logs, goals, and the wins timeline — their orphaned keys are removed
// on first boot of the pruned app (Chris's explicit call, 2026-07-31: purge,
// not preserve). Guarded by a marker key so it runs exactly once per
// namespace. Irreversible by design.
(function purgeCutFeatureStorage() {
  const marker = `${STORAGE_NS}:v43-purge-done`;
  try {
    if (localStorage.getItem(marker)) return;
    const doomedExact = new Set([
      `${STORAGE_NS}:logs.v1`,
      `${STORAGE_NS}:goals.v1`,
      `${STORAGE_NS}:wins-timeline.v1`,
    ]);
    const doomedPrefixes = [
      `${STORAGE_NS}:journal.`,
      `${STORAGE_NS}:sketch.`,
    ];
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (doomedExact.has(k) || doomedPrefixes.some(p => k.startsWith(p))) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    localStorage.setItem(marker, String(Date.now()));
  } catch (e) {}
})();

// v=43: Pages — the flip-back history. One blob keyed by ISO; each entry is
// a read-only snapshot of a day's page as it ended (tasks + wins, done and
// not). Written at every day boundary (natural rollover + admin force).
// History accumulates from the day v=43 ships — earlier days were never
// snapshotted. Reverses the original "yesterday is gone" §8 rule per the
// manual's own canon: "Flip back through your pages to see the [X] marks."
const PAGES_KEY = `${STORAGE_NS}:pages.v1`;
function loadPages() {
  try {
    const raw = localStorage.getItem(PAGES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === "object") ? parsed : {};
  } catch (e) { return {}; }
}
function savePages(obj) {
  try { localStorage.setItem(PAGES_KEY, JSON.stringify(obj)); } catch (e) {}
}
function pageSnapshotOf(taskList) {
  return (taskList || []).map(t => ({
    text: t.text,
    done: !!t.done,
    mark: t.mark || null,
    isWin: !!t.isWin,
  }));
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    // Saves written before versioning are treated as v1 (current shape).
    const version = typeof parsed.__schema === "number" ? parsed.__schema : 1;
    return migrate(parsed, version);
  } catch (e) { return null; }
}
function savePersisted(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, __schema: SCHEMA_VERSION })); } catch (e) {}
}
// v=26: recurring-task specs persist independently of the main state blob so
// the spec survives across day-flips regardless of any single instance's
// fate (release / complete / trash). Each spec: {id, text, type: "daily" |
// "weekly", days?: number[] (Sun=0..Sat=6, weekly only), createdAt}.
const RECURRENCES_KEY = `${STORAGE_NS}:recurrences.v1`;
function loadRecurrences() {
  try {
    const raw = localStorage.getItem(RECURRENCES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) { return []; }
}
function saveRecurrences(arr) {
  try { localStorage.setItem(RECURRENCES_KEY, JSON.stringify(arr)); } catch (e) {}
}

// v=51: user settings — the first user-facing configuration surface (the
// tweaks panel stays dev-only). Independent slice so it survives schema
// migrations of the main blob. Shape: { dayStartHour, theme, fontScale,
// showQuote, activeCap }.
const SETTINGS_KEY = `${STORAGE_NS}:settings.v1`;
const DEFAULT_SETTINGS = {
  dayStartHour: 3,
  theme: "paper",
  fontScale: 1,
  showQuote: true,
  activeCap: 10,
};
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === "object")
      ? { ...DEFAULT_SETTINGS, ...parsed }
      : { ...DEFAULT_SETTINGS };
  } catch (e) { return { ...DEFAULT_SETTINGS }; }
}
function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
}
// Initialize the day boundary from persisted settings before first render —
// effectiveNow() reads the module var at call time.
_dayStartHour = loadSettings().dayStartHour;

function wipeAllDailyNow() {
  // Clears the main state blob AND any per-day journal entries within the
  // active namespace only. Other instances (e.g. /dev/notes vs /dev/notes-test
  // sharing the chrishornak.com origin) are untouched.
  const prefix = `${STORAGE_NS}:`;
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  } catch (e) {}
}

// === Day math ===
function isoFromOffset(offset = 0) {
  const d = effectiveNow();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function daysBetweenIso(a, b) {
  if (!a || !b) return 0;
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db - da) / 86400000);
}

// === Monotonic ID generator ===
// Two operations within the same millisecond would collide if we used raw
// Date.now(). Combine timestamp + a process-local counter so consecutive
// calls always increase, even within the same tick.
let _idCounter = 0;
function nextId() {
  _idCounter += 1;
  return Date.now() * 1000 + (_idCounter % 1000);
}

// === Marker ladder ===
// Per Decisions log (2026-04-26, revised 2026-04-30): marker advances on every
// day boundary. ` `(null) → `>` → `>>` → `?` (sticks); `@` parks. Priority is
// no longer a marker character — `*` was retired in favor of a separate
// `priority` boolean field rendered as a highlighter on the task text. This
// keeps the migration ladder visually consistent (one glyph in the gutter)
// and decouples "important today" from "carried since".
function advanceMarker(mark) {
  if (!mark) return ">";
  if (mark === ">") return ">>";
  if (mark === ">>") return "?";
  if (mark === "?") return "?";
  return mark;
}
function walkMarker(mark, n) {
  let m = mark;
  for (let i = 0; i < n; i++) m = advanceMarker(m);
  return m;
}

// === Importance score (v1) ===
// score = priority*6 + tierWeight - agePenalty, clamped [0, 11].
// Used to nominate top-3 in Morning Anchor. Algorithm doesn't auto-set
// priority — only the user does, via the highlighter swipe action.
const TIER_WEIGHT = { null: 1, ">": 2, ">>": 3, "?": 5, "@": 0 };
function priorityScore(task, nowMs = Date.now()) {
  if (task.done || task.parked) return 0;
  const priority = task.priority ? 1 : 0;
  const tier = TIER_WEIGHT[task.mark || "null"] ?? 1;
  const created = task.createdAt || nowMs;
  const ageDays = Math.max(0, Math.floor((nowMs - created) / 86400000));
  const agePenalty = Math.min(Math.floor(ageDays / 3), 4);
  return Math.max(0, Math.min(11, priority * 6 + tier - agePenalty));
}

// v=25: small ghost-style escape hatch for morning flow screens (Recap,
// CarryForward, DeskReview). Positions absolutely in top-right of the screen
// wrapper so it overlays without disturbing each flow's internal layout.
function SkipToToday({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="skip to today"
      style={{
        position: "absolute", top: 16, right: 16, zIndex: 10,
        background: "transparent", border: "none",
        fontFamily: "var(--serif)", fontStyle: "italic",
        fontSize: 11, color: "var(--ink-faint)",
        padding: "6px 10px", cursor: "pointer",
        letterSpacing: "0.02em",
      }}
    >
      skip — to today
    </button>
  );
}

// v=48: one-time contextual hint card. Each surface teaches itself the
// first time the user lands on it (the tutorial stays short — in-context
// beats front-loaded for ADHD; hidden/forgotten affordances are lost
// things). Dismiss = tap; persists per hintKey in localStorage. No
// auto-dismiss — a teaching card that vanishes mid-read teaches nothing.
function FirstVisitHint({ hintKey, kicker, epoch, children }) {
  const storageKey = `${STORAGE_NS}:hint.${hintKey}`;
  const [seen, setSeen] = useState(() => {
    try { return localStorage.getItem(storageKey) === "true"; }
    catch (e) { return true; }
  });
  // v=51: settings "show the hints again" clears the flags and bumps epoch —
  // re-check so already-mounted hints reappear.
  useEffect(() => {
    if (!epoch) return;
    try { setSeen(localStorage.getItem(storageKey) === "true"); }
    catch (e) {}
  }, [epoch, storageKey]);
  if (seen) return null;
  function dismiss() {
    try { localStorage.setItem(storageKey, "true"); } catch (e) {}
    setSeen(true);
  }
  return (
    <div
      onClick={dismiss}
      className="fade-soft"
      style={{
        position: "absolute", bottom: 96, left: 24, right: 24,
        padding: "14px 16px",
        background: "var(--paper-deep)",
        border: "1px solid var(--rule-strong)",
        borderRadius: 12,
        cursor: "pointer",
        zIndex: 5,
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      {kicker && (
        <div className="kicker" style={{marginBottom: 6, fontSize: 9, color: "var(--ink-faint)"}}>{kicker}</div>
      )}
      <div className="serif" style={{
        fontSize: 13, color: "var(--ink-soft)", fontStyle: "italic",
        lineHeight: 1.5,
      }}>
        {children}
      </div>
      <div className="serif" style={{
        fontSize: 11, color: "var(--ink-faint)", fontStyle: "italic",
        marginTop: 8, textAlign: "right",
      }}>tap to dismiss</div>
    </div>
  );
}

// Tiny placeholder shown while a deferred-screen module is still loading.
// Almost never visible in practice: deferred fetch + Babel transform completes
// in ~100–300ms, faster than the user can navigate from Anchor to anywhere
// that needs flows/ or rituals/.
function DeferredFallback({ label }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      padding: 60,
      gap: 8,
    }}>
      <div className="kicker" style={{color: "var(--ink-faint)"}}>preparing</div>
      <div className="serif" style={{
        fontStyle: "italic",
        color: "var(--ink-soft)",
        fontSize: 15,
      }}>{label}…</div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [deferredReady, setDeferredReady] = useState(false);

  // Fetch + Babel-transform the deferred screen bundle after first paint.
  // screens-flows.jsx (decision/desk/trash/recap/carry/pages) lives off the
  // critical path — sync-loading it was the dominant cold-parse cost on
  // phone. It fetches + Babel-transforms at mount, then injects as
  // <script textContent> so the browser executes it.
  useEffect(() => {
    let cancelled = false;
    async function loadBabelScript(src) {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`fetch failed: ${src} (${res.status})`);
      const text = await res.text();
      if (cancelled) return;
      const out = Babel.transform(text, { presets: ["env", "react"] }).code;
      if (cancelled) return;
      const el = document.createElement("script");
      el.textContent = out;
      document.body.appendChild(el);
    }
    function loadAll() {
      return Promise.all([
        loadBabelScript("screens-flows.jsx?v=58"),
      ]);
    }
    loadAll()
      .then(() => { if (!cancelled) setDeferredReady(true); })
      .catch((err) => {
        console.error("Deferred screens load failed; retrying once.", err);
        setTimeout(() => {
          if (cancelled) return;
          loadAll()
            .then(() => { if (!cancelled) setDeferredReady(true); })
            .catch((err2) => console.error("Retry failed.", err2));
        }, 1500);
      });
    return () => { cancelled = true; };
  }, []);

  // When launched from the home screen as a PWA (or just opened on a real
  // phone), strip the desktop phone-frame chrome and lock to the viewport.
  // Injected at runtime so iOS PWA stale-cache of styles.css can't keep us
  // looking like a phone-mockup-on-a-pedestal.
  useEffect(() => {
    const isPhoneApp =
      (window.navigator && window.navigator.standalone === true) ||
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      (window.matchMedia && window.matchMedia("(pointer: coarse) and (max-width: 480px)").matches);
    if (!isPhoneApp) return;
    const el = document.createElement("style");
    el.setAttribute("data-app-chrome-strip", "");
    // v=44: every height gets vh → -webkit-fill-available → dvh fallbacks;
    // dvh alone is dropped on iOS < 15.4, which left the mockup's fixed
    // 844px frame active on device (bottom + FAB cut off, pannable).
    el.textContent = `
      html, body {
        position: fixed !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100vh !important;
        height: -webkit-fill-available !important;
        height: 100dvh !important;
        overflow: hidden !important;
        overscroll-behavior: none !important;
        background: var(--paper) !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      body { display: block !important; }
      #root {
        width: 100% !important;
        height: 100vh !important;
        height: -webkit-fill-available !important;
        height: 100dvh !important;
        display: block !important;
        padding-top: env(safe-area-inset-top, 0px) !important;
        box-sizing: border-box !important;
      }
      .phone-frame {
        width: calc(100% / var(--app-zoom, 1)) !important;
        height: calc((100vh - env(safe-area-inset-top, 0px)) / var(--app-zoom, 1)) !important;
        height: calc((100dvh - env(safe-area-inset-top, 0px)) / var(--app-zoom, 1)) !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        margin: 0 !important;
      }
      .phone-frame::before { border-radius: 0 !important; }
      .status-bar { display: none !important; }
      .help-trigger { top: 10px !important; }
      .tabbar { padding-bottom: calc(4px + env(safe-area-inset-bottom, 0px)) !important; }
      .fab {
        right: calc(24px + env(safe-area-inset-right, 0px)) !important;
        bottom: calc(88px + env(safe-area-inset-bottom, 0px)) !important;
      }
    `;
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  // Boot snapshot — read once at mount. Returning users restore from this;
  // first-time users get empty arrays (sample data lives in admin → "load sample").
  const boot = React.useMemo(() => loadPersisted() || {}, []);

  const [tutorialDone, setTutorialDone] = useState(boot.tutorialDone === true);
  const [showTutorial, setShowTutorial] = useState(!tutorialDone && t.showTutorial);
  const [screen, setScreen] = useState(t.openOn === "now" ? "now" : t.openOn === "return" ? "return" : "anchor");
  const [tasks, setTasks] = useState(boot.tasks || []);
  const [notes, setNotes] = useState(boot.notes || []);
  const [shelf, setShelf] = useState(boot.shelf || []);
  const [completionsSinceShelf, setCompletionsSinceShelf] = useState(0);
  const [reOfferDismissed, setReOfferDismissed] = useState({}); // { [shelfId]: true }
  const [shelfSheet, setShelfSheet] = useState(null); // { kind, item }
  // v=26: recurring task specs (daily + weekly). Persists to its own
  // localStorage key so spec survives release/complete/trash of any single
  // instance.
  const [recurrences, setRecurrences] = useState(() => loadRecurrences());
  // v=43: Pages — per-day page snapshots for the flip-back history view.
  const [pages, setPages] = useState(() => loadPages());
  const [recap, setRecap] = useState(null); // { wins, completed, prevDateStr }
  // Set true by the day-rollover effect when there were flagged-priority tasks
  // carrying into the new day. MorningAnchor reads this and surfaces the
  // carry-sheet ("yesterday's priorities — keep / clear"). Clearing happens
  // via the sheet itself, not auto.
  const [sheet, setSheet] = useState(null);
  // v=45: top-right ? opens the key/help sheet (KeyReference, revived).
  const [showKey, setShowKey] = useState(false);
  // v=51: user settings + the gear sheet. hintsEpoch remounts hint checks
  // after "show the hints again."
  const [settings, setSettings] = useState(() => loadSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [hintsEpoch, setHintsEpoch] = useState(0);
  useEffect(() => { saveSettings(settings); }, [settings]);
  function updateSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === "dayStartHour") {
      _dayStartHour = value;
      // Recompute the effective day immediately — moving the boundary can
      // legitimately flip "today" (the rollover effect handles the rest).
      setTodayIso(isoFromOffset(dayOffset));
    }
  }
  function resetHints() {
    try {
      const prefix = `${STORAGE_NS}:hint.`;
      const doomed = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) doomed.push(k);
      }
      doomed.forEach(k => localStorage.removeItem(k));
      localStorage.removeItem(STORAGE_NS + ":highlightHintShown");
    } catch (e) {}
    setHighlightHintDismissed(false);
    setHintsEpoch(n => n + 1);
    setShowSettings(false);
    showToast("the hints will greet you again.", 2400);
  }
  function replayTutorialFromSettings() {
    setShowSettings(false);
    setTutorialDone(false);
    setShowTutorial(true);
    setTweak("showTutorial", true);
  }
  const [toast, setToast] = useState(null);
  const [dayOffset, setDayOffset] = useState(boot.dayOffset || 0);
  const [lastOpenedDay, setLastOpenedDay] = useState(boot.lastOpenedDay || null);

  // Reactive effective today. Recomputes when dayOffset flips (admin advance),
  // on visibilitychange / focus, and once a minute — so a long-lived PWA
  // notices real midnight without a manual reload. Everything date-aware
  // (rollover ladder, journal autosave) consumes this rather than calling
  // new Date() at render time.
  const [todayIso, setTodayIso] = useState(() => isoFromOffset(dayOffset));
  useEffect(() => {
    function tick() {
      const next = isoFromOffset(dayOffset);
      setTodayIso(prev => prev === next ? prev : next);
    }
    tick();
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    const id = setInterval(tick, 60000);
    return () => {
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
      clearInterval(id);
    };
  }, [dayOffset]);

  const [leftovers, setLeftovers] = useState(null);
  const [prevDateStr, setPrevDateStr] = useState(null);
  // Trash bin — released items are kept here for 30 days, then auto-removed.
  // Each entry: { id, kind: 'task'|'shelf'|'note', payload, releasedAt }
  const [trash, setTrash] = useState(boot.trash || []);

  // === Day rollover migration ===
  // Fires on mount AND whenever the effective day flips mid-session (admin
  // advance, visibility resume across midnight). Captures last-day state for
  // the Recap+Carry ritual, then walks the marker ladder by the day gap,
  // bumps shelf days-on, and clears today-scoped state. Idempotent —
  // same-day re-runs compute gap=0 and no-op.
  //
  // v=32: no longer auto-routes to the Recap screen. The recap data is
  // captured and held; the user lands on Anchor and can do mood / sit /
  // reflect first. Recap fires when they tap "Open today" (see
  // openTodayWithRecap below) — preserves the morning-arousal arc instead of
  // jumping straight into yesterday's leftovers.
  useEffect(() => {
    if (!lastOpenedDay) {
      setLastOpenedDay(todayIso);
      return;
    }
    const gap = daysBetweenIso(lastOpenedDay, todayIso);
    if (gap <= 0) return;
    // v=43: wins live on the page as isWin tasks — recap derives them.
    const recapWins = tasks.filter(t => t.done && t.isWin).map(t => t.text);
    const recapCompleted = tasks.filter(t => t.done && !t.isWin);
    const recapLeftovers = tasks
      .filter(t => !t.done)
      .map(task => ({ ...task, mark: walkMarker(task.mark, gap) }));
    const recapPrevDateStr = dateStrFromIso(lastOpenedDay).dateStr;
    // v=43: snapshot the ending day's page (as it ended, pre-advance) into
    // Pages before anything is cleared or migrated.
    setPages(prev => {
      const next = { ...prev, [lastOpenedDay]: { tasks: pageSnapshotOf(tasks), savedAt: Date.now() } };
      savePages(next);
      return next;
    });
    setTasks(prev => prev.map(task =>
      task.done ? task : { ...task, mark: walkMarker(task.mark, gap) }
    ));
    setShelf(prev => prev.map(s => ({ ...s, daysOnShelf: (s.daysOnShelf || 0) + gap })));
    setCompletionsSinceShelf(0);
    setReOfferDismissed({});
    setLastOpenedDay(todayIso);
    setRecap({
      wins: recapWins,
      completed: recapCompleted,
      leftovers: recapLeftovers,
      prevDateStr: recapPrevDateStr,
      recapSource: "natural",
    });
  }, [todayIso]);

  // === Persist on every change ===
  useEffect(() => {
    savePersisted({ tasks, notes, shelf, trash, tutorialDone, lastOpenedDay, dayOffset });
  }, [tasks, notes, shelf, trash, tutorialDone, lastOpenedDay, dayOffset]);
  // v=26: recurrences persist independently (separate key) so spec survives
  // any single instance's release/complete/trash.
  useEffect(() => { saveRecurrences(recurrences); }, [recurrences]);

  // Sweep trash on mount: remove anything older than 30 days.
  useEffect(() => {
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 30;
    setTrash(prev => prev.filter(t => t.releasedAt > cutoff));
  }, []);

  // Toast helper — single timer ref. Rapid actions cancel the prior timer
  // before queuing a new one, so toasts no longer race-clear each other.
  // Optional action: { label, onClick } renders an undo affordance on the toast.
  const toastTimerRef = useRef(null);
  function showToast(text, ms = 2200, action = null) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ text, action });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, ms);
  }

  // Returns the trash item so callers can offer an undo affordance pinned to it.
  function pushToTrash(kind, payload) {
    const item = { id: nextId(), kind, payload, releasedAt: Date.now() };
    setTrash(prev => [item, ...prev]);
    return item;
  }

  // Momentum state — surfaces gentle nudge on Anchor when warranted.
  // For the prototype: "zero" (last day had 0 done), "returning" (came back after gap), "streak", or null.
  // The momentumPreview tweak forces a state; "auto" derives from the seed.
  const momentumKind = (() => {
    if (t.momentumPreview && t.momentumPreview !== "auto") return t.momentumPreview;
    // Auto: in this prototype, default to null (normal day). Real app would derive from history.
    return null;
  })();
  const momentum = (() => {
    if (momentumKind === "zero") {
      return {
        kicker: "yesterday",
        text: "Even one small thing counts. You're here — that's a win.",
      };
    }
    if (momentumKind === "returning") {
      return {
        kicker: "you came back",
        text: "Picking it up again is the work. Tiny. Then tinier. That's how it builds.",
      };
    }
    if (momentumKind === "streak") {
      return {
        kicker: "three days running",
        text: "One thing a day compounds. Quiet, but real.",
      };
    }
    return null;
  })();

  // v=26: today's "regulars" — weekly recurrences matching today's day-of-week
  // that haven't been added to the notebook today yet. Renders below nominees
  // on Anchor as a tap-to-add list.
  const todayDow = (() => {
    if (!todayIso) return new Date().getDay();
    const [yy, mm, dd] = todayIso.split("-").map(Number);
    return new Date(yy, (mm || 1) - 1, dd || 1).getDay();
  })();
  const todaysRegulars = (() => {
    const existing = new Set(tasks.filter(t => t.recurrenceId).map(t => t.recurrenceId));
    return recurrences.filter(r =>
      r.type === "weekly" &&
      Array.isArray(r.days) &&
      r.days.includes(todayDow) &&
      !existing.has(r.id)
    );
  })();

  // v=32: topNominees calc removed — Anchor no longer surfaces tasks before
  // the ritual ladder runs. priorityScore stays available on tasks via the
  // helper above; if a future surface (Notebook ordering, Stats) wants it,
  // it computes inline — no shared state needed.

  const today = dateInfo(dayOffset);
  const { weekday, dateStr } = today;

  // v=51: theme + text size are user settings now (the tweaks panel's dials
  // remain for dev but settings win).
  // v=55: also repaint the browser/status-bar chrome — the theme-color meta
  // was frozen at paper cream, so the very top stayed default on theme change.
  useEffect(() => {
    const theme = settings.theme || t.theme;
    document.documentElement.setAttribute("data-theme", theme === "paper" ? "" : theme);
    const THEME_CHROME = { paper: "#F4EDE0", sepia: "#E8DCC4", dark: "#14110D" };
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_CHROME[theme] || THEME_CHROME.paper);
  }, [settings.theme, t.theme]);

  // Skip first-mount fire — the useState init for `screen` already applies
  // t.openOn. Re-firing on mount would clobber the day-rollover Recap path.
  const openOnDirty = useRef(false);
  useEffect(() => {
    if (!openOnDirty.current) { openOnDirty.current = true; return; }
    setScreen(t.openOn === "now" ? "now" : t.openOn === "return" ? "return" : "anchor");
  }, [t.openOn]);

  useEffect(() => { setShowTutorial(!tutorialDone && t.showTutorial); }, [t.showTutorial, tutorialDone]);

  function addTask(task, recurrenceSpec) {
    // v=26: optional recurrenceSpec = { type: "daily" | "weekly", days?: number[] }.
    // When provided, also creates a recurrence spec; the new task gets a
    // recurrenceId pointer so day-flip logic can dedupe instances.
    let recurrenceId = null;
    if (recurrenceSpec && (recurrenceSpec.type === "daily" || recurrenceSpec.type === "weekly")) {
      recurrenceId = nextId();
      setRecurrences(prev => [{
        id: recurrenceId,
        text: task.text,
        type: recurrenceSpec.type,
        days: recurrenceSpec.type === "weekly" ? (recurrenceSpec.days || []) : null,
        createdAt: Date.now(),
      }, ...prev]);
      // v=44 fix: a weekly regular created on a non-matching day should NOT
      // land on today's page — save the spec only; it surfaces via "today's
      // regulars" when its day arrives. (Field-test: Mon/Thu task created on
      // a Friday appeared in today's Notebook.)
      if (recurrenceSpec.type === "weekly" &&
          Array.isArray(recurrenceSpec.days) &&
          !recurrenceSpec.days.includes(todayDow)) {
        const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const names = recurrenceSpec.days.map(d => DAY_NAMES[d] || "").filter(Boolean);
        showToast(`saved — it'll appear on ${names.join(" · ")}.`, 3200);
        return;
      }
    }
    const newTask = { createdAt: Date.now(), ...task };
    if (recurrenceId) newTask.recurrenceId = recurrenceId;
    // v=31: append new task to the bottom of the active block (above the
    // done block) instead of prepending. Was prepending, which placed new
    // tasks above highlighted/priority items — ran counter to v=29's
    // "highlighted tasks float to top" rule, which Chris flagged on phone test.
    setTasks(prev => {
      const active = prev.filter(t => !t.done);
      const done = prev.filter(t => t.done);
      return [...active, newTask, ...done];
    });
  }
  // v=26: ensure today's task list contains a fresh instance for every active
  // daily recurrence. Called at the end of finishCarry / skipMorningFlow /
  // adminForceNextDay so the spec drives the day even when a previous
  // instance was released or completed.
  function ensureDailyRecurringTasks(taskList) {
    const existing = new Set(taskList.filter(t => t.recurrenceId).map(t => t.recurrenceId));
    const additions = [];
    for (const r of recurrences) {
      if (r.type === "daily" && !existing.has(r.id)) {
        additions.push({
          id: nextId(),
          text: r.text,
          mark: null,
          tenMin: null,
          done: false,
          createdAt: Date.now(),
          recurrenceId: r.id,
        });
      }
    }
    return additions.length > 0 ? [...additions, ...taskList] : taskList;
  }
  // v=26: weekly recurrence "consider adding" — adds a fresh instance to today.
  // v=31: append-not-prepend so it lands at the bottom of active per the new
  // task-add rule (highlighted tasks stay on top).
  function addRegularToToday(recurrence) {
    const fresh = {
      id: nextId(),
      text: recurrence.text,
      mark: null,
      tenMin: null,
      done: false,
      createdAt: Date.now(),
      recurrenceId: recurrence.id,
    };
    setTasks(prev => {
      const active = prev.filter(t => !t.done);
      const done = prev.filter(t => t.done);
      return [...active, fresh, ...done];
    });
  }
  // v=26: stop a recurrence (kill the spec). The current instance stays;
  // tomorrow's day-flip will no longer auto-create. Used from DecisionHub.
  function stopRecurring(recurrenceId) {
    setRecurrences(prev => prev.filter(r => r.id !== recurrenceId));
    showToast("won't repeat after today.", 2400);
  }
  function togglePriority(id) {
    // v=29: when a task gets newly highlighted, move it to the top of the
    // active list so priority is visually obvious without manual drag-reorder.
    // Un-highlighting doesn't move it back — the user can drag if they want.
    // Done rows stay in their done-block position regardless of priority.
    setTasks(prev => {
      const target = prev.find(t => t.id === id);
      if (!target) return prev;
      const newPriority = !target.priority;
      const updated = prev.map(t => t.id === id ? { ...t, priority: newPriority } : t);
      if (!newPriority || target.done) return updated;
      const active = updated.filter(t => !t.done);
      const done = updated.filter(t => t.done);
      const moved = active.find(t => t.id === id);
      const others = active.filter(t => t.id !== id);
      return [moved, ...others, ...done];
    });
  }
  function addMomentumStep(originalTask, stepText) {
    // "Start with one" — add a tiny step ABOVE the original task. Parent
    // stays exactly where it is; this is just a momentum primer.
    const idx = tasks.findIndex(t => t.id === originalTask.id);
    const fresh = {
      id: nextId(), text: stepText, mark: null, tenMin: null, done: false,
      momentumFor: originalTask.id,
    };
    if (idx === -1) { setTasks([fresh, ...tasks]); return; }
    const next = [...tasks.slice(0, idx), fresh, ...tasks.slice(idx)];
    setTasks(next);
    showToast("one small thing — start here.", 2400);
  }
  function deleteTask(id) {
    const target = tasks.find(x => x.id === id);
    const trashItem = target ? pushToTrash("task", target) : null;
    setTasks(tasks.filter(x => x.id !== id));
    showToast(
      "tossed in the trash.",
      4500,
      trashItem ? { label: "undo", onClick: () => restoreFromTrash(trashItem) } : null,
    );
  }
  function onTaskCompleted(task) {
    if (shelf.length > 0) {
      setCompletionsSinceShelf(c => c + 1);
    }
  }
  function renameTask(id, text) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, text } : t));
  }
  // v=43: next-step handoff — the one surviving idea from v=42's chain
  // system. When a task completes, a passive pill offers "next step?"; saving
  // creates a completely independent fresh task inserted after the completed
  // one. No linkage, no history absorption, no groups, no marker freeze.
  function addNextStep(afterTaskId, text) {
    const cleaned = (text || "").trim();
    if (!cleaned) return;
    setTasks(prev => {
      const fresh = {
        id: nextId(),
        text: cleaned,
        mark: null,
        tenMin: null,
        done: false,
        createdAt: Date.now(),
      };
      const idx = prev.findIndex(t => t.id === afterTaskId);
      if (idx === -1) return [fresh, ...prev];
      return [...prev.slice(0, idx + 1), fresh, ...prev.slice(idx + 1)];
    });
    showToast("next step — on the page.", 2200);
  }
  function reorderTasks(oldActiveIdx, newActiveIdx) {
    if (oldActiveIdx === newActiveIdx) return;
    setTasks(prev => {
      // Active rows are the visible draggable list in NowPage; done rows are
      // a separate block below. Reorder within active, preserve done order.
      const active = prev.filter(t => !t.done);
      const done = prev.filter(t => t.done);
      if (oldActiveIdx < 0 || oldActiveIdx >= active.length) return prev;
      if (newActiveIdx < 0 || newActiveIdx >= active.length) return prev;
      const next = [...active];
      const [moved] = next.splice(oldActiveIdx, 1);
      next.splice(newActiveIdx, 0, moved);
      return [...next, ...done];
    });
  }
  const [highlightHintDismissed, setHighlightHintDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_NS + ":highlightHintShown") === "true"; }
    catch { return true; }
  });
  function dismissHighlightHint() {
    try { localStorage.setItem(STORAGE_NS + ":highlightHintShown", "true"); }
    catch {}
    setHighlightHintDismissed(true);
  }
  // Auto-dismiss the hint the moment the user actually highlights something.
  useEffect(() => {
    if (!highlightHintDismissed && tasks.some(t => t.priority)) {
      dismissHighlightHint();
    }
  }, [tasks, highlightHintDismissed]);
  const showHighlightHint = !highlightHintDismissed
    && screen === "now"
    && tasks.filter(t => !t.done).length >= 3
    && !tasks.some(t => t.priority);
  // v=48: the Notebook's first-visit hint and the swipe hint share the same
  // slot — the swipe hint waits until the first-visit card is dismissed.
  const nowHintSeen = (() => {
    try { return localStorage.getItem(`${STORAGE_NS}:hint.now`) === "true"; }
    catch (e) { return true; }
  })();
  function bringShelfBack(item) {
    const fresh = {
      id: nextId(), text: item.text,
      mark: null, tenMin: null, done: false,
      parentText: item.parentText,
    };
    setTasks([fresh, ...tasks]);
    setShelf(shelf.filter(s => s.id !== item.id));
    setReOfferDismissed(prev => ({ ...prev, [item.id]: undefined }));
    setScreen("now");
    showToast("welcome back. day one again.", 2600);
  }
  function reframeShelf(item, newText) {
    setShelf(shelf.map(s => s.id === item.id ? { ...s, text: newText } : s));
  }
  function setShelfWaitingOn(item, waitingOn) {
    setShelf(shelf.map(s => s.id === item.id ? { ...s, waitingOn } : s));
  }
  function releaseShelf(item) {
    const trashItem = pushToTrash("shelf", item);
    setShelf(shelf.filter(s => s.id !== item.id));
    showToast(
      "tossed in the trash.",
      4500,
      { label: "undo", onClick: () => restoreFromTrash(trashItem) },
    );
  }
  function dismissReOffer(itemId) {
    setReOfferDismissed(prev => ({ ...prev, [itemId]: true }));
    setCompletionsSinceShelf(0); // reset; re-offer again after more wins
  }
  // v=43: a win is simply a completed entry on today's page with isWin:true,
  // rendered with a quiet italic "win" tag. Captured via the + sheet's
  // task/win toggle. No separate timeline — Pages is the flip-back history.
  function logWin(text) {
    const winTask = {
      id: nextId(),
      text,
      mark: null,
      tenMin: null,
      done: true,
      isWin: true,
      createdAt: Date.now(),
    };
    setTasks(prev => {
      const active = prev.filter(t => !t.done);
      const done = prev.filter(t => t.done);
      return [...active, winTask, ...done];
    });
    showToast(text, 3200);
  }
  function divideTask(originalTask, parts, options = {}) {
    const { mode = "all", firstIdx = 0 } = options;
    if (mode === "startOne") {
      // Promote ONE step to a fresh task; stash the rest on the original (kept, but cleared of friction)
      const startStep = parts[firstIdx];
      const restSteps = parts.filter((_, i) => i !== firstIdx);
      const startTask = {
        id: nextId(), text: startStep, mark: null, tenMin: null, done: false,
        parentText: originalTask.text,
      };
      const parkedTask = {
        ...originalTask,
        id: nextId(),
        // soften the friction mark — they took action
        mark: ">",
        parked: true,
        parkedSteps: restSteps,
      };
      setTasks([startTask, parkedTask, ...tasks.filter(x => x.id !== originalTask.id)]);
      showToast("one small thing. start here.", 2400);
      return;
    }
    const newOnes = parts.map((p) => ({
      id: nextId(), text: p, mark: null, tenMin: null, done: false,
    }));
    setTasks([...newOnes, ...tasks.filter(x => x.id !== originalTask.id)]);
  }
  function keepAsNote(task) {
    // "Place on desk" — bare item, top of desk by default.
    const note = { id: nextId(), text: task.text, savedOn: `saved ${today.short}` };
    setNotes([note, ...notes]);
    setTasks(tasks.filter(x => x.id !== task.id));
    showToast("placed on the desk.", 2200);
  }
  function placeTaskInDrawer(task) {
    // "Place in drawer" — bare item, less vital, tucked away.
    const note = { id: nextId(), text: task.text, savedOn: `saved ${today.short}`, inDrawer: true };
    setNotes([note, ...notes]);
    setTasks(tasks.filter(x => x.id !== task.id));
    showToast("placed in the drawer.", 2200);
  }
  function addToDesk(text, inDrawer) {
    // Direct add (no Notebook task involved). Lands as a bare note with the
    // appropriate inDrawer flag.
    const note = {
      id: nextId(), text, savedOn: `saved ${today.short}`,
      inDrawer: !!inDrawer,
    };
    setNotes([note, ...notes]);
    showToast(inDrawer ? "placed in the drawer." : "placed on the desk.", 2200);
  }
  function setShelfInDrawer(item, inDrawer) {
    setShelf(shelf.map(s => s.id === item.id ? { ...s, inDrawer } : s));
    showToast(inDrawer ? "tucked into the drawer." : "back on the desk.", 1800);
  }
  function setNoteInDrawer(note, inDrawer) {
    setNotes(notes.map(n => n.id === note.id ? { ...n, inDrawer } : n));
    showToast(inDrawer ? "tucked into the drawer." : "back on the desk.", 1800);
  }
  function shareTask(task) {
    if (navigator.share) {
      navigator.share({ text: task.text }).catch(() => {});
      setTasks(tasks.filter(x => x.id !== task.id));
    } else {
      // Fallback: copy text to clipboard rather than silently destroying the task.
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(task.text);
          showToast("copied to clipboard.", 2200);
        } else {
          showToast("share isn't available here.", 2400);
        }
      } catch (e) {
        showToast("share isn't available here.", 2400);
      }
    }
  }
  function restoreNote(note) {
    setTasks([{ id: nextId(), text: note.text, mark: null, tenMin: null, done: false }, ...tasks]);
    setNotes(notes.filter(n => n.id !== note.id));
    setScreen("now");
  }
  function deleteNote(id) {
    const target = notes.find(n => n.id === id);
    if (target) pushToTrash("note", target);
    setNotes(notes.filter(n => n.id !== id));
  }
  function restoreFromTrash(item) {
    let msg = "welcomed back.";
    if (item.kind === "task") {
      setTasks([{ ...item.payload, id: nextId(), done: false }, ...tasks]);
    } else if (item.kind === "note") {
      setNotes([{ ...item.payload, id: nextId() }, ...notes]);
      msg = "kept again.";
    } else if (item.kind === "shelf") {
      setShelf([{ ...item.payload, id: nextId() }, ...shelf]);
      msg = "back on the desk.";
    }
    setTrash(prev => prev.filter(t => t.id !== item.id));
    showToast(msg, 2400);
  }
  function purgeFromTrash(id) {
    setTrash(prev => prev.filter(t => t.id !== id));
  }

  function startNewDay() {
    const unfinished = tasks.filter(t => !t.done);
    const completed = tasks.filter(t => t.done && !t.isWin);
    const recapWins = tasks.filter(t => t.done && t.isWin).map(t => t.text);
    const prev = dateInfo(dayOffset).dateStr;
    // v=43: snapshot the ending day into Pages (admin force-next-day path).
    setPages(p => {
      const next = { ...p, [todayIso]: { tasks: pageSnapshotOf(tasks), savedAt: Date.now() } };
      savePages(next);
      return next;
    });
    setRecap({ wins: recapWins, completed, leftovers: unfinished, prevDateStr: prev, recapSource: "admin" });
    setScreen("recap");
  }
  function continueAfterRecap() {
    // Only bump dayOffset for admin "force next day · with recap." Natural
    // day flips already advanced todayIso through effectiveNow(); bumping
    // again would skip a day.
    if (recap.recapSource === "admin") {
      setDayOffset(dayOffset + 1);
    }
    setPrevDateStr(recap.prevDateStr);
    if (recap.leftovers.length === 0) {
      setTasks([]);
      setRecap(null);
      setScreen("anchor");
      return;
    }
    setLeftovers(recap.leftovers);
    setRecap(null);
    setScreen("carry");
  }
  function finishCarry(decisions) {
    // Action semantics:
    //   "keep"     — non-? carries: advance marker via nextMarkAfterCarry.
    //                (Defensive: if a ? somehow reaches this branch via a
    //                non-CarryForward path, auto-shelve as safety net.)
    //   "decide"   — ? carries (v=23+): bring back with ? preserved so the
    //                decision-point friction stays visible. User addresses
    //                via row drawer's Decide flow when ready.
    //   "fresh"    — ? carries (v=23+): bring back with mark cleared.
    //   "later"    — silent drop (legacy "rest for now" path; non-? only).
    //   "release"  — silent drop.
    //   "complete" — v=39: user finished the task already; record it as a
    //                completed task in today's done block, mark cleared.
    const carried = [];
    const autoShelved = [];
    for (const d of decisions) {
      if (d.action === "keep") {
        if (d.task.mark === "?") {
          autoShelved.push({
            id: nextId(),
            text: d.task.text,
            parentText: d.task.parentText || null,
            reasonTag: null, reasonNote: null, waitingOn: null,
            shelvedOn: today.short,
            daysOnShelf: 0,
            autoShelved: true,
          });
        } else {
          carried.push({
            ...d.task, id: nextId(),
            mark: nextMarkAfterCarry(d.task.mark),
            done: false,
          });
        }
      } else if (d.action === "decide") {
        carried.push({
          ...d.task, id: nextId(),
          mark: "?", done: false,
        });
      } else if (d.action === "fresh") {
        carried.push({
          ...d.task, id: nextId(),
          mark: null, done: false,
        });
      } else if (d.action === "later") {
        // v=24 fix: was silent-drop trap. "rest for now" / "leave it" now
        // carries the task forward with mark preserved (no advance, no penalty).
        carried.push({
          ...d.task, id: nextId(),
          mark: d.task.mark || null, done: false,
        });
      } else if (d.action === "complete") {
        // v=39: user marked the carried task as already done during the
        // carry-over phase. Lands in today's done block, mark cleared.
        carried.push({
          ...d.task, id: nextId(),
          mark: null, done: true,
        });
      }
      // "release" intentionally falls through (silent drop = trash).
    }
    setTasks(ensureDailyRecurringTasks(carried));
    const nextShelf = autoShelved.length > 0 ? [...autoShelved, ...shelf] : shelf;
    if (autoShelved.length > 0) {
      setShelf(nextShelf);
      setCompletionsSinceShelf(0);
    }
    setLeftovers(null);
    // v=24: optional desk review after carry. Skip prompt if shelf is empty.
    if (nextShelf.length > 0) {
      setScreen("desk-review-prompt");
    } else {
      setScreen("anchor");
    }
  }

  // v=25: escape hatch from morning flows (Recap, CarryForward) back to
  // Anchor. Auto-keeps remaining leftovers (carry forward + marker advance)
  // and clears recap/leftovers state. Bumps dayOffset for admin path
  // (mirrors continueAfterRecap's source-aware bump).
  function skipMorningFlow() {
    if (recap?.recapSource === "admin") setDayOffset(dayOffset + 1);
    const source = (recap?.leftovers && recap.leftovers.length > 0)
      ? recap.leftovers
      : (leftovers || []);
    const carried = source.map(task => ({
      ...task, id: nextId(),
      mark: nextMarkAfterCarry(task.mark),
      done: false,
    }));
    setTasks(ensureDailyRecurringTasks(carried));
    setLeftovers(null);
    setRecap(null);
    setScreen("anchor");
  }

  // v=32: Anchor's "Open today" button. If a natural day-flip captured a
  // pending recap, route to that ritual first; otherwise straight to Tasks.
  // Lets the calm morning entry (quote → begin) land before yesterday's
  // leftovers preempt focus.
  function openTodayWithRecap() {
    if (recap) {
      setScreen("recap");
    } else {
      setScreen("now");
    }
  }

  // v=24: process DeskReview decisions (bring to today / keep on desk / release).
  function finishDeskReview(deskDecisions) {
    const broughtToToday = [];
    const keepOnDeskIds = new Set();
    for (const d of deskDecisions) {
      if (d.action === "bring") {
        broughtToToday.push({
          id: nextId(),
          text: d.item.text,
          mark: null,
          tenMin: null,
          done: false,
          createdAt: Date.now(),
        });
      } else if (d.action === "keep") {
        keepOnDeskIds.add(d.item.id);
      }
      // "release" = remove from shelf, no carry.
    }
    if (broughtToToday.length > 0) {
      setTasks(prev => [...broughtToToday, ...prev]);
    }
    setShelf(prev => prev.filter(s => keepOnDeskIds.has(s.id)));
    setScreen("anchor");
  }

  // === Admin actions ===
  function adminForceNextDaySilent() {
    const next = dayOffset + 1;
    // v=43: snapshot the ending day into Pages before the silent advance.
    setPages(p => {
      const snap = { ...p, [todayIso]: { tasks: pageSnapshotOf(tasks), savedAt: Date.now() } };
      savePages(snap);
      return snap;
    });
    setDayOffset(next);
    setTasks(prev => ensureDailyRecurringTasks(
      prev.map(task =>
        task.done ? task : { ...task, mark: advanceMarker(task.mark) }
      )
    ));
    setShelf(prev => prev.map(s => ({ ...s, daysOnShelf: (s.daysOnShelf || 0) + 1 })));
    setCompletionsSinceShelf(0);
    setReOfferDismissed({});
    setLastOpenedDay(isoFromOffset(next));
    setSheet(null);
    showToast("day rolled forward.", 2200);
  }
  function adminForceNextDayWithRecap() {
    setSheet(null);
    startNewDay();
  }
  function adminResetDay() {
    setDayOffset(0);
    setLastOpenedDay(isoFromOffset(0));
    setSheet(null);
    showToast("back to real today.", 2000);
  }
  function adminSeedSample() {
    if ((tasks.length + notes.length + shelf.length) > 0 &&
        !window.confirm("Replace current data with sample data?")) return;
    setTasks(SEED_TASKS);
    setNotes(SEED_NOTES);
    setShelf(SEED_SHELF);
    setSheet(null);
    showToast("sample data loaded.", 2200);
  }
  function adminWipe() {
    if (!window.confirm("Wipe everything (tasks, desk, trash, pages) and start fresh? This can't be undone.")) return;
    wipeAllDailyNow();
    window.location.reload();
  }
  function adminReplayTutorial() {
    setTutorialDone(false);
    setShowTutorial(true);
    setTweak("showTutorial", true);
    setSheet(null);
  }
  function adminStageReOffer() {
    setCompletionsSinceShelf(3);
    setSheet(null);
    showToast("re-offer staged.", 2000);
  }
  async function adminCopyState() {
    try {
      const state = JSON.stringify(loadPersisted(), null, 2);
      await navigator.clipboard.writeText(state);
      showToast("state copied.", 2200);
    } catch (e) {
      showToast("clipboard blocked.", 2200);
    }
  }

  // Tutorial supersedes everything else on first run
  if (showTutorial) {
    return (
      <div className="phone-frame" data-screen-label="Phone" style={{}}>
        {!t.showGrain && <style>{`.phone-frame::before { display: none !important; }`}</style>}
        <StatusBar/>
        <div data-screen-label="00 Tutorial" style={{position: "absolute", inset: 0}}>
          <Tutorial onDone={() => { setShowTutorial(false); setTutorialDone(true); setTweak("showTutorial", false); }}/>
        </div>
      </div>
    );
  }

  return (
    <div
      className="phone-frame"
      data-screen-label="Phone"
      style={{}}
    >
      {!t.showGrain && <style>{`.phone-frame::before { display: none !important; }`}</style>}

      <StatusBar/>

      {screen === "anchor" && (
        <div data-screen-label="01 Morning Anchor" style={{position: "absolute", inset: 0}}>
          <MorningAnchor
            onEnter={openTodayWithRecap}
            dateStr={dateStr}
            weekday={weekday.toLowerCase()}
            momentum={momentum}
            showQuote={settings.showQuote !== false}
          />
        </div>
      )}

      {screen === "return" && (
        <div data-screen-label="02 Turn the Page" style={{position: "absolute", inset: 0}}>
          {deferredReady ? (
            <TurnThePage onTurn={() => { setTasks([]); setScreen("now"); }} daysAway={4}/>
          ) : <DeferredFallback label="the page"/>}
        </div>
      )}

      {screen === "carry" && leftovers && (
        <div data-screen-label="04 Carry Forward" style={{position: "absolute", inset: 0}}>
          <SkipToToday onClick={skipMorningFlow}/>
          {deferredReady ? (
            <CarryForward leftovers={leftovers} prevDateStr={prevDateStr} onComplete={finishCarry}/>
          ) : <DeferredFallback label="carry forward"/>}
          <FirstVisitHint hintKey="carry" epoch={hintsEpoch} kicker="first carry-over">
            One thing at a time. Keep it moving, bring it back fresh, or let
            it go — nothing here is overdue. The marks just count the mornings
            it has traveled with you.
          </FirstVisitHint>
        </div>
      )}

      {screen === "desk-review-prompt" && (
        <div data-screen-label="04b Desk Review · prompt" style={{position: "absolute", inset: 0}}>
          {deferredReady ? (
            <DeskReviewPrompt
              shelfCount={shelf.length}
              onYes={() => setScreen("desk-review")}
              onSkip={() => setScreen("anchor")}
            />
          ) : <DeferredFallback label="the desk"/>}
        </div>
      )}

      {screen === "desk-review" && (
        <div data-screen-label="04c Desk Review · iterate" style={{position: "absolute", inset: 0}}>
          <SkipToToday onClick={() => setScreen("anchor")}/>
          {deferredReady ? (
            <DeskReview shelf={shelf} onComplete={finishDeskReview}/>
          ) : <DeferredFallback label="the desk"/>}
        </div>
      )}

      {screen === "recap" && recap && (
        <div data-screen-label="06 Recap" style={{position: "absolute", inset: 0}}>
          <SkipToToday onClick={skipMorningFlow}/>
          {deferredReady ? (
            <Recap recap={recap} onContinue={continueAfterRecap}/>
          ) : <DeferredFallback label="recap"/>}
        </div>
      )}

      {screen === "now" && (
        <div data-screen-label="03 The Now Page" style={{position: "absolute", inset: 0, display: "flex", flexDirection: "column"}}>
          <div style={{flex: 1, minHeight: 0, position: "relative"}}>
            <NowPage
              tasks={tasks}
              setTasks={setTasks}
              onAddOpen={() => setSheet("add")}
              onDivideOpen={(task) => setSheet({ kind: "decision", task })}
              onDelete={deleteTask}
              onTaskCompleted={onTaskCompleted}
              onTogglePriority={togglePriority}
              onRename={renameTask}
              onReorderTasks={reorderTasks}
              onNextStep={addNextStep}
              regulars={todaysRegulars}
              onAddRegular={addRegularToToday}
              activeCap={settings.activeCap}
              onFlipBack={() => setScreen("pages")}
              dateStr={dateStr}
              weekday={weekday.toLowerCase()}
              reOffer={(() => {
                // Only re-offer when today is fully cleared — no open tasks remain.
                // Avoids nagging the user after every checkmark.
                const openCount = tasks.filter(t => !t.done).length;
                if (openCount > 0) return null;
                // And only after at least one completion today, so a fresh empty
                // day doesn't immediately surface shelved items.
                if (completionsSinceShelf < 1) return null;
                const candidate = shelf.find(s => !reOfferDismissed[s.id]);
                if (!candidate) return null;
                const recentDone = tasks.filter(t => t.done).slice(0, 3).map(t => t.text);
                return { item: candidate, recentDone };
              })()}
              onReOfferAccept={(item) => bringShelfBack(item)}
              onReOfferLater={(item) => dismissReOffer(item.id)}
              onReOfferRest={(item) => dismissReOffer(item.id)}
            />
            <FirstVisitHint hintKey="now" epoch={hintsEpoch} kicker="today's page">
              This is the day's whole world. <strong>+</strong> adds a task —
              or a win. Tap the box to finish something. Tap a task to open
              its little drawer. The <em>?</em> up top keeps the full key.
            </FirstVisitHint>
            {showHighlightHint && nowHintSeen && (
              <HighlightHint onDismiss={dismissHighlightHint}/>
            )}
          </div>
          <TabBar screen={screen} setScreen={setScreen} onNewDay={startNewDay}/>
        </div>
      )}

      {(screen === "desk" || screen === "shelf" || screen === "drawer") && (
        <div data-screen-label="07 Desk" style={{position: "absolute", inset: 0, display: "flex", flexDirection: "column"}}>
          <div style={{flex: 1, minHeight: 0, position: "relative"}}>
            {deferredReady ? (
              <DeskPage
                shelf={shelf}
                notes={notes}
                onBringBack={bringShelfBack}
                onOpenShelfSheet={(item, kind) => setShelfSheet({ kind, item })}
                onReleaseShelf={releaseShelf}
                onRestoreNote={restoreNote}
                onDeleteNote={deleteNote}
                onSetShelfInDrawer={setShelfInDrawer}
                onSetNoteInDrawer={setNoteInDrawer}
                onAddOpen={() => setSheet("addDesk")}
                trashCount={trash.length}
                onOpenTrash={() => setScreen("trash")}
              />
            ) : <DeferredFallback label="desk"/>}
            <FirstVisitHint hintKey="desk" epoch={hintsEpoch} kicker="the desk">
              Not for today, not thrown away. The top of the desk holds what's
              worth considering; the drawer below holds the less vital. Bring
              anything back to the page when its moment comes — a task gets
              here through its drawer's <em>decide</em>.
            </FirstVisitHint>
          </div>
          <TabBar screen={screen} setScreen={setScreen} onNewDay={startNewDay}/>
        </div>
      )}

      {screen === "pages" && (
        <div data-screen-label="09 Pages" style={{position: "absolute", inset: 0, display: "flex", flexDirection: "column"}}>
          <div style={{flex: 1, minHeight: 0, position: "relative"}}>
            {deferredReady ? (
              <PagesView pages={pages} todayIso={todayIso} onBackToToday={() => setScreen("now")}/>
            ) : <DeferredFallback label="pages"/>}
            <FirstVisitHint hintKey="pages" epoch={hintsEpoch} kicker="past pages">
              When a day ends, its page rests here — what you finished, what
              carried, your wins. Flip with ‹ ›, or tap the date to jump by
              calendar. <em>today →</em> brings you back. Momentum is evidence.
            </FirstVisitHint>
          </div>
          <TabBar screen={screen} setScreen={setScreen} onNewDay={startNewDay}/>
        </div>
      )}

      {screen === "trash" && (
        <div data-screen-label="08 Trash" style={{position: "absolute", inset: 0, display: "flex", flexDirection: "column"}}>
          <div style={{flex: 1, minHeight: 0, position: "relative"}}>
            {deferredReady ? (
              <TrashBin
                trash={trash}
                onRestore={restoreFromTrash}
                onPurge={purgeFromTrash}
                onClose={() => setScreen("desk")}
              />
            ) : <DeferredFallback label="trash"/>}
            <FirstVisitHint hintKey="trash" epoch={hintsEpoch} kicker="the trash">
              Thrown away, not erased. Things rest here thirty days and can be
              welcomed back any time. Letting go is a decision — it counts.
            </FirstVisitHint>
          </div>
          <TabBar screen={screen} setScreen={setScreen} onNewDay={startNewDay}/>
        </div>
      )}

      {sheet === "add" && <AddSheet onClose={() => setSheet(null)} onAdd={addTask} onLogWin={logWin}/>}
      {sheet === "addDesk" && <AddDeskSheet onClose={() => setSheet(null)} onAdd={addToDesk}/>}
      {sheet && sheet.kind === "decision" && deferredReady && (
        <DecisionPointSheet
          task={sheet.task}
          onClose={() => setSheet(null)}
          onDivide={divideTask}
          onStartOne={(stepText) => { addMomentumStep(sheet.task, stepText); setSheet(null); }}
          onKeepAsNote={() => { keepAsNote(sheet.task); setSheet(null); }}
          onPlaceInDrawer={() => { placeTaskInDrawer(sheet.task); setSheet(null); }}
          onDelete={() => { deleteTask(sheet.task.id); setSheet(null); }}
          onShare={() => shareTask(sheet.task)}
          onStopRecurring={sheet.task.recurrenceId ? () => { stopRecurring(sheet.task.recurrenceId); setSheet(null); } : null}
        />
      )}
      {shelfSheet && shelfSheet.kind === "reframe" && deferredReady && (
        <ReframeSheet
          item={shelfSheet.item}
          onClose={() => setShelfSheet(null)}
          onConfirm={(newText) => { reframeShelf(shelfSheet.item, newText); setShelfSheet(null); }}
        />
      )}
      {shelfSheet && shelfSheet.kind === "waiting" && deferredReady && (
        <WaitingOnSheet
          item={shelfSheet.item}
          onClose={() => setShelfSheet(null)}
          onConfirm={(text) => { setShelfWaitingOn(shelfSheet.item, text); setShelfSheet(null); }}
        />
      )}

      {/* v=45: quiet help trigger — top-right chrome layer (free since the
          wins/goals pills were cut). Hidden during morning-flow rituals so
          they can't be interrupted mid-arc. */}
      {!["return", "carry", "desk-review-prompt", "desk-review", "recap"].includes(screen) && (
        <>
          <button
            className="help-trigger"
            onClick={() => setShowKey(true)}
            aria-label="help — the key"
          >?</button>
          {/* v=51: settings gear — one slot left of the ?. */}
          <button
            className="help-trigger"
            style={{ right: "calc(env(safe-area-inset-right, 0px) + 46px)", fontStyle: "normal" }}
            onClick={() => setShowSettings(true)}
            aria-label="settings"
          >⚙</button>
        </>
      )}
      {showKey && deferredReady && <KeyReference onClose={() => setShowKey(false)}/>}
      {showSettings && deferredReady && (
        <SettingsSheet
          settings={settings}
          onChange={updateSetting}
          onReplayTutorial={replayTutorialFromSettings}
          onResetHints={resetHints}
          onClose={() => setShowSettings(false)}
        />
      )}

      {toast && <WinToast text={toast.text} action={toast.action}/>}

      {ADMIN_VISIBLE && !(sheet && sheet.kind === "admin") && (
        <button
          className="admin-trigger"
          onClick={() => setSheet({ kind: "admin" })}
          aria-label="admin"
        >
          <span/>
        </button>
      )}

      {dayOffset !== 0 && (
        <div className="testing-banner" role="status" aria-live="polite">
          testing — {dayOffset > 0 ? `+${dayOffset}` : dayOffset} day{Math.abs(dayOffset) === 1 ? "" : "s"}
        </div>
      )}

      {ADMIN_VISIBLE && sheet && sheet.kind === "admin" && (
        <>
          <div className="sheet-backdrop" onClick={() => setSheet(null)}/>
          <div className="sheet">
            <div className="kicker" style={{marginBottom: 6}}>admin</div>
            <div className="serif" style={{fontSize: 13, color: "var(--ink-soft)", fontStyle: "italic", lineHeight: 1.5, marginBottom: 18}}>
              effective day · {isoFromOffset(dayOffset)}{dayOffset !== 0 && ` (offset ${dayOffset > 0 ? "+" : ""}${dayOffset})`}<br/>
              tasks {tasks.length} · notes {notes.length} · desk-shelved {shelf.length} · trash {trash.length}
            </div>

            <div className="admin-section-label">day</div>
            <button className="admin-row" onClick={adminForceNextDaySilent}>force next day · silent</button>
            <button className="admin-row" onClick={adminForceNextDayWithRecap}>force next day · with recap</button>
            <button className="admin-row" onClick={adminResetDay}>reset day to real today</button>

            <div className="admin-section-label">data</div>
            <button className="admin-row" onClick={adminSeedSample}>load sample data</button>
            <button className="admin-row" onClick={adminReplayTutorial}>replay tutorial</button>
            <button className="admin-row" onClick={adminStageReOffer}>stage shelf re-offer</button>
            <button className="admin-row" onClick={adminCopyState}>copy state to clipboard</button>

            <div className="admin-section-label">danger</div>
            <button className="admin-row admin-danger" onClick={adminWipe}>wipe everything</button>

            <div style={{display: "flex", justifyContent: "flex-end", marginTop: 18}}>
              <button onClick={() => setSheet(null)} className="ghost-btn" style={{color: "var(--ink-faint)"}}>close</button>
            </div>
          </div>
        </>
      )}

      <TweaksPanel>
        <TweakSection label="Mode">
          <TweakRadio
            label="Theme" value={t.theme}
            onChange={(v) => setTweak("theme", v)}
            options={[
              { value: "paper", label: "Light" },
              { value: "sepia", label: "Sepia" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </TweakSection>
        <TweakSection label="Open on">
          <TweakRadio
            label="Screen" value={t.openOn}
            onChange={(v) => setTweak("openOn", v)}
            options={[
              { value: "anchor", label: "Anchor" },
              { value: "now", label: "Now" },
              { value: "return", label: "Return" },
            ]}
          />
        </TweakSection>
        <TweakSection label="Anchor">
          <TweakSelect
            label="Momentum line"
            value={t.momentumPreview}
            onChange={(v) => setTweak("momentumPreview", v)}
            options={[
              { value: "auto", label: "Auto (none)" },
              { value: "zero", label: "After zero day" },
              { value: "returning", label: "Returning after gap" },
              { value: "streak", label: "On a streak" },
            ]}
          />
        </TweakSection>
        <TweakSection label="Type">
          <TweakSlider
            label="Scale" value={Math.round(t.fontScale * 100)}
            min={90} max={115} step={5} unit="%"
            onChange={(v) => setTweak("fontScale", v / 100)}
          />
        </TweakSection>
        <TweakSection label="Texture">
          <TweakToggle label="Paper grain" value={t.showGrain} onChange={(v) => setTweak("showGrain", v)}/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

function TabBar({ screen, setScreen, onNewDay }) {
  // Layout: [notebook · desk · trash] — the pure spectrum, nothing else.
  // v=49 dropped begin; v=52 dropped the Pages tab (history is reached by
  // flipping back from the Notebook itself — ‹ at the page's bottom-left —
  // so the "pages" screen reads as the notebook, flipped: its tab stays lit.
  return (
    <div className="tabbar tabbar-icons">
      <button
        className={`tab-btn ${(screen === "now" || screen === "pages") ? "active" : ""}`}
        onClick={() => setScreen("now")}
        aria-label="notebook"
      >
        <Icon name="notebook" size={22}/>
        <span className="tab-label">notebook</span>
      </button>
      <button
        className={`tab-btn ${["desk","shelf","drawer"].includes(screen) ? "active" : ""}`}
        onClick={() => setScreen("desk")}
        aria-label="desk"
      >
        <Icon name="desk" size={22}/>
        <span className="tab-label">desk</span>
      </button>
      <button
        className={`tab-btn ${screen === "trash" ? "active" : ""}`}
        onClick={() => setScreen("trash")}
        aria-label="trash"
      >
        <Icon name="trash" size={22}/>
        <span className="tab-label">trash</span>
      </button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
