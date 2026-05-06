/* The Daily Now — critical screens (sync-loaded, first-paint path) */
/* Anchor + Now page + capture sheets + Tutorial. */
/* eslint-disable */

const { useState, useEffect, useRef } = React;

// ---------- Morning Anchor ----------
// v=28: CTA cluster restructured as a 4-row ritual ladder (mood / sit a while
// / reflect a moment / open today). The first three are rituals with circles
// that fill on per-day completion (state in app.jsx → dailyLogs[todayIso] +
// today's journal entry). The fourth row is the destination CTA (no circle,
// no completion gate — Tasks is the day's work, not a ritual). Each ritual
// step ends with a recommendation prompt routing to the next; skip from any
// prompt goes direct to Tasks per v=25 home-escape pattern.
function MorningAnchor({ onMood, onMeditate, onBreaths, onReflect, onEnter, dateStr, weekday, momentum, regulars, onAddRegular, completion, todayLog }) {
  const c = completion || { mood: false, meditate: false, journal: false };
  // Daily quote — same for everyone on the same calendar day.
  const quote = (window.quoteForDate ? window.quoteForDate() : null);
  return (
    <div className="screen fade-soft" style={{justifyContent: "space-between", padding: "56px 32px 32px", position: "relative"}}>
      <div style={{textAlign: "left"}} className="ascend">
        <div className="kicker" style={{marginBottom: 10}}>{weekday}</div>
        <div className="serif" style={{fontSize: 20, color: "var(--ink-soft)", letterSpacing: "0.01em"}}>
          {dateStr}
        </div>
      </div>

      <div style={{textAlign: "left"}}>
        {quote && (() => {
          const words = quote.text.split(/\s+/).filter(Boolean);
          const PER_WORD_MS = 90;
          const KICKER_DELAY = 120;
          const QUOTE_START = 380;
          const ATTR_DELAY = QUOTE_START + words.length * PER_WORD_MS + 280;
          return (
            <div>
              <div
                className="kicker ink-fade"
                style={{marginBottom: 14, color: "var(--ink-faint)", animationDelay: `${KICKER_DELAY}ms`}}
              >today's word</div>
              <div
                className="serif"
                style={{
                  fontSize: 28,
                  lineHeight: 1.22,
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: "var(--ink)",
                  letterSpacing: "-0.005em",
                  textWrap: "pretty",
                  maxWidth: 320,
                }}
              >
                <span className="ink-word" style={{animationDelay: `${QUOTE_START}ms`}}>“</span>
                {words.map((w, i) => (
                  <React.Fragment key={i}>
                    <span
                      className="ink-word"
                      style={{animationDelay: `${QUOTE_START + (i + 1) * PER_WORD_MS}ms`}}
                    >{w}</span>
                    {i < words.length - 1 && " "}
                  </React.Fragment>
                ))}
                <span
                  className="ink-word"
                  style={{animationDelay: `${QUOTE_START + (words.length + 1) * PER_WORD_MS}ms`}}
                >”</span>
              </div>
              <div
                className="serif ink-fade"
                style={{
                  fontSize: 13,
                  color: "var(--ink-faint)",
                  marginTop: 14,
                  letterSpacing: "0.04em",
                  animationDelay: `${ATTR_DELAY}ms`,
                }}
              >— {quote.who}</div>
            </div>
          );
        })()}

        {momentum && (
          <div
            className="serif ascend"
            style={{
              fontSize: 14,
              color: "var(--ink-soft)",
              marginTop: 22,
              lineHeight: 1.55,
              animationDelay: "420ms",
              padding: "12px 14px",
              background: "var(--paper-deep)",
              borderLeft: "2px solid var(--rule-strong)",
              maxWidth: 320,
            }}
          >
            {momentum.kicker && (
              <div className="kicker" style={{marginBottom: 6, fontSize: 9}}>{momentum.kicker}</div>
            )}
            <div style={{fontStyle: "italic"}}>{momentum.text}</div>
          </div>
        )}

        {/* v=32: today's nominees removed. Surfacing tasks on Anchor short-
            circuited the morning-arousal arc — the page is meant to walk you
            from quote → mood → meditate → journal before any task thinking
            begins. Nominees still drive priorityScore-based ordering inside
            Tasks; they just don't preempt the ritual on the way in. */}

        {regulars && regulars.length > 0 && (
          <div
            className="serif ascend"
            style={{
              fontSize: 14,
              color: "var(--ink-soft)",
              marginTop: 22,
              lineHeight: 1.55,
              animationDelay: "520ms",
              padding: "12px 14px",
              background: "var(--paper-deep)",
              borderLeft: "2px solid var(--rule-strong)",
              maxWidth: 320,
            }}
          >
            <div className="kicker" style={{marginBottom: 6, fontSize: 9}}>today's regulars</div>
            {regulars.map((r, i) => (
              <button
                key={r.id}
                onClick={() => onAddRegular && onAddRegular(r)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  padding: i === 0 ? "0" : "0",
                  marginTop: i === 0 ? 0 : 6,
                  fontFamily: "var(--serif)",
                  fontSize: 14,
                  color: "var(--ink-soft)",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span>{r.text}</span>
                <span style={{
                  marginLeft: 8,
                  color: "var(--ink-faint)",
                  fontStyle: "italic",
                  fontSize: 13,
                }}>+ add</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ascend" style={{animationDelay: "560ms", display: "flex", flexDirection: "column", gap: 0}}>
        <div className="kicker" style={{marginBottom: 14, color: "var(--ink-faint)"}}>today's path —</div>

        <LadderRow
          filled={c.mood}
          label="mood"
          hint={c.mood && todayLog && todayLog.moodScore
            ? (["bad", "poor", "okay", "good", "great"][todayLog.moodScore - 1] || "checked in")
            : "what's loudest right now?"}
          onClick={onMood}
        />
        <LadderRow
          filled={c.meditate}
          label="sit a while"
          hint={c.meditate ? "settled" : "30 seconds, or longer"}
          onClick={onMeditate}
        />
        <LadderRow
          filled={c.journal}
          label="reflect a moment"
          hint={c.journal ? "on paper" : "a few lines"}
          onClick={onReflect}
        />

        <button
          onClick={onEnter}
          style={{
            marginTop: 22,
            background: "var(--ink)",
            color: "var(--paper)",
            border: "none",
            borderRadius: 999,
            padding: "16px 28px",
            fontFamily: "var(--serif)",
            fontSize: 17,
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            width: "100%",
          }}
        >
          <span>Open today</span>
          <span style={{fontSize: 18, opacity: 0.7}}>→</span>
        </button>
      </div>
    </div>
  );
}

// v=28: ritual ladder row. Replaces SecondaryAnchor at the bottom of Anchor.
// The circle is informational (filled = today's ritual is done), not a gate —
// every row remains tappable so re-entry, edit, or "I'd like to redo this"
// is always available. Border-top hairline preserves the "list of options"
// reading; the circle sits in a dedicated 22px gutter so the row text aligns
// with the existing AnchorMenuItem / SecondaryAnchor patterns.
function LadderRow({ filled, label, hint, onClick }) {
  return (
    <button
      onClick={onClick}
      className="ladder-row"
      style={{
        background: "transparent",
        border: "none",
        borderTop: "1px solid var(--rule)",
        padding: "14px 0",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        color: "var(--ink-soft)",
        fontFamily: "var(--serif)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span
        aria-hidden="true"
        className={`ladder-circle ${filled ? "ladder-circle--filled" : ""}`}
      />
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontSize: 16, fontWeight: 400, color: "var(--ink)"}}>{label}</div>
        <div style={{
          fontSize: 11, color: "var(--ink-faint)",
          fontStyle: "italic", marginTop: 2,
          letterSpacing: "0.02em",
        }}>{hint}</div>
      </div>
      <span style={{fontSize: 16, color: "var(--ink-faint)", marginLeft: 8}}>→</span>
    </button>
  );
}

function SecondaryAnchor({ label, hint, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        borderTop: "1px solid var(--rule)",
        padding: "14px 0",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        color: "var(--ink-soft)",
        fontFamily: "var(--serif)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
      }}
    >
      <div>
        <div style={{fontSize: 16, fontWeight: 400}}>{label}</div>
        <div style={{
          fontSize: 11, color: "var(--ink-faint)",
          fontStyle: "italic", marginTop: 2,
          letterSpacing: "0.02em",
        }}>{hint}</div>
      </div>
      <span style={{fontSize: 16, color: "var(--ink-faint)", marginLeft: 12}}>→</span>
    </button>
  );
}

function AnchorMenuItem({ label, hint, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        borderTop: "1px solid var(--rule)",
        padding: "18px 0",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        color: "var(--ink)",
        fontFamily: "var(--serif)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
      }}
    >
      <div>
        <div style={{fontSize: primary ? 22 : 19, fontWeight: 400}}>{label}</div>
        <div style={{
          fontSize: 12, color: "var(--ink-faint)",
          fontStyle: "italic", marginTop: 3,
          letterSpacing: "0.02em",
        }}>{hint}</div>
      </div>
      <span style={{fontSize: 22, color: "var(--ink-soft)", marginLeft: 12}}>→</span>
    </button>
  );
}

// ---------- Now Page (today's list) ----------
function NowPage({ tasks, setTasks, onAddOpen, onWinOpen, onDivideOpen, onDelete, onKeyOpen, onTaskCompleted, onTogglePriority, onRename, onSetProgress, onReorderTasks, dateStr, weekday, reOffer, onReOfferAccept, onReOfferLater, onReOfferRest }) {
  function toggle(id) {
    const target = tasks.find(t => t.id === id);
    setTasks(tasks.map(t => t.id === id ? {...t, done: !t.done} : t));
    if (target && !target.done && onTaskCompleted) {
      onTaskCompleted(target);
    }
  }
  function setNote(id, noteText) {
    setTasks(tasks.map(t => t.id === id ? {...t, note: noteText.trim() || null} : t));
  }

  const active = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);
  // v=32: cap is on ACTIVE tasks only — completed work shouldn't block adding
  // the next thing. Field-test friction: 7 done + 3 active hit the old
  // tasks.length cap and felt arbitrary. Same threshold of 10 still keeps the
  // page from sprawling, but it now scales with throughput.
  const activeCount = active.length;
  const nearLimit = activeCount >= 8 && activeCount < 10;
  const atLimit = activeCount >= 10;

  // Drag-to-reorder via SortableJS (loaded from CDN in The Daily Now.html).
  // Long-press (500ms) on a row enters drag mode; faster movement falls
  // through to TaskRow's tap (drawer) and swipe-right (highlight) handlers.
  // Sortable mutates the DOM on drop; React reconciles via stable task.id
  // keys when state updates, so DOM and state stay in sync without manual
  // unwind in onEnd.
  const reorderListRef = useRef(null);
  const onReorderRef = useRef(onReorderTasks);
  onReorderRef.current = onReorderTasks;
  useEffect(() => {
    if (!window.Sortable || !reorderListRef.current) return;
    const sortable = new window.Sortable(reorderListRef.current, {
      animation: 150,
      delay: 500,
      delayOnTouchOnly: true,
      touchStartThreshold: 5,
      ghostClass: "task-row--ghost",
      chosenClass: "task-row--chosen",
      dragClass: "task-row--drag",
      onEnd(evt) {
        const { oldIndex, newIndex } = evt;
        if (oldIndex === newIndex || oldIndex == null || newIndex == null) return;
        if (onReorderRef.current) onReorderRef.current(oldIndex, newIndex);
      },
    });
    return () => sortable.destroy();
  }, []);

  // ReOfferCard lives in screens-flows.jsx — guard so a tap before deferred
  // load completes doesn't error out. Almost never hits in practice.
  const ReOfferCardComp = window.ReOfferCard;

  return (
    <div className="screen surface-notebook" style={{padding: "12px 0 0"}}>
      <div className="surface-mark" aria-hidden="true"/>
      {/* Page header */}
      <div style={{padding: "12px 28px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
        <div>
          <div className="kicker" style={{marginBottom: 4}}>{weekday}</div>
          <div className="serif" style={{fontSize: 28, fontWeight: 400, letterSpacing: "-0.01em", color: "var(--ink)"}}>
            Now.
          </div>
          <div className="serif" style={{fontSize: 13, color: "var(--ink-faint)", marginTop: 2, fontStyle: "italic"}}>
            {dateStr}
          </div>
        </div>
        <div style={{display: "flex", gap: 8, alignItems: "center"}}>
          <button onClick={onKeyOpen} title="Key" aria-label="Key" style={{
            background: "transparent", border: "1px solid var(--rule-strong)",
            borderRadius: "50%", width: 30, height: 30,
            fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14,
            color: "var(--ink-soft)", cursor: "pointer", lineHeight: 1,
          }}>?</button>
          <button onClick={onWinOpen} className="win-pill" style={{fontSize: 13, padding: "8px 12px"}}>
            + a win
          </button>
        </div>
      </div>

      <div style={{height: 1, background: "var(--rule-strong)", margin: "0 28px"}}/>

      {reOffer && ReOfferCardComp && (
        <ReOfferCardComp
          item={reOffer.item}
          recentDone={reOffer.recentDone}
          onAccept={() => onReOfferAccept(reOffer.item)}
          onLater={() => onReOfferLater(reOffer.item)}
          onRest={() => onReOfferRest(reOffer.item)}
        />
      )}

      {/* Tasks */}
      <div className="scroll-y" style={{flex: 1, overflowY: "auto", padding: "8px 0 90px"}}>
        {active.length === 0 && done.length === 0 && (
          <div className="serif" style={{
            padding: "60px 32px",
            color: "var(--ink-faint)",
            fontStyle: "italic",
            fontSize: 17,
            lineHeight: 1.5,
            textAlign: "center",
          }}>
            The page is blank.<br/>
            What is one small thing?
          </div>
        )}

        <div ref={reorderListRef}>
          {active.map((t, i) => (
            <TaskRow
              key={t.id}
              task={t}
              onToggle={() => toggle(t.id)}
              onDivide={() => onDivideOpen(t)}
              onDelete={() => onDelete(t.id)}
              onAddNote={(noteText) => setNote(t.id, noteText)}
              onTogglePriority={onTogglePriority ? () => onTogglePriority(t.id) : null}
              onRename={onRename}
              onSetProgress={onSetProgress}
              index={i}
            />
          ))}
        </div>

        {(nearLimit || atLimit) && (
          <div className="serif fade-in" style={{
            padding: "18px 28px 4px",
            fontStyle: "italic",
            fontSize: 13,
            color: atLimit ? "var(--mark)" : "var(--ink-soft)",
            lineHeight: 1.5,
          }}>
            {atLimit
              ? "Ten active is the limit — finish, decide, or release one before adding."
              : "Approaching ten active. Consider what could wait."}
          </div>
        )}

        {done.length > 0 && (
          <div style={{marginTop: 24, padding: "0 28px"}}>
            <div className="kicker" style={{marginBottom: 8, color: "var(--ink-faint)"}}>done</div>
          </div>
        )}
        {done.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            onToggle={() => toggle(t.id)}
            onDivide={() => {}}
            onDelete={() => onDelete(t.id)}
          />
        ))}
      </div>

      <button
        className="fab"
        onClick={onAddOpen}
        aria-label="Add"
        disabled={atLimit}
        style={atLimit ? { opacity: 0.35, cursor: "not-allowed" } : {}}
      >+</button>
    </div>
  );
}

// ---------- Task Note (per-task notebook) ----------
// Up to 280 chars. Renders read-only when the task has a saved note; tap to
// edit. When opened from the drawer for a note-less task, jumps straight to
// edit mode with autoFocus.
function TaskNote({ task, autoEdit, onSave, onCancel }) {
  const [editing, setEditing] = useState(autoEdit);
  const [text, setText] = useState(task.note || "");
  const MAX = 280;
  const remaining = MAX - text.length;
  const overSoft = remaining < 0;
  const taRef = useRef(null);

  useEffect(() => {
    if (editing && taRef.current) {
      taRef.current.focus();
      const len = taRef.current.value.length;
      taRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  function commit() {
    onSave(text.trim());
    setEditing(false);
  }
  function cancel() {
    setText(task.note || "");
    setEditing(false);
    if (!task.note) onCancel();
  }

  // Read-only display
  if (!editing && task.note) {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        style={{
          marginTop: 8,
          paddingLeft: 10,
          borderLeft: "2px solid var(--rule-strong)",
          cursor: "text",
        }}
      >
        <div className="serif" style={{
          fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.55,
          fontStyle: "italic", whiteSpace: "pre-wrap",
        }}>
          {task.note}
        </div>
      </div>
    );
  }

  // Editor
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        marginTop: 10,
        background: "var(--paper-deep)",
        border: "1px solid var(--rule)",
        borderRadius: 4,
        padding: "10px 12px 8px",
      }}
    >
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="A line of context. Why does this matter to you right now?"
        rows={2}
        style={{
          width: "100%", resize: "none",
          background: "transparent", border: "none", outline: "none",
          fontFamily: "var(--serif)", fontSize: 14, lineHeight: 1.55,
          color: "var(--ink)",
          fontStyle: text ? "normal" : "italic",
        }}
      />
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 4, paddingTop: 4, borderTop: "1px solid var(--rule)",
      }}>
        <div style={{display: "flex", gap: 8}}>
          <button
            onClick={commit}
            disabled={overSoft}
            className="ghost-btn"
            style={{
              fontSize: 12, fontStyle: "italic", padding: "2px 8px",
              color: overSoft ? "var(--ink-faint)" : "var(--ink)",
              opacity: overSoft ? 0.5 : 1, cursor: overSoft ? "default" : "pointer",
            }}
          >save</button>
          <button onClick={cancel} className="ghost-btn" style={{
            fontSize: 12, fontStyle: "italic", padding: "2px 8px",
            color: "var(--ink-faint)",
          }}>cancel</button>
          {task.note && (
            <button
              onClick={() => { onSave(""); setEditing(false); }}
              className="ghost-btn"
              style={{
                fontSize: 12, fontStyle: "italic", padding: "2px 8px",
                color: "var(--mark)", marginLeft: 4,
              }}
            >remove</button>
          )}
        </div>
        <div className="serif" style={{
          fontSize: 11, fontStyle: "italic",
          color: overSoft ? "var(--mark)" : "var(--ink-faint)",
        }}>
          {overSoft ? `${-remaining} over` : `${remaining}`}
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, onToggle, onDivide, onDelete, onAddNote, onTogglePriority, onRename, onSetProgress, index }) {
  const isDecision = task.mark === "?";
  const isCarriedTwice = task.mark === ">>";
  const isCarriedOnce = task.mark === ">";
  const isCarried = isCarriedOnce || isCarriedTwice;
  const isPriority = task.priority === true;
  const hasProgress = typeof task.progress === "number" && task.progress > 0 && task.progress < 100;
  const [open, setOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  // v=27: inline progress slider state. Local buffer mirrors row's progress;
  // committed via setOnSlider's onChange (live update for visual feedback)
  // and final commit on slider release / done tap.
  const [progressOpen, setProgressOpen] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  // Swipe-right gesture progress (0–1). Drives the painted highlighter sweep.
  // Tap vs swipe classification happens in onPointerUp based on Δx/Δy/elapsed.
  const [swipeProgress, setSwipeProgress] = useState(0);
  const swipeStateRef = useRef(null);

  // Tap-outside-to-dismiss when drawer is open. Listener is keyed to this
  // row's task.id via data-row-drawer so taps on the drawer's buttons fall
  // through to their own onClick.
  useEffect(() => {
    if (!open) return;
    const taskId = task.id;
    function handlePointerDown(e) {
      const insideDrawer = e.target.closest && e.target.closest(`[data-row-drawer="${taskId}"]`);
      if (insideDrawer) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, task.id]);
  // v=27: tap-outside-to-commit when progress slider is open. Slider's own
  // container stops pointerdown propagation, so this only fires on outside
  // taps. setTimeout(0) defers registration past the click that opened the
  // slider so the same gesture can't dismiss what it just opened.
  // v=30 fix: ref-stabilized localProgress so the effect doesn't tear down +
  // rebuild its listener on every slider tick. The previous deps array
  // included `localProgress`, which made the listener registration race with
  // every drag pixel — under iOS PWA timing that left the slider feeling
  // stuck (no listener attached when user tapped outside). Stable listener
  // now reads the latest value via ref.
  const localProgressRef = useRef(localProgress);
  localProgressRef.current = localProgress;
  useEffect(() => {
    if (!progressOpen) return;
    function handlePointerDown() {
      if (onSetProgress) onSetProgress(task.id, localProgressRef.current);
      setProgressOpen(false);
    }
    const id = setTimeout(() => document.addEventListener("pointerdown", handlePointerDown), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [progressOpen, task.id, onSetProgress]);

  let markGlyph = null;
  let markColor = "var(--ink-faint)";
  if (isCarriedOnce) { markGlyph = "›"; }
  else if (isCarriedTwice) { markGlyph = "››"; markColor = "var(--mark)"; }
  else if (isDecision) { markGlyph = "?"; markColor = "var(--mark)"; }

  // v=32: drawer = Edit + Comment + Progress + Decide. Four buttons at 64px =
  // 256px max. The leftmost × close button was redundant — tap-outside-
  // to-close has shipped since v=16 (document-level pointerdown listener),
  // and tapping the visible row body also re-toggles the drawer. Field-test
  // friction: the v=27 5-button drawer (320px) overflowed on smaller iPhones
  // and required a horizontal pan to reach Decide.
  //
  // Drawer width is dynamic — done tasks render only the Comment button, so
  // the row only slides 64px instead of 256px (was a pre-existing mismatch
  // before v=32; the row used to over-slide and reveal empty drawer space).
  const drawerBtnWidth = 64;
  const visibleDrawerBtns = task.done ? 1 : (onSetProgress ? 4 : 3);
  const drawerWidth = visibleDrawerBtns * drawerBtnWidth;

  // Pointer-event handlers on the row content. Tap = open drawer.
  // Swipe-right = toggle priority (with painted-sweep animation). Vertical
  // movement aborts. Edge-guard at start-x ≥ 20px avoids iOS PWA back-swipe.
  function onRowPointerDown(e) {
    if (editOpen || noteOpen) return;
    if (e.target.closest && e.target.closest(".check")) return;
    if (e.clientX < 20) return;
    swipeStateRef.current = {
      startX: e.clientX, startY: e.clientY, startTime: Date.now(),
    };
  }
  function onRowPointerMove(e) {
    const s = swipeStateRef.current;
    if (!s) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    if (Math.abs(dy) > 30) {
      swipeStateRef.current = null;
      setSwipeProgress(0);
      return;
    }
    // v=30: signed swipe progress so the overlay can paint left (erase)
    // or right (highlight) symmetrically. Range -1..+1.
    const signed = Math.max(-1, Math.min(1, dx / 200));
    setSwipeProgress(signed);
  }
  function onRowPointerUp(e) {
    const s = swipeStateRef.current;
    if (!s) return;
    swipeStateRef.current = null;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    const elapsed = Date.now() - s.startTime;
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && elapsed < 300) {
      setOpen(!open);
      setSwipeProgress(0);
      return;
    }
    // v=29: lowered swipe distance 60 → 40px and raised elapsed cap 800 → 1200ms.
    // v=30: left-swipe (dx < -40) un-highlights; right-swipe (dx > 40) highlights.
    // Each direction is a no-op when the task is already in the desired state,
    // so the gesture is safe to repeat. The visual paint always reflects the
    // direction (right = yellow highlighter, left = paper erase) regardless of
    // current priority state.
    if (dx > 40 && Math.abs(dy) < 30 && elapsed < 1200 && onTogglePriority) {
      if (!isPriority) onTogglePriority();
      setSwipeProgress(1);
      setTimeout(() => setSwipeProgress(0), 240);
      return;
    }
    if (dx < -40 && Math.abs(dy) < 30 && elapsed < 1200 && onTogglePriority) {
      if (isPriority) onTogglePriority();
      setSwipeProgress(-1);
      setTimeout(() => setSwipeProgress(0), 240);
      return;
    }
    setSwipeProgress(0);
  }
  function onRowPointerCancel() {
    swipeStateRef.current = null;
    setSwipeProgress(0);
  }

  return (
    <div
      className={`task-row fade-in ${task.done ? "done-row" : ""} ${isCarried ? "carried" : ""}`}
      style={{
        position: "relative",
        borderBottom: "1px solid var(--rule)",
        animationDelay: `${(index || 0) * 40}ms`,
        overflow: "hidden",
      }}
    >
      {/* v=29: progress indicator. Replaces v=27's faint ghost-fill (paper-
          deep at 0.6 opacity behind row content — too subtle on a paper-cream
          background) with a strong-but-quiet 2px bottom ribbon plus a soft
          paper-edge tint behind the row content. Read-at-a-glance from the
          Notebook screen. Hidden at 0% and 100%. */}
      {hasProgress && (
        <>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0, left: 0, bottom: 0,
              width: `${task.progress}%`,
              background: "var(--paper-edge)",
              opacity: 0.55,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0, bottom: 0,
              height: 2,
              width: `${task.progress}%`,
              background: "var(--ink-soft)",
              opacity: 0.7,
              pointerEvents: "none",
              zIndex: 3,
            }}
          />
        </>
      )}

      {/* Action drawer (revealed when row is "open") — Edit · Comment · Progress · Decide.
          Close = tap outside (document-level pointerdown listener, v=16) or
          tap the visible row body (re-toggles drawer). */}
      <div data-row-drawer={task.id} style={{
        position: "absolute",
        top: 0, right: 0, bottom: 0,
        display: "flex",
        alignItems: "stretch",
        zIndex: 1,
      }}>
        {!task.done && (
          <button
            onClick={() => { setOpen(false); setEditOpen(true); }}
            aria-label="edit"
            title="edit"
            style={{
              background: "var(--paper-deep)",
              border: "none",
              padding: "0 10px",
              color: "var(--ink)",
              cursor: "pointer",
              borderLeft: "1px solid var(--rule)",
              minWidth: drawerBtnWidth,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          ><Icon name="pencil" size={20}/></button>
        )}
        <button
          onClick={() => { setOpen(false); setNoteOpen(true); }}
          aria-label="add comment"
          title="comment"
          style={{
            background: "var(--paper-deep)",
            border: "none",
            padding: "0 10px",
            color: "var(--ink)",
            cursor: "pointer",
            borderLeft: "1px solid var(--rule)",
            minWidth: drawerBtnWidth,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        ><Icon name="comment" size={20}/></button>
        {!task.done && onSetProgress && (
          <button
            onClick={() => {
              setOpen(false);
              setLocalProgress(typeof task.progress === "number" ? task.progress : 0);
              setProgressOpen(true);
            }}
            aria-label="progress"
            title="progress"
            style={{
              background: "var(--paper-deep)",
              border: "none",
              padding: "0 10px",
              color: "var(--ink)",
              cursor: "pointer",
              borderLeft: "1px solid var(--rule)",
              minWidth: drawerBtnWidth,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          ><Icon name="progress" size={20}/></button>
        )}
        {!task.done && (
          <button
            onClick={() => { setOpen(false); onDivide(); }}
            aria-label="decide"
            title="decide"
            style={{
              background: "var(--paper-deep)",
              border: "none",
              padding: "0 10px",
              color: "var(--ink)",
              cursor: "pointer",
              borderLeft: "1px solid var(--rule)",
              minWidth: drawerBtnWidth,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          ><Icon name="fork" size={20}/></button>
        )}
      </div>

      {/* Row content — slides left to reveal actions. Pointer events drive
          tap-vs-swipe classification; tap toggles drawer, swipe-right toggles
          highlight with painted-sweep animation. */}
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "14px 28px",
          alignItems: "flex-start",
          background: "var(--paper)",
          position: "relative",
          zIndex: 2,
          transform: open ? `translateX(-${drawerWidth}px)` : "translateX(0)",
          transition: "transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          touchAction: "pan-y",
        }}
        onPointerDown={onRowPointerDown}
        onPointerMove={onRowPointerMove}
        onPointerUp={onRowPointerUp}
        onPointerCancel={onRowPointerCancel}
      >
        {/* Mark gutter */}
        <div style={{
          width: 22,
          flexShrink: 0,
          paddingTop: 1,
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          fontSize: 17,
          fontWeight: 500,
          color: markColor,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
        }}>{markGlyph}</div>

        <div style={{paddingTop: 2}}>
          <div
            className={`check ${task.done ? "done" : ""}`}
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
          />
        </div>
        <div
          style={{flex: 1, minWidth: 0}}
          onClick={(e) => {
            // v=33: explicit close-on-tap. The row's pointerup handler also
            // toggles `open` on a tap, so this is belt-and-suspenders — but
            // taps on the visible task-name fragment (after the row slides
            // left to reveal the drawer) didn't always feel responsive on
            // phone. Click events fire reliably across iOS PWA / Safari
            // edge cases the pointer handler can miss. Idempotent: when
            // already false, setOpen(false) is a no-op.
            if (open && !editOpen && !progressOpen) {
              e.stopPropagation();
              setOpen(false);
            }
          }}
        >
          {task.parentText && !task.done && (
            <div style={{
              fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 11,
              color: "var(--ink-faint)", letterSpacing: "0.04em",
              marginBottom: 3, textTransform: "uppercase",
            }}>
              from “{task.parentText}”
            </div>
          )}
          <div style={{display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap"}}>
            {progressOpen ? (
              <div
                style={{display: "flex", alignItems: "center", gap: 10, width: "100%"}}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="range"
                  min="0" max="100" step="5"
                  value={localProgress}
                  onChange={(e) => setLocalProgress(Number(e.target.value))}
                  style={{flex: 1, minWidth: 80}}
                  aria-label="progress"
                />
                <div className="serif" style={{
                  minWidth: 36,
                  fontFamily: "var(--serif)", fontStyle: "italic",
                  fontSize: 13, color: "var(--ink-soft)",
                  textAlign: "right",
                }}>{localProgress}%</div>
                <button
                  onClick={() => {
                    if (onSetProgress) onSetProgress(task.id, localProgress);
                    setProgressOpen(false);
                  }}
                  style={{
                    background: "var(--ink)", color: "var(--paper)",
                    border: "none", borderRadius: 999,
                    padding: "5px 12px",
                    fontFamily: "var(--serif)", fontStyle: "italic",
                    fontSize: 12, cursor: "pointer",
                  }}
                >done</button>
                {/* v=30: explicit cancel — closes the slider without writing.
                    Field-test feedback: slider was felt sticky; small × gives
                    a clear way out alongside the "done" commit + tap-outside. */}
                <button
                  onClick={() => setProgressOpen(false)}
                  aria-label="cancel"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--ink-faint)",
                    fontFamily: "var(--serif)",
                    fontStyle: "italic",
                    fontSize: 18,
                    lineHeight: 1,
                    padding: "0 6px",
                    cursor: "pointer",
                  }}
                >×</button>
              </div>
            ) : editOpen ? (
              <input
                autoFocus
                type="text"
                defaultValue={task.text}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== task.text && onRename) onRename(task.id, v);
                  setEditOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") { e.currentTarget.value = task.text; e.currentTarget.blur(); }
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="sans"
                style={{
                  flex: 1, minWidth: 120,
                  fontFamily: "var(--sans)", fontSize: 16,
                  color: "var(--ink)", lineHeight: 1.4,
                  border: "none",
                  borderBottom: "1px solid var(--rule-strong)",
                  outline: "none", background: "transparent",
                  padding: "0 0 2px",
                }}
              />
            ) : (
              <span style={{position: "relative", display: "inline-block"}}>
                <span className={`task-text sans${isPriority ? " task-text--priority" : ""}`} style={{
                  fontSize: 16, color: "var(--ink)", lineHeight: 1.4,
                }}>
                  {task.text}
                </span>
                {typeof task.progress === "number" && task.progress > 0 && task.progress < 100 && (
                  <span className="serif" style={{
                    marginLeft: 8,
                    fontSize: 11, fontStyle: "italic",
                    color: "var(--ink-faint)",
                  }}>{task.progress}%</span>
                )}
                {swipeProgress !== 0 && (
                  <span style={{
                    position: "absolute",
                    [swipeProgress > 0 ? "left" : "right"]: 0,
                    top: -1, bottom: -1,
                    width: `${Math.abs(swipeProgress) * 100}%`,
                    background: swipeProgress > 0 ? "var(--highlight)" : "var(--paper)",
                    pointerEvents: "none",
                    borderRadius: 2,
                    transition: swipeStateRef.current ? "none" : "width 220ms ease-out, opacity 220ms ease-out",
                  }}/>
                )}
              </span>
            )}
          </div>

          {task.parked && task.parkedSteps && task.parkedSteps.length > 0 && !task.done && (
            <div style={{
              marginTop: 8,
              padding: "8px 0 0",
              borderTop: "1px dashed var(--rule)",
            }}>
              <div className="kicker" style={{
                fontSize: 9, marginBottom: 6, color: "var(--ink-faint)",
              }}>resting — for later</div>
              {task.parkedSteps.map((s, i) => (
                <div key={i} className="serif" style={{
                  fontSize: 13, color: "var(--ink-faint)",
                  fontStyle: "italic", lineHeight: 1.5,
                  paddingLeft: 8, position: "relative",
                }}>
                  <span style={{
                    position: "absolute", left: 0, top: "0.5em",
                    width: 4, height: 1, background: "var(--ink-faint)",
                  }}/>
                  {s}
                </div>
              ))}
            </div>
          )}

          {task.tenMin && !task.done && (
            <div style={{
              marginTop: 6,
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 13,
              color: "var(--ink-soft)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span style={{ width: 12, height: 1, background: "var(--ink-faint)", display: "inline-block" }}/>
              10 min: {task.tenMin}
            </div>
          )}

          {/* Inline note — shown below task when present, expandable when adding */}
          {(task.note || noteOpen) && !task.done && (
            <TaskNote
              key={task.id + (task.note ? "-has" : "-edit")}
              task={task}
              autoEdit={noteOpen && !task.note}
              onSave={(noteText) => {
                if (onAddNote) onAddNote(noteText);
                setNoteOpen(false);
              }}
              onCancel={() => setNoteOpen(false)}
            />
          )}

          {isDecision && !task.done && (
            <button
              onClick={(e) => { e.stopPropagation(); onDivide(); }}
              style={{
                marginTop: 10,
                background: "transparent",
                border: "1px solid var(--rule-strong)",
                borderRadius: 999,
                padding: "6px 12px",
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 13,
                color: "var(--ink)",
                cursor: "pointer",
              }}
            >
              decision point →
            </button>
          )}

          {isCarriedTwice && !task.done && (
            <div style={{
              marginTop: 4,
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 12,
              color: "var(--mark)",
              opacity: 0.75,
            }}>
              carried twice — there is friction here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Add Task Sheet ----------
function AddSheet({ onClose, onAdd }) {
  const [text, setText] = useState("");
  const [tenMin, setTenMin] = useState("");
  const [showTenMin, setShowTenMin] = useState(false);
  // v=26: repeats picker — "none" | "daily" | "weekly". For "weekly", `days`
  // is a Set of weekday indices (Sun=0..Sat=6).
  const [repeats, setRepeats] = useState("none");
  const [weeklyDays, setWeeklyDays] = useState(() => new Set());
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  function toggleWeeklyDay(idx) {
    setWeeklyDays(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  function submit() {
    if (!text.trim()) return;
    const parsed = parseMarks(text.trim());
    let recurrenceSpec = null;
    if (repeats === "daily") {
      recurrenceSpec = { type: "daily" };
    } else if (repeats === "weekly" && weeklyDays.size > 0) {
      recurrenceSpec = { type: "weekly", days: Array.from(weeklyDays).sort() };
    }
    onAdd({
      id: Date.now(),
      text: parsed.clean,
      mark: parsed.mark,
      tenMin: tenMin.trim() || null,
      done: false,
    }, recurrenceSpec);
    onClose();
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}/>
      <div className="sheet">
        <div className="kicker" style={{marginBottom: 14}}>add to now</div>
        <input
          ref={inputRef}
          className="paper-input serif"
          style={{fontSize: 20, fontFamily: "var(--serif)"}}
          placeholder="One small thing…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !showTenMin) submit(); }}
        />
        <div className="serif" style={{
          fontSize: 11, color: "var(--ink-faint)", fontStyle: "italic",
          marginTop: 6, letterSpacing: "0.02em",
        }}>
          keep it short — add a comment for detail.
        </div>

        {!showTenMin ? (
          <button
            onClick={() => setShowTenMin(true)}
            style={{
              background: "transparent",
              border: "none",
              padding: "14px 0 0",
              color: "var(--ink-soft)",
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 14,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            + 10-minute version
          </button>
        ) : (
          <div style={{paddingTop: 14}} className="fade-in">
            <div className="kicker" style={{marginBottom: 6, fontSize: 10}}>10-minute version</div>
            <input
              className="paper-input"
              style={{fontSize: 15}}
              placeholder="If you only had ten minutes…"
              value={tenMin}
              onChange={(e) => setTenMin(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            />
          </div>
        )}

        {/* v=26: repeats picker — None / Daily / Weekly + day chips */}
        <div style={{paddingTop: 18}}>
          <div className="kicker" style={{marginBottom: 8, fontSize: 10}}>repeats</div>
          <div style={{display: "flex", gap: 6}}>
            {[
              { key: "none", label: "none" },
              { key: "daily", label: "daily" },
              { key: "weekly", label: "weekly" },
            ].map(opt => {
              const active = repeats === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setRepeats(opt.key)}
                  style={{
                    flex: 1,
                    background: active ? "var(--ink)" : "transparent",
                    color: active ? "var(--paper)" : "var(--ink-soft)",
                    border: `1px solid ${active ? "var(--ink)" : "var(--rule-strong)"}`,
                    borderRadius: 999,
                    padding: "8px 12px",
                    fontFamily: "var(--serif)",
                    fontStyle: active ? "normal" : "italic",
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 160ms ease",
                  }}
                >{opt.label}</button>
              );
            })}
          </div>
          {repeats === "weekly" && (
            <div className="fade-in" style={{display: "flex", gap: 4, marginTop: 10}}>
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => {
                const active = weeklyDays.has(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleWeeklyDay(i)}
                    aria-label={`weekday ${i}`}
                    style={{
                      flex: 1,
                      aspectRatio: "1",
                      background: active ? "var(--ink)" : "transparent",
                      color: active ? "var(--paper)" : "var(--ink-soft)",
                      border: `1px solid ${active ? "var(--ink)" : "var(--rule-strong)"}`,
                      borderRadius: 6,
                      fontFamily: "var(--serif)",
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 160ms ease",
                    }}
                  >{d}</button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28}}>
          <button onClick={onClose} className="ghost-btn" style={{color: "var(--ink-faint)"}}>cancel</button>
          <button
            onClick={submit}
            disabled={!text.trim() || (repeats === "weekly" && weeklyDays.size === 0)}
            style={{
              background: (text.trim() && (repeats !== "weekly" || weeklyDays.size > 0)) ? "var(--ink)" : "var(--paper-deep)",
              color: (text.trim() && (repeats !== "weekly" || weeklyDays.size > 0)) ? "var(--paper)" : "var(--ink-faint)",
              border: "none",
              borderRadius: 999,
              padding: "12px 24px",
              fontFamily: "var(--serif)",
              fontSize: 15,
              cursor: (text.trim() && (repeats !== "weekly" || weeklyDays.size > 0)) ? "pointer" : "default",
              transition: "all 200ms ease",
            }}
          >
            Place on the page
          </button>
        </div>
      </div>
    </>
  );
}

// ---------- Add to Desk Sheet ----------
// Direct entry point for placing something on the desk without going through
// the Notebook → Decision flow. Two destinations: top of desk, or drawer.
function AddDeskSheet({ onClose, onAdd }) {
  const [text, setText] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  function commit(inDrawer) {
    const t = text.trim();
    if (!t) return;
    onAdd(t, inDrawer);
    onClose();
  }

  const ready = text.trim().length > 0;

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}/>
      <div className="sheet">
        <div className="kicker" style={{marginBottom: 8}}>place something</div>
        <div className="serif" style={{
          fontSize: 13, color: "var(--ink-soft)", fontStyle: "italic",
          marginBottom: 14, lineHeight: 1.5,
        }}>
          Set it on the desk if it's worth considering. Tuck it into the drawer if it's less vital.
        </div>
        <input
          ref={inputRef}
          className="paper-input serif"
          style={{fontSize: 17, fontFamily: "var(--serif)"}}
          placeholder="Whatever this is…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && ready) commit(false); }}
        />
        <div style={{display: "flex", gap: 10, marginTop: 22}}>
          <button onClick={() => commit(true)} disabled={!ready} style={{
            flex: 1,
            background: "var(--paper-deep)",
            border: "1px solid var(--rule-strong)",
            color: ready ? "var(--ink)" : "var(--ink-faint)",
            borderRadius: 999, padding: "12px 14px",
            fontFamily: "var(--serif)", fontSize: 14,
            cursor: ready ? "pointer" : "default",
          }}>Place in drawer</button>
          <button onClick={() => commit(false)} disabled={!ready} style={{
            flex: 1,
            background: ready ? "var(--ink)" : "var(--paper-deep)",
            color: ready ? "var(--paper)" : "var(--ink-faint)",
            border: "none",
            borderRadius: 999, padding: "12px 14px",
            fontFamily: "var(--serif)", fontSize: 14,
            cursor: ready ? "pointer" : "default",
          }}>Place on desk</button>
        </div>
      </div>
    </>
  );
}

// ---------- Win Sheet ----------
function WinSheet({ onClose, onLog }) {
  const [text, setText] = useState("");
  const presets = [
    "I started.",
    "I stayed calm.",
    "I asked for help.",
    "I noticed.",
    "I rested.",
    "I came back.",
  ];

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}/>
      <div className="sheet">
        <div className="kicker" style={{marginBottom: 6}}>unseen wins</div>
        <div className="serif" style={{
          fontSize: 19,
          color: "var(--ink)",
          fontStyle: "italic",
          marginBottom: 18,
          lineHeight: 1.4,
        }}>
          Something quiet happened.
        </div>

        <div style={{display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18}}>
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => { onLog(p); onClose(); }}
              className="win-pill"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="kicker" style={{marginBottom: 6, fontSize: 10}}>or in your own words</div>
        <input
          className="paper-input serif"
          style={{fontSize: 16, fontStyle: "italic", fontFamily: "var(--serif)"}}
          placeholder="I…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim()) { onLog(text.trim()); onClose(); }
          }}
        />

        <div style={{display: "flex", justifyContent: "flex-end", marginTop: 22}}>
          <button onClick={onClose} className="ghost-btn" style={{color: "var(--ink-faint)"}}>close</button>
        </div>
      </div>
    </>
  );
}

// ---------- Win toast ----------
function WinToast({ text, action }) {
  return (
    <div
      className="fade-in"
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        bottom: 110,
        background: "var(--ink)",
        color: "var(--paper)",
        borderRadius: 16,
        padding: "14px 18px",
        zIndex: 8,
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 24px -8px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{
        width: 6, height: 6, borderRadius: 50, background: "var(--accent-soft)"
      }}/>
      <div className="serif" style={{fontSize: 15, fontStyle: "italic"}}>{text}</div>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="serif"
          style={{
            marginLeft: "auto",
            background: "transparent",
            border: "none",
            padding: "6px 4px",
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: 13,
            color: "var(--accent-soft)",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            textDecorationColor: "rgba(255,255,255,0.35)",
          }}
        >
          {action.label}
        </button>
      ) : (
        <div style={{
          marginLeft: "auto",
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          fontSize: 12,
          color: "var(--accent-soft)",
        }}>
          seen
        </div>
      )}
    </div>
  );
}

// ---------- Document Sheet (per-task: place on desk / in drawer / share) ----------
// ---------- First-run highlight-gesture hint ----------
// Tiny floating note above the FAB on the Now page. Teaches the swipe-right
// gesture once. Self-dismisses after 6s, on any tap, or when the user
// actually highlights something (handled by parent — tasks.some(t.priority)).
function HighlightHint({ onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div
      onClick={onDismiss}
      className="fade-soft"
      style={{
        position: "absolute", bottom: 96, left: 24, right: 24,
        padding: "12px 16px",
        background: "var(--paper-deep)",
        border: "1px solid var(--rule-strong)",
        borderRadius: 12,
        display: "flex", alignItems: "center", gap: 12,
        cursor: "pointer",
        zIndex: 5,
        boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{
        width: 28, height: 6,
        background: "var(--highlight)",
        borderRadius: 3,
        flexShrink: 0,
      }}/>
      <div className="serif" style={{
        fontSize: 13, color: "var(--ink-soft)", fontStyle: "italic",
        lineHeight: 1.4,
      }}>
        Swipe right across a task to highlight it.
      </div>
    </div>
  );
}

// ---------- First-run Tutorial ----------
function Tutorial({ onDone }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      kicker: "welcome",
      title: "This is the Daily Now.",
      body: "A quiet page. One day at a time.",
      foot: "Three small ideas, then begin.",
    },
    {
      kicker: "the page",
      title: "Now is all you see.",
      body: "No backlog. No overdue. Yesterday rests on its own page.",
      foot: "Ten things, at most. Less is kinder.",
    },
    {
      kicker: "the marks",
      title: "›  ››  ?",
      body: "When something carries forward, it earns a small mark. After three days, it asks to be decided — or divided into smaller steps.",
      foot: "Friction is information, not failure.",
      isMark: true,
    },
    {
      kicker: "ten-minute version",
      title: "Every task can have a smaller self.",
      body: "When you add something, write a 10-minute version. The smallest move that still counts.",
      foot: "Open the doc. Look once. That's enough.",
    },
    {
      kicker: "unseen wins",
      title: "Some wins don't have a checkbox.",
      body: "I started. I stayed calm. I came back. Tap + a win to mark them.",
      foot: "Nothing is owed. Begin where you are.",
    },
  ];
  const cur = steps[step];
  const last = step === steps.length - 1;

  return (
    <div className="screen fade-soft" style={{padding: "44px 32px 32px", justifyContent: "space-between"}}>
      <div>
        <div style={{display: "flex", gap: 4, marginBottom: 24}}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 2,
              background: i <= step ? "var(--ink)" : "var(--rule-strong)",
              transition: "background 280ms ease",
            }}/>
          ))}
        </div>

        <div key={step} className="ascend">
          <div className="kicker" style={{marginBottom: 14}}>{cur.kicker}</div>
          <div className="serif" style={{
            fontSize: cur.isMark ? 56 : 30,
            lineHeight: cur.isMark ? 1 : 1.2,
            color: "var(--ink)",
            marginBottom: cur.isMark ? 18 : 14,
            letterSpacing: cur.isMark ? "0.06em" : "-0.005em",
            fontStyle: cur.isMark ? "italic" : "normal",
          }}>{cur.title}</div>
          <div className="serif" style={{
            fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 18,
          }}>{cur.body}</div>
          <div className="serif" style={{
            fontSize: 14, color: "var(--ink-faint)", fontStyle: "italic", lineHeight: 1.5,
          }}>{cur.foot}</div>
        </div>
      </div>

      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <button onClick={onDone} className="ghost-btn" style={{
          color: "var(--ink-faint)", fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14,
        }}>skip</button>
        <button onClick={() => last ? onDone() : setStep(step + 1)} style={{
          background: "var(--ink)", color: "var(--paper)", border: "none",
          borderRadius: 999, padding: "12px 24px",
          fontFamily: "var(--serif)", fontSize: 15, cursor: "pointer",
        }}>
          {last ? "Begin" : "Next →"}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, {
  MorningAnchor, SecondaryAnchor, AnchorMenuItem, LadderRow,
  NowPage, TaskNote, TaskRow,
  AddSheet, AddDeskSheet, WinSheet, WinToast,
  HighlightHint, Tutorial,
});
