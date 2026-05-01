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
        loadBabelScript("screens-flows.jsx?v=16"),
        loadBabelScript("screens-rituals.jsx?v=16"),
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
  const [setDownContext, setSetDownContext] = useState(null); // task being set down
  const [shelfSheet, setShelfSheet] = useState(null); // { kind, item }
  const [wins, setWins] = useState(boot.wins || []);
  const [recap, setRecap] = useState(null); // { wins, completed, prevDateStr }
  // Set true by the day-rollover effect when there were flagged-priority tasks
  // carrying into the new day. MorningAnchor reads this and surfaces the
  // carry-sheet ("yesterday's priorities — keep / clear"). Clearing happens
  // via the sheet itself, not auto.
  const [rolloverPriorityPrompt, setRolloverPriorityPrompt] = useState(false);
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
  // advance, visibility resume across midnight). Walks the marker ladder by
  // the day gap, bumps shelf days-on, clears today-scoped state. Idempotent —
  // same-day re-runs compute gap=0 and no-op.
  useEffect(() => {
    if (!lastOpenedDay) {
      setLastOpenedDay(todayIso);
      return;
    }
    const gap = daysBetweenIso(lastOpenedDay, todayIso);
    if (gap <= 0) return;
    const hadPriorities = tasks.some(t => t.priority && !t.done);
    setTasks(prev => prev.map(task => task.done ? task : { ...task, mark: walkMarker(task.mark, gap) }));
    setShelf(prev => prev.map(s => ({ ...s, daysOnShelf: (s.daysOnShelf || 0) + gap })));
    setWins([]);
    setCompletionsSinceShelf(0);
    setReOfferDismissed({});
    setLastOpenedDay(todayIso);
    if (hadPriorities) setRolloverPriorityPrompt(true);
  }, [todayIso]);

  // === Persist on every change ===
  useEffect(() => {
    savePersisted({ tasks, notes, shelf, wins, trash, tutorialDone, lastOpenedDay, dayOffset });
  }, [tasks, notes, shelf, wins, trash, tutorialDone, lastOpenedDay, dayOffset]);

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

  const today = dateInfo(dayOffset);
  const { weekday, dateStr } = today;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme === "paper" ? "" : t.theme);
  }, [t.theme]);

  useEffect(() => {
    setScreen(t.openOn === "now" ? "now" : t.openOn === "return" ? "return" : "anchor");
  }, [t.openOn]);

  useEffect(() => { setShowTutorial(!tutorialDone && t.showTutorial); }, [t.showTutorial, tutorialDone]);

  function addTask(task) { setTasks([{ createdAt: Date.now(), ...task }, ...tasks]); }
  function togglePriority(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, priority: !t.priority } : t));
  }
  function clearAllPriorities() {
    setTasks(prev => prev.map(t => t.priority ? { ...t, priority: false } : t));
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
  function setDownTask(task, { reasonTag, reasonNote, waitingOn }) {
    const item = {
      id: nextId(), text: task.text,
      parentText: task.parentText || null,
      reasonTag: reasonTag || null,
      reasonNote: reasonNote || null,
      waitingOn: waitingOn || null,
      shelvedOn: today.short,
      daysOnShelf: 0,
    };
    setShelf([item, ...shelf]);
    setTasks(tasks.filter(x => x.id !== task.id));
    setCompletionsSinceShelf(0); // reset clock — re-offer when momentum returns
    showToast("set down — gently.", 2400);
  }
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
  function logWin(text) {
    setWins([text, ...wins]);
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
    const completed = tasks.filter(t => t.done);
    const prev = dateInfo(dayOffset).dateStr;
    setRecap({ wins, completed, leftovers: unfinished, prevDateStr: prev });
    setScreen("recap");
  }
  function continueAfterRecap() {
    // Recap → either go to carry, or go straight to anchor if no leftovers
    setDayOffset(dayOffset + 1);
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
    // Carry "keep" decisions advance friction marks. But if a task is ALREADY ? and gets
    // kept again, that's its second decision-cycle — auto-shelve instead of forcing it forward.
    const carried = [];
    const autoShelved = [];
    decisions.filter(d => d.action === "keep").forEach(d => {
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
          mark: nextMarkAfterCarry(d.task.mark), done: false,
        });
      }
    });
    setTasks(carried);
    if (autoShelved.length > 0) {
      setShelf([...autoShelved, ...shelf]);
      setCompletionsSinceShelf(0);
    }
    setLeftovers(null);
    setScreen("anchor");
  }

  // === Admin actions ===
  function adminForceNextDaySilent() {
    const next = dayOffset + 1;
    setDayOffset(next);
    setTasks(prev => prev.map(task => task.done ? task : { ...task, mark: advanceMarker(task.mark) }));
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

  return (
    <div className="phone-frame" data-screen-label="Phone" style={{ fontSize: `${t.fontScale}rem` }}>
      {!t.showGrain && <style>{`.phone-frame::before { display: none !important; }`}</style>}

      <StatusBar/>

      {screen === "anchor" && (
        <div data-screen-label="01 Morning Anchor" style={{position: "absolute", inset: 0}}>
          <MorningAnchor
            onEnter={() => setScreen("now")}
            onMeditate={() => setScreen("meditate-setup")}
            onReflect={() => setScreen("journal")}
            dateStr={dateStr}
            weekday={weekday.toLowerCase()}
            momentum={momentum}
            priorityCarry={rolloverPriorityPrompt ? tasks.filter(t => t.priority && !t.done) : null}
            onKeepPriorities={() => setRolloverPriorityPrompt(false)}
            onClearPriorities={() => { clearAllPriorities(); setRolloverPriorityPrompt(false); }}
          />
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
                showToast("welcome back. begin where you are.", 2400);
                setScreen("now");
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
              onCancel={() => { setMeditateSession(null); setScreen("anchor"); }}
              onComplete={() => {
                setMeditateSession(null);
                showToast("welcome back. begin where you are.", 2400);
                setScreen("now");
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
          {deferredReady ? (
            <CarryForward leftovers={leftovers} prevDateStr={prevDateStr} onComplete={finishCarry}/>
          ) : <DeferredFallback label="carry forward"/>}
        </div>
      )}

      {screen === "recap" && recap && (
        <div data-screen-label="06 Recap" style={{position: "absolute", inset: 0}}>
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
              onDocumentOpen={(task) => setSheet({ kind: "document", task })}
              onDelete={deleteTask}
              onKeyOpen={() => setShowKey(true)}
              onTaskCompleted={onTaskCompleted}
              onSetDownOpen={(task) => setSetDownContext(task)}
              onTogglePriority={togglePriority}
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

      {sheet === "add" && <AddSheet onClose={() => setSheet(null)} onAdd={addTask}/>}
      {sheet === "addDesk" && <AddDeskSheet onClose={() => setSheet(null)} onAdd={addToDesk}/>}
      {sheet === "win" && <WinSheet onClose={() => setSheet(null)} onLog={logWin}/>}
      {sheet && sheet.kind === "decision" && deferredReady && (
        <DecisionPointSheet
          task={sheet.task}
          onClose={() => setSheet(null)}
          onDivide={divideTask}
          onStartOne={(stepText) => { addMomentumStep(sheet.task, stepText); setSheet(null); }}
          onKeepAsNote={() => { keepAsNote(sheet.task); setSheet(null); }}
          onPlaceInDrawer={() => { placeTaskInDrawer(sheet.task); setSheet(null); }}
          onSetDown={() => { setSetDownContext(sheet.task); setSheet(null); }}
          onDelete={() => { deleteTask(sheet.task.id); setSheet(null); }}
          onShare={() => shareTask(sheet.task)}
        />
      )}
      {sheet && sheet.kind === "document" && (
        <DocumentSheet
          task={sheet.task}
          onClose={() => setSheet(null)}
          onPlaceOnDesk={() => keepAsNote(sheet.task)}
          onPlaceInDrawer={() => placeTaskInDrawer(sheet.task)}
          onShare={() => shareTask(sheet.task)}
        />
      )}
      {showKey && deferredReady && <KeyReference onClose={() => setShowKey(false)}/>}

      {setDownContext && deferredReady && (
        <SetDownSheet
          task={setDownContext}
          onClose={() => setSetDownContext(null)}
          onConfirm={(payload) => {
            setDownTask(setDownContext, payload);
            setSetDownContext(null);
          }}
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
  // Spectrum trio (Notebook → Desk → Trash) + Journal as a separate surface
  // for reflection. Visual gap before Journal keeps the spectrum reading as
  // a group.
  return (
    <div className="tabbar tabbar-icons">
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
