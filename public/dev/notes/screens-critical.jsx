/* The Daily Now — critical screens (sync-loaded, first-paint path) */
/* Anchor + Now page + capture sheets + DocumentSheet + Tutorial. */
/* eslint-disable */

const { useState, useEffect, useRef } = React;

// ---------- Morning Anchor ----------
function MorningAnchor({ onMeditate, onBreaths, onReflect, onEnter, dateStr, weekday, momentum, priorityCarry, onKeepPriorities, onClearPriorities }) {
  // Daily quote — same for everyone on the same calendar day.
  const quote = (window.quoteForDate ? window.quoteForDate() : null);
  const showCarry = Array.isArray(priorityCarry) && priorityCarry.length > 0;
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
      </div>

      <div className="ascend" style={{animationDelay: "560ms", display: "flex", flexDirection: "column", gap: 0}}>
        <div className="kicker" style={{marginBottom: 14, color: "var(--ink-faint)"}}>or pause first —</div>

        <SecondaryAnchor
          label="Sit a while"
          hint="30 seconds, or longer"
          onClick={onMeditate}
        />
        <SecondaryAnchor
          label="Reflect a moment"
          hint="a few lines on yesterday"
          onClick={onReflect}
        />

        <button
          onClick={onEnter}
          style={{
            marginTop: 28,
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

      {showCarry && (
        <>
          <div className="sheet-backdrop"/>
          <div className="sheet" style={{maxHeight: "70%", overflowY: "auto"}}>
            <div className="kicker" style={{marginBottom: 8}}>yesterday's priorities</div>
            <div className="serif" style={{
              fontSize: 18, color: "var(--ink)", fontStyle: "italic",
              lineHeight: 1.4, marginBottom: 18,
            }}>
              still important?
            </div>
            <div style={{
              display: "flex", flexDirection: "column", gap: 8,
              borderTop: "1px solid var(--rule)",
              paddingTop: 14, marginBottom: 22,
            }}>
              {priorityCarry.map(t => (
                <div key={t.id} className="serif" style={{
                  fontSize: 15, color: "var(--ink)", lineHeight: 1.45,
                  padding: "4px 0",
                }}>
                  <span style={{
                    background: "var(--highlight)",
                    padding: "1px 4px",
                    borderRadius: 2,
                    boxDecorationBreak: "clone",
                    WebkitBoxDecorationBreak: "clone",
                  }}>{t.text}</span>
                </div>
              ))}
            </div>
            <div style={{display: "flex", gap: 12, justifyContent: "stretch"}}>
              <button
                onClick={onClearPriorities}
                className="ghost-btn"
                style={{
                  flex: 1, padding: "12px 18px",
                  border: "1px solid var(--rule-strong)",
                  borderRadius: 999, background: "transparent",
                  fontFamily: "var(--serif)", fontSize: 15, fontStyle: "italic",
                  color: "var(--ink-soft)", cursor: "pointer",
                }}
              >clear all</button>
              <button
                onClick={onKeepPriorities}
                style={{
                  flex: 1, padding: "12px 18px",
                  border: "none", borderRadius: 999,
                  background: "var(--ink)", color: "var(--paper)",
                  fontFamily: "var(--serif)", fontSize: 15, fontStyle: "italic",
                  cursor: "pointer",
                }}
              >keep</button>
            </div>
          </div>
        </>
      )}
    </div>
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
function NowPage({ tasks, setTasks, onAddOpen, onWinOpen, onDivideOpen, onDocumentOpen, onDelete, onKeyOpen, onTaskCompleted, onSetDownOpen, onTogglePriority, dateStr, weekday, reOffer, onReOfferAccept, onReOfferLater, onReOfferRest }) {
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
  const total = tasks.length;
  const nearLimit = total >= 8 && total < 10;
  const atLimit = total >= 10;

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

        {active.map((t, i) => (
          <TaskRow
            key={t.id}
            task={t}
            onToggle={() => toggle(t.id)}
            onDivide={() => onDivideOpen(t)}
            onDocument={() => onDocumentOpen(t)}
            onDelete={() => onDelete(t.id)}
            onSetDown={onSetDownOpen ? () => onSetDownOpen(t) : null}
            onAddNote={(noteText) => setNote(t.id, noteText)}
            onTogglePriority={onTogglePriority ? () => onTogglePriority(t.id) : null}
            index={i}
          />
        ))}

        {(nearLimit || atLimit) && (
          <div className="serif fade-in" style={{
            padding: "18px 28px 4px",
            fontStyle: "italic",
            fontSize: 13,
            color: atLimit ? "var(--mark)" : "var(--ink-soft)",
            lineHeight: 1.5,
          }}>
            {atLimit
              ? "The page is full. Ten is the limit — make space before adding."
              : "Approaching ten. Consider what could wait."}
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
            onDocument={() => onDocumentOpen(t)}
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

function TaskRow({ task, onToggle, onDivide, onDocument, onDelete, onSetDown, onAddNote, onTogglePriority, index }) {
  const isDecision = task.mark === "?";
  const isCarriedTwice = task.mark === ">>";
  const isCarriedOnce = task.mark === ">";
  const isCarried = isCarriedOnce || isCarriedTwice;
  const isPriority = task.priority === true;
  const [open, setOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  // Tap-outside-to-dismiss when drawer is open. Without this, the row content
  // is translated by drawerWidth (≥400px on a 5-action active task), which
  // exceeds typical phone viewports — the original tap-to-toggle handler on
  // the row content slides off-screen and the only way to close becomes
  // performing one of the drawer actions. Listener is keyed to this row's
  // task.id via data-row-drawer so taps on the drawer's buttons fall through
  // to their own onClick (which already calls setOpen(false) + executes).
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

  let markGlyph = null;
  let markColor = "var(--ink-faint)";
  if (isCarriedOnce) { markGlyph = "›"; }
  else if (isCarriedTwice) { markGlyph = "››"; markColor = "var(--mark)"; }
  else if (isDecision) { markGlyph = "?"; markColor = "var(--mark)"; }

  // Drawer button count drives the slide distance.
  // Always-on actions: highlight (when handler), note, document, delete.
  // Conditional: set down + decide (only when ? AND not done).
  const drawerWidth = (() => {
    let n = 3; // note + document + delete
    if (onTogglePriority && !task.done) n++; // highlight toggle
    if (isDecision && !task.done && onSetDown) n++; // set down
    if (!task.done) n++; // rethink/decide button always available
    return n * 80;
  })();

  return (
    <div
      className={`fade-in ${task.done ? "done-row" : ""} ${isCarried ? "carried" : ""}`}
      style={{
        position: "relative",
        borderBottom: "1px solid var(--rule)",
        animationDelay: `${(index || 0) * 40}ms`,
        overflow: "hidden",
      }}
    >
      {/* Action drawer (revealed when row is "open") */}
      <div data-row-drawer={task.id} style={{
        position: "absolute",
        top: 0, right: 0, bottom: 0,
        display: "flex",
        alignItems: "stretch",
        zIndex: 1,
      }}>
        {isDecision && !task.done && onSetDown && (
          <button
            onClick={() => { setOpen(false); onSetDown(); }}
            aria-label="set down with reason"
            title="set down"
            style={{
              background: "var(--paper-deep)",
              border: "none",
              padding: "0 14px",
              color: "var(--ink)",
              cursor: "pointer",
              borderLeft: "1px solid var(--rule)",
              minWidth: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          ><Icon name="set-down" size={20}/></button>
        )}
        {!task.done && (
          <button
            onClick={() => { setOpen(false); onDivide(); }}
            aria-label={isDecision ? "decide" : "rethink"}
            title={isDecision ? "decide" : "rethink"}
            style={{
              background: "var(--paper-deep)",
              border: "none",
              padding: "0 14px",
              color: "var(--ink)",
              cursor: "pointer",
              borderLeft: "1px solid var(--rule)",
              minWidth: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          ><Icon name={isDecision ? "decide" : "rethink"} size={20}/></button>
        )}
        {onTogglePriority && !task.done && (
          <button
            onClick={() => { setOpen(false); onTogglePriority(); }}
            aria-label={isPriority ? "remove highlight" : "highlight as priority"}
            title="highlight"
            style={{
              background: isPriority ? "var(--highlight)" : "var(--paper-deep)",
              border: "none",
              padding: "0 14px",
              color: "var(--ink)",
              cursor: "pointer",
              borderLeft: "1px solid var(--rule)",
              minWidth: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          ><Icon name="highlight" size={20}/></button>
        )}
        <button
          onClick={() => {
            setOpen(false);
            setNoteOpen(true);
          }}
          aria-label="add comment"
          title="comment"
          style={{
            background: "var(--paper-deep)",
            border: "none",
            padding: "0 14px",
            color: "var(--ink)",
            cursor: "pointer",
            borderLeft: "1px solid var(--rule)",
            minWidth: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        ><Icon name="comment" size={20}/></button>
        <button
          onClick={() => { setOpen(false); onDocument(); }}
          aria-label="move to desk"
          title="desk"
          style={{
            background: "var(--paper-deep)",
            border: "none",
            padding: "0 14px",
            color: "var(--ink)",
            cursor: "pointer",
            borderLeft: "1px solid var(--rule)",
            minWidth: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        ><Icon name="desk" size={20}/></button>
        <button
          onClick={() => { setOpen(false); onDelete(); }}
          aria-label="move to trash"
          title="trash"
          style={{
            background: "var(--mark)",
            border: "none",
            padding: "0 14px",
            color: "var(--paper)",
            cursor: "pointer",
            minWidth: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        ><Icon name="trash" size={20}/></button>
      </div>

      {/* Row content — slides left to reveal actions */}
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
        }}
        onClick={(e) => {
          // Click on the row toggles the drawer; checkbox handles its own click
          if (e.target.closest('.check')) return;
          setOpen(!open);
        }}
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
        <div style={{flex: 1, minWidth: 0}}>
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
            <span className={`task-text sans${isPriority ? " task-text--priority" : ""}`} style={{fontSize: 16, color: "var(--ink)", lineHeight: 1.4}}>
              {task.text}
            </span>
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
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  function submit() {
    if (!text.trim()) return;
    const parsed = parseMarks(text.trim());
    onAdd({
      id: Date.now(),
      text: parsed.clean,
      mark: parsed.mark,
      tenMin: tenMin.trim() || null,
      done: false,
    });
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

        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28}}>
          <button onClick={onClose} className="ghost-btn" style={{color: "var(--ink-faint)"}}>cancel</button>
          <button
            onClick={submit}
            disabled={!text.trim()}
            style={{
              background: text.trim() ? "var(--ink)" : "var(--paper-deep)",
              color: text.trim() ? "var(--paper)" : "var(--ink-faint)",
              border: "none",
              borderRadius: 999,
              padding: "12px 24px",
              fontFamily: "var(--serif)",
              fontSize: 15,
              cursor: text.trim() ? "pointer" : "default",
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
function DocumentSheet({ task, onClose, onPlaceOnDesk, onPlaceInDrawer, onShare }) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}/>
      <div className="sheet">
        <div className="kicker" style={{marginBottom: 8}}>move off the page</div>
        <div className="serif" style={{
          fontSize: 18, color: "var(--ink)", lineHeight: 1.4, marginBottom: 4,
        }}>{task.text}</div>
        <div className="serif" style={{
          fontSize: 13, color: "var(--ink-soft)", fontStyle: "italic", marginBottom: 22,
        }}>
          Where does this belong now?
        </div>

        <button onClick={() => { onPlaceOnDesk(); onClose(); }} style={{
          width: "100%", textAlign: "left", padding: "16px 18px",
          background: "var(--paper-deep)", border: "none", borderRadius: 12,
          marginBottom: 10, cursor: "pointer", color: "var(--ink)",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{flexShrink: 0, color: "var(--ink-soft)"}}><Icon name="desk" size={22}/></span>
          <div>
            <div className="serif" style={{fontSize: 16, marginBottom: 2}}>Place on desk</div>
            <div className="serif" style={{
              fontSize: 12, fontStyle: "italic", color: "var(--ink-soft)",
            }}>Worth considering. On top, where you'll see it.</div>
          </div>
        </button>

        <button onClick={() => { onPlaceInDrawer(); onClose(); }} style={{
          width: "100%", textAlign: "left", padding: "16px 18px",
          background: "var(--paper-deep)", border: "none", borderRadius: 12,
          marginBottom: 10, cursor: "pointer", color: "var(--ink)",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{flexShrink: 0, color: "var(--ink-soft)"}}><Icon name="drawer" size={22}/></span>
          <div>
            <div className="serif" style={{fontSize: 16, marginBottom: 2}}>Place in drawer</div>
            <div className="serif" style={{
              fontSize: 12, fontStyle: "italic", color: "var(--ink-soft)",
            }}>Less vital. Tucked away, kept.</div>
          </div>
        </button>

        <button onClick={() => { onShare(); onClose(); }} style={{
          width: "100%", textAlign: "left", padding: "16px 18px",
          background: "var(--paper-deep)", border: "none", borderRadius: 12,
          marginBottom: 18, cursor: "pointer", color: "var(--ink)",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{flexShrink: 0, color: "var(--ink-soft)"}}><Icon name="share" size={22}/></span>
          <div>
            <div className="serif" style={{fontSize: 16, marginBottom: 2}}>Share elsewhere</div>
            <div className="serif" style={{
              fontSize: 12, fontStyle: "italic", color: "var(--ink-soft)",
            }}>Calendar, message, another app.</div>
          </div>
        </button>

        <div style={{display: "flex", justifyContent: "flex-end"}}>
          <button onClick={onClose} className="ghost-btn" style={{color: "var(--ink-faint)"}}>cancel</button>
        </div>
      </div>
    </>
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
  MorningAnchor, SecondaryAnchor, AnchorMenuItem,
  NowPage, TaskNote, TaskRow,
  AddSheet, AddDeskSheet, WinSheet, WinToast,
  DocumentSheet, Tutorial,
});
