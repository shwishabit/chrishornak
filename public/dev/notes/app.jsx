/* The Daily Now — main app */
/* eslint-disable */

const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "paper",
  "openOn": "anchor",
  "fontScale": 1.0,
  "showGrain": true,
  "showTutorial": true,
  "momentumPreview": "auto",
  "defaultMeditateMin": 5,
  "breathPace": "normal",
  "showRitualMenu": true
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
const DAY_BOUNDARY_HOUR = 3;
function effectiveNow() {
  const d = new Date();
  d.setHours(d.getHours() - DAY_BOUNDARY_HOUR);
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
const SCHEMA_VERSION = 1;

function migrate(state, fromVersion) {
  if (fromVersion === SCHEMA_VERSION) return state;
  // A save from a future version we don't recognize — refuse rather than load
  // partial garbage. wipeAllDailyNow() is the user-facing recovery path.
  if (fromVersion > SCHEMA_VERSION) return null;
  // No migrations defined yet. When v2 lands, add: if (fromVersion === 1) { ... }
  return state;
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

// v=28: dailyLogs — per-day record holding mood-checkin payload + meditate
// completion timestamp. Keyed by effective ISO. Independent state slice so a
// future Stats dashboard can read mood trends without unpacking the main
// state blob. Each log: { moodScore: 1-5, noiseText: string, filterText:
// string|null, meditateDoneAt: number|null }. Journal completion is NOT
// tracked here — derived from the existing per-day journal localStorage key
// to avoid double-bookkeeping. Mood label words (slider): 1=low / 2=quiet /
// 3=steady / 4=bright / 5=clear. Reframe gate fires at score ≤ 2.
const LOGS_KEY = `${STORAGE_NS}:logs.v1`;
// v=31: mood scale words — final form per Chris. v=30 used Daylio's exact
// awful/bad/okay/good/great. Chris swapped "awful" → "bad" and "bad" →
// "poor" — softer negative end, still cleanly distinct gradient. Updated
// in three lockstep places: this constant (journal seed), MoodCheckin
// slider label, LadderRow completed-row hint.
const MOOD_WORDS = ["bad", "poor", "okay", "good", "great"];
function loadLogs() {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === "object") ? parsed : {};
  } catch (e) { return {}; }
}
function saveLogs(obj) {
  try { localStorage.setItem(LOGS_KEY, JSON.stringify(obj)); } catch (e) {}
}

// v=34: horizon — Goals slice persists independently from the main state
// blob. Spec survives any single Daily Now session and is timeless from the
// 3am day-flip perspective. Each goal: { id, text, context (str|null), tier
// ("active"|"desk-top"|"desk-back"|"trash"), createdAt }. Soft-cap at 3
// active enforced in the UI (color-shift, no hard block).
const GOALS_KEY = `${STORAGE_NS}:goals.v1`;
function loadGoals() {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) { return []; }
}
function saveGoals(arr) {
  try { localStorage.setItem(GOALS_KEY, JSON.stringify(arr)); } catch (e) {}
}

// v=34: horizon — Wins timeline slice. Persists across day flips, unlike
// the existing daily `wins` slot (which is ephemeral and feeds Recap+Carry).
// On UnseenWin add, we append to BOTH so Recap behavior is unchanged AND
// the horizon Wins screen has a permanent timeline. Each entry: { id, text,
// loggedAt (ms), day (ISO), goalRef (id|null) }. Reverse-chronological.
const WINS_TIMELINE_KEY = `${STORAGE_NS}:wins-timeline.v1`;
function loadWinsTimeline() {
  try {
    const raw = localStorage.getItem(WINS_TIMELINE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) { return []; }
}
function saveWinsTimeline(arr) {
  try { localStorage.setItem(WINS_TIMELINE_KEY, JSON.stringify(arr)); } catch (e) {}
}

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

// === Chains (v=42) ===
// Tasks can chain into each other: a completed task A becomes the predecessor
// of a new task B (B.prevTaskId = A.id). A stays in storage but is HIDDEN
// from standalone active/done lists — A reads only as B's chain history
// (drawer "previous steps") and inside Recap chain context. groupName is a
// chain-wide label that propagates forward; first-chain naming back-fills
// every ancestor so the whole chain reads under one label.
function walkChainBack(taskId, allTasks) {
  // Returns ancestors oldest-first. Stops at the first task with no
  // prevTaskId or at depth 50 (defensive).
  const ancestors = [];
  let cur = allTasks.find(t => t.id === taskId);
  if (!cur) return ancestors;
  while (cur.prevTaskId) {
    const prev = allTasks.find(t => t.id === cur.prevTaskId);
    if (!prev || ancestors.length > 50) break;
    ancestors.unshift(prev);
    cur = prev;
  }
  return ancestors;
}
function getChainAncestorIds(allTasks) {
  // Set of task ids that are pointed to by another task's prevTaskId. These
  // are HIDDEN from standalone active/done renders — visible only inside
  // their successor's chain history.
  const set = new Set();
  for (const t of allTasks) if (t.prevTaskId) set.add(t.prevTaskId);
  return set;
}
function chainHasProgressInWindow(task, allTasks, windowMsAgo) {
  // True if any ancestor's completedAt is more recent than `windowMsAgo` ago.
  // Used by carry-forward to freeze marker advance when chain progress was
  // made within the just-elapsed day(s).
  const cutoff = Date.now() - windowMsAgo;
  const ancestors = walkChainBack(task.id, allTasks);
  return ancestors.some(a =>
    typeof a.completedAt === "number" && a.completedAt >= cutoff
  );
}
function collectChainAncestorRecords(taskList, allTasks) {
  // Walks every task in taskList back through prevTaskId and returns the
  // ancestor task records (deduped). Used by finishCarry / skipMorningFlow
  // to preserve chain history across the day-flip carry — without this,
  // setTasks([...carried]) drops the predecessor records and the head's
  // drawer "previous steps" goes empty after the first day.
  const result = new Map();
  function walk(id) {
    if (result.has(id)) return;
    const t = allTasks.find(x => x.id === id);
    if (!t) return;
    result.set(id, t);
    if (t.prevTaskId) walk(t.prevTaskId);
  }
  for (const t of taskList) {
    if (t && t.prevTaskId) walk(t.prevTaskId);
  }
  return Array.from(result.values());
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

  // Fetch + Babel-transform the deferred screen bundles after first paint.
  // screens-flows.jsx (decision/desk/trash/recap/setdown/key) and
  // screens-rituals.jsx (meditate/breaths/journal) live off the critical
  // path — sync-loading them was the dominant ~700ms cold-parse cost on phone.
  // Now they fetch in parallel + Babel runs on each, then we inject the
  // transpiled code as <script textContent> so the browser executes them.
  // Total deferred budget: ~100–300ms on phone.
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
        loadBabelScript("screens-flows.jsx?v=42"),
        loadBabelScript("screens-rituals.jsx?v=42"),
        loadBabelScript("screens-sketch.jsx?v=42"),
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
    el.textContent = `
      html, body {
        position: fixed !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100dvh !important;
        overflow: hidden !important;
        overscroll-behavior: none !important;
        background: var(--paper) !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      body { display: block !important; }
      #root { width: 100% !important; height: 100dvh !important; display: block !important; }
      .phone-frame {
        width: 100% !important;
        height: 100dvh !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        margin: 0 !important;
      }
      .phone-frame::before { border-radius: 0 !important; }
      .status-bar { display: none !important; }
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
  const [wins, setWins] = useState(boot.wins || []);
  // v=26: recurring task specs (daily + weekly). Persists to its own
  // localStorage key so spec survives release/complete/trash of any single
  // instance.
  const [recurrences, setRecurrences] = useState(() => loadRecurrences());
  // v=28: per-day mood-checkin + meditate completion log.
  const [dailyLogs, setDailyLogs] = useState(() => loadLogs());
  // v=34/35: goals + persistent wins timeline. Both persist independently of
  // the main state blob — timeless from the 3am day-flip perspective.
  // v=35 reframe: removed horizonMode flag. Wins + goals share a top-right
  // bottom-sheet (.space-sheet); no parallel-environment mode. Open-state
  // tracked locally as `spaceOpen` below.
  const [goals, setGoals] = useState(() => loadGoals());
  const [winsTimeline, setWinsTimeline] = useState(() => loadWinsTimeline());
  // v=36: bottom-sheet kind ("wins" | "goals" | null). Two distinct top-right
  // buttons → two distinct sheets → two distinct experiences with consistent
  // visual chrome. v=35's combined SpaceSheet was Chris-flagged: wins and
  // goals are functionally distinct, two buttons two experiences. Local UI
  // state only — never persisted (no reopen-into-sheet after reload).
  const [spaceSheet, setSpaceSheet] = useState(null);
  // v=28: phase state for in-flight Mood Check-in. Set when user enters
  // mood-checkin screen, read by MoodCheckin component, cleared on completion
  // or skip. Lives in App so refresh-during-checkin doesn't lose progress.
  const [moodDraft, setMoodDraft] = useState(null);
  const [recap, setRecap] = useState(null); // { wins, completed, prevDateStr }
  // Set true by the day-rollover effect when there were flagged-priority tasks
  // carrying into the new day. MorningAnchor reads this and surfaces the
  // carry-sheet ("yesterday's priorities — keep / clear"). Clearing happens
  // via the sheet itself, not auto.
  const [sheet, setSheet] = useState(null);
  const [showKey, setShowKey] = useState(false);
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
  const [meditateSession, setMeditateSession] = useState(null); // {minutes, sound, guided}
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
    const recapWins = wins;
    // v=39: filter isWin tasks out — they're already represented in recapWins
    // (logWin writes both). Without this they'd render twice in Recap (once on
    // the wins phase, once on the done phase).
    const recapCompleted = tasks.filter(t => t.done && !t.isWin);
    // v=42: chain progress in the rollover window freezes the marker on the
    // current head. Walking back via prevTaskId; if any ancestor was
    // completed within the just-elapsed day(s), the head doesn't advance.
    const freezeWindowMs = Math.max(1, gap) * 86400000 + 6 * 3600000;
    const recapLeftovers = tasks
      .filter(t => !t.done)
      .map(task => {
        const frozen = chainHasProgressInWindow(task, tasks, freezeWindowMs);
        return frozen ? task : { ...task, mark: walkMarker(task.mark, gap) };
      });
    const recapPrevDateStr = dateStrFromIso(lastOpenedDay).dateStr;
    setTasks(prev => prev.map(task => {
      if (task.done) return task;
      const frozen = chainHasProgressInWindow(task, prev, freezeWindowMs);
      return frozen ? task : { ...task, mark: walkMarker(task.mark, gap) };
    }));
    setShelf(prev => prev.map(s => ({ ...s, daysOnShelf: (s.daysOnShelf || 0) + gap })));
    setWins([]);
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
    savePersisted({ tasks, notes, shelf, wins, trash, tutorialDone, lastOpenedDay, dayOffset });
  }, [tasks, notes, shelf, wins, trash, tutorialDone, lastOpenedDay, dayOffset]);
  // v=26: recurrences persist independently (separate key) so spec survives
  // any single instance's release/complete/trash.
  useEffect(() => { saveRecurrences(recurrences); }, [recurrences]);
  // v=28: dailyLogs persist independently — same separation rationale.
  useEffect(() => { saveLogs(dailyLogs); }, [dailyLogs]);
  // v=34: goals + wins timeline persist independently — timeless from the
  // 3am day-flip perspective.
  useEffect(() => { saveGoals(goals); }, [goals]);
  useEffect(() => { saveWinsTimeline(winsTimeline); }, [winsTimeline]);

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

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme === "paper" ? "" : t.theme);
  }, [t.theme]);

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
  // v=28: write today's mood-checkin payload to dailyLogs[todayIso]. Called by
  // MoodCheckin on completion. filterText is null when score > 2 (Reframe was
  // gated off). savedAt timestamps the write so a future Stats dashboard can
  // sort by entry-time within a day.
  function setMoodEntry(score, noise, filter) {
    setDailyLogs(prev => ({
      ...prev,
      [todayIso]: {
        ...(prev[todayIso] || {}),
        moodScore: score,
        noiseText: noise || "",
        filterText: filter || null,
        moodSavedAt: Date.now(),
      },
    }));
  }
  // v=28: stamp meditation completion. Called when MeditateActive (or
  // SquareBreath) finishes its timer naturally. Cancel paths do NOT stamp.
  function setMeditateComplete() {
    setDailyLogs(prev => ({
      ...prev,
      [todayIso]: {
        ...(prev[todayIso] || {}),
        meditateDoneAt: Date.now(),
      },
    }));
  }
  // v=28: morning ritual completion derivation for the Anchor ladder. Three
  // ritual circles (mood / meditate / journal) reset every effective day
  // because dailyLogs is keyed by ISO and journal storage is key-per-day.
  // Tasks isn't a ritual — it's the destination, no circle.
  // Mood completion: noiseText present AND (score > 2 OR filterText present).
  // I.e., the user finished the input phase. A high-mood day skips the
  // Reframe phase, so filterText is legitimately empty.
  // Meditate completion: meditateDoneAt timestamp present.
  // Journal completion: today's journal localStorage entry has non-empty text.
  // Read at render time — fast, and Anchor re-renders on screen flip back
  // from Journal.
  const todayLog = dailyLogs[todayIso] || {};
  const morningCompletion = {
    mood: !!todayLog.noiseText && (todayLog.moodScore > 2 || !!todayLog.filterText),
    meditate: !!todayLog.meditateDoneAt,
    journal: (() => {
      try {
        const txt = localStorage.getItem(`${STORAGE_NS}:journal.${todayIso}`);
        return !!(txt && txt.trim());
      } catch (e) { return false; }
    })(),
  };
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
    // v=34: if this task pointed at a horizon goal, pulse a quiet "log as
    // today's win?" prompt via the existing toast/action affordance. Decline
    // is silent (toast times out). Accept routes through logWin with goalRef
    // preserved so the timeline records the linkage. Per V2 design: brings
    // completion BACK to the now without forcing it.
    if (task.goalRef) {
      const goal = goals.find(g => g.id === task.goalRef);
      const goalText = goal ? `toward "${goal.text}"` : "today's win";
      showToast(
        `done — ${goalText}`,
        4500,
        { label: "log as win", onClick: () => logWin(task.text, task.goalRef) },
      );
    }
  }
  function renameTask(id, text) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, text } : t));
  }
  // v=42: chain a completed task into a new (or existing) next-step task.
  // The parent is marked done with completedAt stamped so day-flip can detect
  // chain progress; the new task carries prevTaskId pointing at parent and
  // inherits parent's groupName. If a name is provided for the first time on
  // this chain, back-fill every ancestor so the whole chain reads under one
  // label. If linking to an existing task, refuse the link when the target
  // is already part of another chain — keeps v1 chain semantics non-lossy.
  function chainTo(parentId, opts) {
    const { nextText, nextTaskId, groupName: providedName } = opts || {};
    setTasks(prev => {
      const parent = prev.find(t => t.id === parentId);
      if (!parent) return prev;
      const completedAt = Date.now();
      const resolvedName = (providedName && providedName.trim())
        || parent.groupName
        || null;
      let updated = prev.map(t =>
        t.id === parentId
          ? { ...t, done: true, completedAt, groupName: resolvedName }
          : t
      );
      if (providedName && providedName.trim()) {
        const ancestors = walkChainBack(parentId, updated);
        const ids = new Set(ancestors.map(a => a.id));
        updated = updated.map(t =>
          ids.has(t.id) ? { ...t, groupName: resolvedName } : t
        );
      }
      if (nextTaskId) {
        const target = updated.find(t => t.id === nextTaskId);
        if (!target) return updated;
        if (target.prevTaskId) {
          // Don't overwrite an existing chain link — v1 keeps it simple.
          showToast("can't link — already part of another chain.", 2400);
          return updated;
        }
        return updated.map(t =>
          t.id === nextTaskId
            ? { ...t, prevTaskId: parentId, groupName: resolvedName }
            : t
        );
      }
      // New next-step task. Insert directly after the parent so the chain
      // reads in place visually (the row appears to "transform" into the next
      // step rather than jumping elsewhere).
      const fresh = {
        id: nextId(),
        text: (nextText || "").trim(),
        mark: null,
        tenMin: null,
        done: false,
        createdAt: Date.now(),
        prevTaskId: parentId,
        groupName: resolvedName,
      };
      const idx = updated.findIndex(t => t.id === parentId);
      if (idx === -1) return [fresh, ...updated];
      return [
        ...updated.slice(0, idx + 1),
        fresh,
        ...updated.slice(idx + 1),
      ];
    });
  }
  // v=42: rename / set / clear the chain's group label across every member.
  // Walks the chain from the head and writes the new name on each ancestor
  // and the head itself, so all rows show the same label. Empty string clears.
  function setChainGroupName(headId, name) {
    const cleaned = (name || "").trim() || null;
    setTasks(prev => {
      const ancestors = walkChainBack(headId, prev);
      const ids = new Set([headId, ...ancestors.map(a => a.id)]);
      return prev.map(t => ids.has(t.id) ? { ...t, groupName: cleaned } : t);
    });
  }
  // v=27: per-task progress (0-100). Stored as `progress` field; null/undefined
  // = no fill rendered. 100 leaves the field set so the row reads as "fully
  // progressed" until completed via the checkbox. Rounds + clamps defensively.
  function setProgress(id, n) {
    const clean = Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
    setTasks(prev => prev.map(t => t.id === id ? { ...t, progress: clean } : t));
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
  function logWin(text, goalRef = null) {
    setWins([text, ...wins]);
    // v=34: also append to the persistent horizon timeline. Daily slot stays
    // ephemeral (resets on rollover, feeds Recap+Carry); timeline persists.
    // v=39: ALSO write a completed task into today's notebook with isWin:true
    // and winId pointing at the timeline entry. The done block now records
    // accomplishments-not-on-the-list alongside checked-off tasks, with a
    // "· win" identifier on the row. Retire pulls both. Recap filters isWin
    // tasks out of the "completed" phase so wins aren't double-counted
    // against the wins phase.
    const winId = nextId();
    const entry = {
      id: winId,
      text,
      loggedAt: Date.now(),
      day: todayIso,
      goalRef: goalRef || null,
    };
    setWinsTimeline(prev => [entry, ...prev]);
    const winTask = {
      id: nextId(),
      text,
      mark: null,
      tenMin: null,
      done: true,
      isWin: true,
      winId,
      goalRef: goalRef || null,
      createdAt: Date.now(),
    };
    setTasks(prev => {
      const active = prev.filter(t => !t.done);
      const done = prev.filter(t => t.done);
      return [...active, winTask, ...done];
    });
    showToast(text, 3200);
  }
  // v=34: retire a win from the timeline. Manual only — wins don't auto-fade.
  // v=39: also pulls the linked done-task entry from today's notebook so the
  // timeline and the done block stay in sync.
  function retireWin(id) {
    setWinsTimeline(prev => prev.filter(w => w.id !== id));
    setTasks(prev => prev.filter(t => t.winId !== id));
  }

  // v=34: goal CRUD. Tier transitions are unrestricted by design (the
  // spectrum is permissive — drag back from trash, push to drawer, promote
  // anything anywhere). Soft-cap on active is enforced by UI color shift,
  // not state.
  function addGoal(text, context, timeframe) {
    // v=37: timeframe field — "week" | "month" | "year". Reflects the
    // expected horizon for accomplishment. Lifecycle-aware: a "week" goal
    // can later be pushed to "month" (re-evaluation) or pulled into a
    // tighter horizon. Default to "week" so the user lands in the most
    // immediate panel — they can re-park to "month" or "year" if needed.
    const goal = {
      id: nextId(),
      text,
      context: context || null,
      tier: "active",
      timeframe: timeframe || "week",
      createdAt: Date.now(),
    };
    setGoals(prev => [goal, ...prev]);
    showToast("placed.", 1800);
  }
  // v=37: change a goal's timeframe (push back / pull in). Tier unchanged.
  function setGoalTimeframe(id, timeframe) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, timeframe } : g));
    const label = timeframe === "week" ? "this week."
      : timeframe === "month" ? "this month."
      : "this year.";
    showToast(label, 1600);
  }
  function renameGoal(id, text) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, text } : g));
  }
  function setGoalContext(id, context) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, context: context || null } : g));
  }
  function moveGoal(id, tier) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, tier } : g));
    const label = tier === "active" ? "active." : tier === "desk-top" ? "on the desk." : tier === "desk-back" ? "in the drawer." : "released.";
    showToast(label, 1800);
  }
  function releaseGoal(id) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, tier: "trash" } : g));
    showToast("released.", 2000);
  }
  function restoreGoal(id) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, tier: "active" } : g));
    showToast("welcomed back.", 2200);
  }
  function purgeGoal(id) {
    if (!window.confirm("Delete this goal forever? This can't be undone.")) return;
    setGoals(prev => prev.filter(g => g.id !== id));
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
    // v=39: same isWin filter as the natural-rollover recap path — wins are
    // shown on the wins phase, not the done phase, so they don't render twice.
    const completed = tasks.filter(t => t.done && !t.isWin);
    const prev = dateInfo(dayOffset).dateStr;
    setRecap({ wins, completed, leftovers: unfinished, prevDateStr: prev, recapSource: "admin" });
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
    setWins([]); // wins are celebrated; new day starts clean
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
          // v=42: freeze marker advance if chain progress was made within
          // the last ~36h. The day-flip useEffect already froze in the
          // walkMarker pass; this catches the second-pass advance via
          // nextMarkAfterCarry on the user's "keep" decision.
          const frozen = chainHasProgressInWindow(d.task, tasks, 36 * 3600000);
          carried.push({
            ...d.task, id: nextId(),
            mark: frozen ? d.task.mark : nextMarkAfterCarry(d.task.mark),
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
        // carry-over phase. Lands in today's done block as a completed task,
        // mark cleared, completedAt stamped.
        carried.push({
          ...d.task, id: nextId(),
          mark: null, done: true,
          completedAt: Date.now(),
        });
      }
      // "release" intentionally falls through (silent drop = trash).
    }
    // v=42: preserve chain ancestor records of every carried task. Without
    // this the predecessor task records get dropped, breaking each chain
    // head's drawer "previous steps" history. Ancestors stay hidden from
    // standalone active/done lists via the `getChainAncestorIds` filter.
    const preservedAncestors = collectChainAncestorRecords(carried, tasks);
    setTasks(ensureDailyRecurringTasks([...preservedAncestors, ...carried]));
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
    const carried = source.map(task => {
      // v=42: freeze marker advance if chain progress was made recently.
      const frozen = chainHasProgressInWindow(task, tasks, 36 * 3600000);
      return {
        ...task, id: nextId(),
        mark: frozen ? task.mark : nextMarkAfterCarry(task.mark),
        done: false,
      };
    });
    // v=42: preserve chain ancestor records (see finishCarry comment).
    const preservedAncestors = collectChainAncestorRecords(carried, tasks);
    setTasks(ensureDailyRecurringTasks([...preservedAncestors, ...carried]));
    setLeftovers(null);
    setRecap(null);
    setScreen("anchor");
  }

  // v=32: Anchor's "Open today" button. If a natural day-flip captured a
  // pending recap, route to that ritual first; otherwise straight to Tasks.
  // Lets the morning-arousal arc (quote → mood → meditate → journal) finish
  // before yesterday's leftovers preempt focus.
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
    setDayOffset(next);
    setTasks(prev => ensureDailyRecurringTasks(
      // v=42: chain progress in the last ~36h freezes marker advance.
      prev.map(task => {
        if (task.done) return task;
        const frozen = chainHasProgressInWindow(task, prev, 36 * 3600000);
        return frozen ? task : { ...task, mark: advanceMarker(task.mark) };
      })
    ));
    setShelf(prev => prev.map(s => ({ ...s, daysOnShelf: (s.daysOnShelf || 0) + 1 })));
    setWins([]);
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
    if (!window.confirm("Wipe everything (tasks, desk, trash, journal) and start fresh? This can't be undone.")) return;
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
      <div className="phone-frame" data-screen-label="Phone" style={{ fontSize: `${t.fontScale}rem` }}>
        {!t.showGrain && <style>{`.phone-frame::before { display: none !important; }`}</style>}
        <StatusBar/>
        <div data-screen-label="00 Tutorial" style={{position: "absolute", inset: 0}}>
          <Tutorial onDone={() => { setShowTutorial(false); setTutorialDone(true); setTweak("showTutorial", false); }}/>
        </div>
      </div>
    );
  }

  // v=35: SpaceTrigger suppression list. Modal / ritual flows hide the
  // top-right glyph so they can't be interrupted mid-arc; the spectrum
  // (Anchor / Now / Desk / Trash / Journal) shows it. Same gate semantics
  // as v=34's horizon-strip — different affordance.
  const SPACE_HIDDEN_SCREENS = new Set([
    "mood-checkin", "mood-meditate-prompt", "meditate-journal-prompt",
    "breaths", "meditate-setup", "square-breath", "meditate-active",
    "return", "carry", "desk-review-prompt", "desk-review", "recap",
  ]);
  const showSpaceTrigger = !SPACE_HIDDEN_SCREENS.has(screen);

  return (
    <div
      className="phone-frame"
      data-screen-label="Phone"
      style={{ fontSize: `${t.fontScale}rem` }}
    >
      {!t.showGrain && <style>{`.phone-frame::before { display: none !important; }`}</style>}

      <StatusBar/>

      {screen === "anchor" && (
        <div data-screen-label="01 Morning Anchor" style={{position: "absolute", inset: 0}}>
          <MorningAnchor
            onEnter={openTodayWithRecap}
            onMood={() => { setMoodDraft({ phase: "slider", score: 3, noise: "", filter: "" }); setScreen("mood-checkin"); }}
            onMeditate={() => setScreen("meditate-setup")}
            onReflect={() => setScreen("journal")}
            dateStr={dateStr}
            weekday={weekday.toLowerCase()}
            momentum={momentum}
            regulars={todaysRegulars}
            onAddRegular={addRegularToToday}
            completion={morningCompletion}
            todayLog={todayLog}
          />
        </div>
      )}

      {screen === "mood-checkin" && (
        <div data-screen-label="01a Mood Check-in" style={{position: "absolute", inset: 0}}>
          <SkipToToday onClick={() => { setMoodDraft(null); setScreen("anchor"); }}/>
          {deferredReady ? (
            <MoodCheckin
              draft={moodDraft}
              onUpdate={(patch) => setMoodDraft(prev => ({...prev, ...patch}))}
              onComplete={(score, noise, filter) => {
                setMoodEntry(score, noise, filter);
                setMoodDraft(null);
                // Skip the prompt if meditate is already done today (re-tap on a
                // filled mood row → just save updates and bounce back to Anchor).
                if (!todayLog.meditateDoneAt) setScreen("mood-meditate-prompt");
                else setScreen("anchor");
              }}
            />
          ) : <DeferredFallback label="check-in"/>}
        </div>
      )}

      {screen === "mood-meditate-prompt" && (
        <div data-screen-label="01a· prompt → meditate" style={{position: "absolute", inset: 0}}>
          {deferredReady ? (
            <RitualPrompt
              kicker="set down."
              primaryLabel="sit a while"
              onPrimary={() => setScreen("meditate-setup")}
              onSkip={() => setScreen("now")}
            />
          ) : <DeferredFallback label="onward"/>}
        </div>
      )}

      {screen === "meditate-journal-prompt" && (
        <div data-screen-label="01c· prompt → journal" style={{position: "absolute", inset: 0}}>
          {deferredReady ? (
            <RitualPrompt
              kicker="settled."
              primaryLabel="write a while"
              onPrimary={() => setScreen("journal")}
              onSkip={() => setScreen("now")}
            />
          ) : <DeferredFallback label="onward"/>}
        </div>
      )}

      {screen === "breaths" && (
        <div data-screen-label="01b Three Breaths" style={{position: "absolute", inset: 0}}>
          {deferredReady ? (
            <ThreeBreaths
              pacing={t.breathPace}
              onComplete={(focusText) => {
                if (focusText) {
                  setTasks([{
                    id: nextId(), text: focusText, mark: null, tenMin: null, done: false,
                  }, ...tasks]);
                  showToast("one small thing — start here.", 2400);
                }
                setScreen("now");
              }}
            />
          ) : <DeferredFallback label="breathing"/>}
        </div>
      )}

      {screen === "meditate-setup" && (
        <div data-screen-label="01c Meditate · setup" style={{position: "absolute", inset: 0}}>
          {deferredReady ? (
            <MeditateSetup
              defaultMinutes={t.defaultMeditateMin}
              onCancel={() => setScreen("anchor")}
              onStart={(session) => {
                setMeditateSession(session);
                setScreen(session.kind === "square" ? "square-breath" : "meditate-active");
              }}
            />
          ) : <DeferredFallback label="meditation"/>}
        </div>
      )}

      {screen === "square-breath" && meditateSession && (
        <div data-screen-label="01e Square breathing" style={{position: "absolute", inset: 0}}>
          {deferredReady ? (
            <SquareBreath
              totalSec={meditateSession.lengthSec}
              onCancel={() => { setMeditateSession(null); setScreen("anchor"); }}
              onComplete={() => {
                setMeditateSession(null);
                setMeditateComplete();
                if (!morningCompletion.journal) {
                  setScreen("meditate-journal-prompt");
                } else {
                  showToast("welcome back. begin where you are.", 2400);
                  setScreen("now");
                }
              }}
            />
          ) : <DeferredFallback label="breathing"/>}
        </div>
      )}

      {screen === "meditate-active" && meditateSession && (
        <div data-screen-label="01d Meditate · active" style={{position: "absolute", inset: 0}}>
          {deferredReady ? (
            <MeditateActive
              minutes={meditateSession.lengthSec / 60}
              sound={meditateSession.sound}
              guided={meditateSession.guided}
              mantra={todayLog.filterText || null}
              onCancel={() => { setMeditateSession(null); setScreen("anchor"); }}
              onComplete={() => {
                setMeditateSession(null);
                setMeditateComplete();
                if (!morningCompletion.journal) {
                  setScreen("meditate-journal-prompt");
                } else {
                  showToast("welcome back. begin where you are.", 2400);
                  setScreen("now");
                }
              }}
            />
          ) : <DeferredFallback label="meditation"/>}
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
              onWinOpen={() => setSheet("win")}
              onDivideOpen={(task) => setSheet({ kind: "decision", task })}
              onDelete={deleteTask}
              onKeyOpen={() => setShowKey(true)}
              onTaskCompleted={onTaskCompleted}
              onTogglePriority={togglePriority}
              onRename={renameTask}
              onSetProgress={setProgress}
              onReorderTasks={reorderTasks}
              onChain={chainTo}
              onSetGroupName={setChainGroupName}
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
            {showHighlightHint && (
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
          </div>
          <TabBar screen={screen} setScreen={setScreen} onNewDay={startNewDay}/>
        </div>
      )}

      {screen === "journal" && (
        <div data-screen-label="01f Journal" style={{position: "absolute", inset: 0, display: "flex", flexDirection: "column"}}>
          <div style={{flex: 1, minHeight: 0, position: "relative"}}>
            {deferredReady ? (
              <Journal
                onClose={() => setScreen("anchor")}
                dateStr={dateStr}
                weekday={weekday.toLowerCase()}
                todayIso={todayIso}
                seedText={(() => {
                  // v=28: pre-fill the journal entry with today's mood-checkin
                  // payload as a starting seed — only when today's entry is
                  // currently empty AND today has a mood log. Once the user
                  // types anything and autosaves, the seed never re-appears
                  // for that day. Past-date views never seed (Journal handles
                  // this internally — seedText only applies to today).
                  if (!todayLog.noiseText) return "";
                  const word = MOOD_WORDS[(todayLog.moodScore || 3) - 1] || "steady";
                  let s = `mood: ${todayLog.moodScore} — ${word}\nloudest: ${todayLog.noiseText}`;
                  if (todayLog.filterText) s += `\nclearer: ${todayLog.filterText}`;
                  return s + "\n\n";
                })()}
              />
            ) : <DeferredFallback label="journal"/>}
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
          </div>
          <TabBar screen={screen} setScreen={setScreen} onNewDay={startNewDay}/>
        </div>
      )}

      {/* v=36: top-right TWO-button affordance. Wins and goals are functionally
          distinct (recognition vs forward intent) — two buttons, two sheets,
          consistent visual language. Each pill names what it opens; tapping
          reveals only that surface. Suppressed on modal/ritual flows. The
          --has-content modifier subtly emphasizes a button when its surface
          has something to see (active goals / any wins) — soft hint without
          a number badge. */}
      {showSpaceTrigger && (
        <SpaceTriggers
          onOpenWins={() => setSpaceSheet("wins")}
          onOpenGoals={() => setSpaceSheet("goals")}
          hasWins={winsTimeline.length > 0}
          hasGoals={goals.some(g => g.tier === "active")}
        />
      )}

      {spaceSheet === "wins" && (
        <SpaceSheetWins
          wins={winsTimeline}
          goals={goals}
          onClose={() => setSpaceSheet(null)}
          onLogWin={(text) => logWin(text)}
          onRetireWin={retireWin}
        />
      )}

      {spaceSheet === "goals" && (
        <SpaceSheetGoals
          goals={goals}
          tasks={tasks}
          onClose={() => setSpaceSheet(null)}
          onAddGoalOpen={() => setSheet("addGoal")}
          onRenameGoal={renameGoal}
          onSetGoalContext={setGoalContext}
          onMoveGoal={moveGoal}
          onSetGoalTimeframe={setGoalTimeframe}
          onReleaseGoal={releaseGoal}
          onRestoreGoal={restoreGoal}
          onPurgeGoal={purgeGoal}
        />
      )}

      {sheet === "add" && <AddSheet onClose={() => setSheet(null)} onAdd={addTask} goals={goals}/>}
      {sheet === "addDesk" && <AddDeskSheet onClose={() => setSheet(null)} onAdd={addToDesk}/>}
      {sheet === "addGoal" && <AddGoalSheet onClose={() => setSheet(null)} onAdd={addGoal}/>}
      {sheet === "win" && <WinSheet onClose={() => setSheet(null)} onLog={logWin}/>}
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
      {showKey && deferredReady && <KeyReference onClose={() => setShowKey(false)}/>}

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
        <TweakSection label="Morning ritual">
          <TweakSelect
            label="Default meditation"
            value={t.defaultMeditateMin}
            onChange={(v) => setTweak("defaultMeditateMin", Number(v))}
            options={[
              { value: 2, label: "2 min" },
              { value: 5, label: "5 min" },
              { value: 10, label: "10 min" },
            ]}
          />
          <TweakRadio
            label="Breath pace" value={t.breathPace}
            onChange={(v) => setTweak("breathPace", v)}
            options={[
              { value: "fast", label: "Fast" },
              { value: "normal", label: "Normal" },
              { value: "slow", label: "Slow" },
            ]}
          />
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
  // Layout: [begin | notebook · desk · trash | journal]
  //   begin = Anchor (the morning-landing / day-start screen)
  //   spectrum trio = Notebook → Desk → Trash
  //   journal = reflective writing surface
  // Two thin dividers split the three groups so the spectrum reads as a
  // single mental model and Anchor / Journal sit cleanly outside it.
  // v=31: added Anchor tab so users can get back to the Home screen.
  // v=35: TabBar reverted to single-mode (the v=34 horizon-mode swap is gone).
  //       Wins + goals now live in a top-right SpaceTrigger / SpaceSheet,
  //       not in TabBar slots. Journal stays Daily-Now-only.
  return (
    <div className="tabbar tabbar-icons">
      <button
        className={`tab-btn ${screen === "anchor" ? "active" : ""}`}
        onClick={() => setScreen("anchor")}
        aria-label="begin"
      >
        <Icon name="anchor" size={22}/>
        <span className="tab-label">begin</span>
      </button>
      <span className="tab-divider" aria-hidden="true"/>
      <button
        className={`tab-btn ${screen === "now" ? "active" : ""}`}
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
      <span className="tab-divider" aria-hidden="true"/>
      <button
        className={`tab-btn ${screen === "journal" ? "active" : ""}`}
        onClick={() => setScreen("journal")}
        aria-label="journal"
      >
        <Icon name="journal" size={22}/>
        <span className="tab-label">journal</span>
      </button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
