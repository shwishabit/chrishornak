/* The Daily Now — flows (deferred-loaded) */
/* Decision flow, Divide, CarryForward, SetDown, Recap, Desk + Postits, */
/* Trash, ReOffer, KeyReference, TurnThePage. */
/* eslint-disable */

const { useState, useEffect, useRef } = React;

// ---------- Turn the Page (long absence) ----------
function TurnThePage({ onTurn, daysAway }) {
  return (
    <div className="screen fade-soft" style={{justifyContent: "center", padding: "0 36px", textAlign: "center"}}>
      <div className="ascend" style={{animationDelay: "0ms"}}>
        <div className="kicker" style={{marginBottom: 18}}>welcome back</div>
      </div>
      <div
        className="serif ascend"
        style={{
          fontSize: 32,
          lineHeight: 1.25,
          color: "var(--ink)",
          animationDelay: "160ms",
        }}
      >
        The page you left<br/>is still there.<br/>
        <span style={{color: "var(--ink-soft)", fontStyle: "italic"}}>
          But this one is blank.
        </span>
      </div>
      <div
        className="serif ascend"
        style={{
          fontSize: 15,
          color: "var(--ink-faint)",
          marginTop: 24,
          fontStyle: "italic",
          animationDelay: "320ms",
        }}
      >
        Nothing is owed. Begin again.
      </div>
      <button
        onClick={onTurn}
        className="ascend"
        style={{
          marginTop: 56,
          background: "var(--ink)",
          color: "var(--paper)",
          border: "none",
          borderRadius: 999,
          padding: "16px 36px",
          fontFamily: "var(--serif)",
          fontSize: 17,
          cursor: "pointer",
          animationDelay: "480ms",
        }}
      >
        Turn the page
      </button>
    </div>
  );
}

// ---------- Reason tags (used by SetDownSheet + DeskShelfPostit) ----------
const REASON_TAGS = [
  { key: "fear",     label: "it feels heavy",   sub: "fear or pressure" },
  { key: "waiting",  label: "I'm waiting",      sub: "on someone or something" },
  { key: "unclear",  label: "it's not clear",   sub: "I don't know the shape yet" },
  { key: "notmine",  label: "not really mine",  sub: "an obligation absorbed" },
  { key: "wish",     label: "more a wish",      sub: "than a task right now" },
  { key: "other",    label: "something else",   sub: "I'll say it in my words" },
];

function reasonLabelFor(key) {
  const tag = REASON_TAGS.find(r => r.key === key);
  return tag ? tag.label : null;
}

// ---------- Decision Point Sheet ----------
// Replaces the simple "divide" sheet for ?-marked tasks.
// A hub of options: start with one, break it down, send somewhere,
// place on desk, place in drawer, set down with reason, toss in trash can.
function DecisionPointSheet({ task, onClose, onDivide, onStartOne, onKeepAsNote, onPlaceInDrawer, onSetDown, onDelete, onShare }) {
  // view: "hub" | "startOne" | "breakDown" | "share"
  const [view, setView] = useState("hub");
  const [oneStep, setOneStep] = useState("");
  const oneRef = useRef(null);

  useEffect(() => {
    if (view === "startOne") setTimeout(() => oneRef.current?.focus(), 80);
  }, [view]);

  function commitOneStep() {
    const text = oneStep.trim();
    if (!text) return;
    onStartOne(text);
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}/>
      <div className="sheet" style={{paddingBottom: 28, maxHeight: "82%", overflowY: "auto"}}>
        <div className="kicker" style={{marginBottom: 8}}>decision point</div>
        <div className="serif" style={{fontSize: 19, color: "var(--ink)", lineHeight: 1.4, marginBottom: 4}}>
          {task.text}
        </div>
        <div className="serif" style={{
          fontSize: 13, color: "var(--ink-soft)", fontStyle: "italic", marginBottom: 18,
          lineHeight: 1.5,
        }}>
          {view === "hub"      && "Three days have lived here. What does this need from you now?"}
          {view === "startOne" && "What's one small thing you could do right now to get going?"}
          {view === "breakDown"&& "What small steps live inside this?"}
          {view === "share"    && "Send it somewhere it belongs."}
        </div>

        {view === "hub" && (
          <DecisionHub
            onStartOne={() => setView("startOne")}
            onBreakDown={() => setView("breakDown")}
            onShare={() => setView("share")}
            onKeepAsNote={onKeepAsNote}
            onPlaceInDrawer={onPlaceInDrawer}
            onSetDown={onSetDown}
            onDelete={onDelete}
          />
        )}

        {view === "startOne" && (
          <StartOnePanel
            value={oneStep}
            setValue={setOneStep}
            inputRef={oneRef}
            onCommit={commitOneStep}
            onBack={() => setView("hub")}
          />
        )}

        {view === "breakDown" && (
          <BreakDownPanel
            task={task}
            onDivide={(t, parts, opts) => { onDivide(t, parts, opts); onClose(); }}
            onBack={() => setView("hub")}
          />
        )}

        {view === "share" && (
          <SharePanel
            task={task}
            onPickedSystem={() => { onShare(); onClose(); }}
            onPickedMock={() => onClose()}
            onBack={() => setView("hub")}
          />
        )}
      </div>
    </>
  );
}

function DecisionHub({ onStartOne, onBreakDown, onShare, onKeepAsNote, onPlaceInDrawer, onSetDown, onDelete }) {
  const items = [
    { label: "Start with one",   hint: "name the smallest piece, do that", action: onStartOne, primary: true,  icon: "start-one" },
    { label: "Break it down",    hint: "two to five small steps",           action: onBreakDown, primary: true, icon: "break-down" },
    { label: "Send it on",       hint: "calendar, message, mail…",          action: onShare,                    icon: "share" },
    { label: "Place on desk",    hint: "worth considering, on top",         action: onKeepAsNote,               icon: "desk" },
    { label: "Place in drawer",  hint: "less vital, tucked away",           action: onPlaceInDrawer,            icon: "drawer" },
    { label: "Set down · with reason", hint: "rest it gently, with a why",  action: onSetDown,                  icon: "set-down" },
    { label: "Toss in trash can", hint: "release it from the page",         action: onDelete, danger: true,     icon: "trash" },
  ];
  return (
    <div style={{display: "flex", flexDirection: "column"}}>
      {items.map((it, i) => (
        <button
          key={it.label}
          onClick={it.action}
          style={{
            background: "transparent",
            border: "none",
            borderTop: i === 0 ? "1px solid var(--rule)" : "none",
            borderBottom: "1px solid var(--rule)",
            padding: "16px 0",
            textAlign: "left",
            fontFamily: "var(--serif)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: it.danger ? "var(--ink-soft)" : "var(--ink)",
          }}
        >
          {it.icon ? (
            <span style={{
              flexShrink: 0,
              width: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: it.danger ? "var(--mark)" : "var(--ink-soft)",
            }}><Icon name={it.icon} size={20}/></span>
          ) : (
            <span style={{flexShrink: 0, width: 22}}/>
          )}
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{
              fontSize: 16,
              fontWeight: it.primary ? 500 : 400,
              fontStyle: it.danger ? "italic" : "normal",
            }}>{it.label}</div>
            <div style={{
              fontSize: 11, color: "var(--ink-faint)",
              fontStyle: "italic", marginTop: 3,
              letterSpacing: "0.02em",
            }}>{it.hint}</div>
          </div>
          <span style={{fontSize: 15, color: "var(--ink-faint)", marginLeft: 8}}>→</span>
        </button>
      ))}
    </div>
  );
}

function StartOnePanel({ value, setValue, inputRef, onCommit, onBack }) {
  return (
    <div className="fade-in">
      <div className="kicker" style={{marginBottom: 6, fontSize: 10}}>the smallest piece</div>
      <input
        ref={inputRef}
        className="paper-input serif"
        style={{fontSize: 17, fontStyle: "italic", fontFamily: "var(--serif)"}}
        placeholder="Just one tiny next step…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onCommit(); }}
      />
      <div className="serif" style={{
        fontSize: 12, color: "var(--ink-faint)", fontStyle: "italic",
        marginTop: 10, lineHeight: 1.55,
      }}>
        Once you've done it, momentum often carries you into the next piece. The original task stays right where it is.
      </div>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22}}>
        <button onClick={onBack} className="ghost-btn" style={{color: "var(--ink-faint)"}}>back</button>
        <button
          onClick={onCommit}
          disabled={!value.trim()}
          style={{
            background: value.trim() ? "var(--ink)" : "var(--paper-deep)",
            color: value.trim() ? "var(--paper)" : "var(--ink-faint)",
            border: "none", borderRadius: 999, padding: "12px 22px",
            fontFamily: "var(--serif)", fontSize: 15,
            cursor: value.trim() ? "pointer" : "default",
          }}
        >Start with this</button>
      </div>
    </div>
  );
}

function BreakDownPanel({ task, onDivide, onBack }) {
  const MAX_STEPS = 5;
  const [parts, setParts] = useState(["", ""]);
  const inputRefs = useRef([]);
  useEffect(() => { setTimeout(() => inputRefs.current[0]?.focus(), 80); }, []);

  function update(i, v) { const next = [...parts]; next[i] = v; setParts(next); }
  function addStep() {
    if (parts.length >= MAX_STEPS) return;
    setParts([...parts, ""]);
    setTimeout(() => inputRefs.current[parts.length]?.focus(), 60);
  }
  function removeStep(i) { if (parts.length <= 2) return; setParts(parts.filter((_, idx) => idx !== i)); }

  const filled = parts.filter(p => p.trim()).length;
  const numerals = ["i", "ii", "iii", "iv", "v"];
  const placeholders = [
    "First — the smallest",
    "Then —",
    "After that —",
    "And —",
    "Finally —",
  ];

  function submit() {
    const filledParts = parts.filter(p => p.trim());
    if (filledParts.length < 2) return;
    onDivide(task, filledParts, { mode: "all" });
  }

  return (
    <div className="fade-in">
      {parts.map((val, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 0", borderBottom: "1px solid var(--rule)",
        }}>
          <span className="serif" style={{
            fontSize: 13, color: "var(--ink-faint)", fontStyle: "italic", width: 18,
          }}>{numerals[i]}.</span>
          <input
            ref={(el) => inputRefs.current[i] = el}
            className="paper-input"
            style={{borderBottom: "none", fontSize: 15, flex: 1}}
            placeholder={placeholders[i]}
            value={val}
            onChange={(e) => update(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (i < parts.length - 1) inputRefs.current[i+1]?.focus();
                else if (parts.length < MAX_STEPS && val.trim()) addStep();
                else submit();
              }
            }}
          />
          {parts.length > 2 && (
            <button
              onClick={() => removeStep(i)}
              style={{
                background: "transparent", border: "none",
                color: "var(--ink-faint)", fontSize: 18,
                cursor: "pointer", padding: "0 4px", lineHeight: 1,
              }}
              aria-label="Remove step"
            >×</button>
          )}
        </div>
      ))}

      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12}}>
        <button
          onClick={addStep}
          disabled={parts.length >= MAX_STEPS}
          style={{
            background: "transparent", border: "none",
            color: parts.length >= MAX_STEPS ? "var(--ink-faint)" : "var(--ink-soft)",
            fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
            cursor: parts.length >= MAX_STEPS ? "default" : "pointer", padding: 0,
          }}
        >+ another step</button>
        <span className="serif" style={{
          fontSize: 11, color: "var(--ink-faint)", fontStyle: "italic",
        }}>{parts.length} of {MAX_STEPS}</span>
      </div>

      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22}}>
        <button onClick={onBack} className="ghost-btn" style={{color: "var(--ink-faint)"}}>back</button>
        <button
          onClick={submit}
          disabled={filled < 2}
          style={{
            background: filled >= 2 ? "var(--ink)" : "var(--paper-deep)",
            color: filled >= 2 ? "var(--paper)" : "var(--ink-faint)",
            border: "none", borderRadius: 999, padding: "12px 22px",
            fontFamily: "var(--serif)", fontSize: 15,
            cursor: filled >= 2 ? "pointer" : "default",
          }}
        >Replace with steps</button>
      </div>
    </div>
  );
}

function SharePanel({ task, onPickedSystem, onPickedMock, onBack }) {
  // Mocked iOS-style share targets. The first one uses the real navigator.share
  // (via onPickedSystem) so the gesture has something tangible. Others are
  // visual stand-ins for "destination" choice.
  const targets = [
    { label: "Share…",     hint: "system share sheet",       glyph: "⤴",  action: onPickedSystem },
    { label: "Calendar",   hint: "schedule a time for it",   glyph: "▢",  action: onPickedMock },
    { label: "Messages",   hint: "send to someone",          glyph: "◌",  action: onPickedMock },
    { label: "Mail",       hint: "draft an email",           glyph: "✉",  action: onPickedMock },
    { label: "Reminders",  hint: "out of today, into later", glyph: "·",  action: onPickedMock },
  ];
  return (
    <div className="fade-in">
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 14,
        padding: "8px 0 18px",
      }}>
        {targets.map((t) => (
          <button
            key={t.label}
            onClick={t.action}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{
              width: 56, height: 56,
              borderRadius: 14,
              background: "var(--paper-deep)",
              border: "1px solid var(--rule)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--serif)",
              fontSize: 22,
              color: "var(--ink)",
            }}>{t.glyph}</div>
            <div className="serif" style={{
              fontSize: 11, color: "var(--ink-soft)", textAlign: "center",
              lineHeight: 1.2,
            }}>{t.label}</div>
          </button>
        ))}
      </div>

      <div className="serif" style={{
        fontSize: 12, color: "var(--ink-faint)", fontStyle: "italic",
        marginTop: 4, lineHeight: 1.55,
      }}>
        Sending it somewhere doesn't take it off the page — but a calendar slot or a quick text often unsticks the thing.
      </div>

      <div style={{display: "flex", justifyContent: "flex-start", marginTop: 22}}>
        <button onClick={onBack} className="ghost-btn" style={{color: "var(--ink-faint)"}}>back</button>
      </div>
    </div>
  );
}

// ---------- Divide Sheet ----------
function DivideSheet({ task, onClose, onDivide }) {
  const MAX_STEPS = 5;
  const [parts, setParts] = useState(["", ""]);
  const [firstIdx, setFirstIdx] = useState(0);
  const isDecision = task.mark === "?";
  // mode: "startOne" (only for ? tasks) or "all"
  const [mode, setMode] = useState(isDecision ? "startOne" : "all");
  const inputRefs = useRef([]);

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 80);
  }, []);

  function update(i, v) {
    const next = [...parts];
    next[i] = v;
    setParts(next);
  }

  function addStep() {
    if (parts.length >= MAX_STEPS) return;
    setParts([...parts, ""]);
    setTimeout(() => inputRefs.current[parts.length]?.focus(), 60);
  }

  function removeStep(i) {
    if (parts.length <= 2) return;
    setParts(parts.filter((_, idx) => idx !== i));
  }

  const filled = parts.filter(p => p.trim()).length;
  const numerals = ["i", "ii", "iii", "iv", "v"];
  const placeholders = [
    "First — the smallest",
    "Then —",
    "After that —",
    "And —",
    "Finally —",
  ];

  function submit() {
    const filledParts = parts.filter(p => p.trim());
    if (filledParts.length < (mode === "startOne" ? 1 : 2)) return;
    if (mode === "startOne") {
      // remap firstIdx into the filtered array
      const remappedFirst = parts.slice(0, firstIdx + 1).filter(p => p.trim()).length - 1;
      onDivide(task, filledParts, { mode: "startOne", firstIdx: Math.max(0, remappedFirst) });
    } else {
      onDivide(task, filledParts, { mode: "all" });
    }
    onClose();
  }

  const subtitle = isDecision
    ? "Three days have lived here. What small thing inside it could you start with?"
    : "What small steps live inside this?";

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}/>
      <div className="sheet" style={{paddingBottom: 28, maxHeight: "78%", overflowY: "auto"}}>
        <div className="kicker" style={{marginBottom: 8}}>divide & conquer</div>
        <div className="serif" style={{fontSize: 19, color: "var(--ink)", lineHeight: 1.4, marginBottom: 4}}>
          {task.text}
        </div>
        <div className="serif" style={{
          fontSize: 13, color: "var(--ink-soft)", fontStyle: "italic", marginBottom: 18,
        }}>{subtitle}</div>

        {isDecision && (
          <div style={{
            display: "flex", gap: 0, marginBottom: 18,
            border: "1px solid var(--rule-strong)", borderRadius: 12,
            overflow: "hidden",
          }}>
            <button
              onClick={() => setMode("startOne")}
              style={{
                flex: 1, background: mode === "startOne" ? "var(--ink)" : "transparent",
                color: mode === "startOne" ? "var(--paper)" : "var(--ink-soft)",
                border: "none", padding: "10px 12px",
                fontFamily: "var(--serif)", fontSize: 13,
                cursor: "pointer", textAlign: "center", lineHeight: 1.3,
              }}
            >
              <div style={{fontStyle: "italic"}}>start with one</div>
              <div style={{fontSize: 10, opacity: 0.75, marginTop: 2, fontStyle: "normal", letterSpacing: "0.04em"}}>
                pick the smallest. now.
              </div>
            </button>
            <button
              onClick={() => setMode("all")}
              style={{
                flex: 1, background: mode === "all" ? "var(--ink)" : "transparent",
                color: mode === "all" ? "var(--paper)" : "var(--ink-soft)",
                border: "none", padding: "10px 12px",
                fontFamily: "var(--serif)", fontSize: 13,
                cursor: "pointer", textAlign: "center", lineHeight: 1.3,
                borderLeft: "1px solid var(--rule-strong)",
              }}
            >
              <div style={{fontStyle: "italic"}}>break it down</div>
              <div style={{fontSize: 10, opacity: 0.75, marginTop: 2, fontStyle: "normal", letterSpacing: "0.04em"}}>
                think later. all at once.
              </div>
            </button>
          </div>
        )}

        {isDecision && mode === "startOne" && (
          <div className="serif" style={{
            fontSize: 12, color: "var(--ink-faint)", fontStyle: "italic",
            marginBottom: 10, lineHeight: 1.5,
          }}>
            Tap the circle next to the one you can do <em>now</em>. The rest will rest, gently — you'll come back when you're ready.
          </div>
        )}

        {parts.map((val, i) => {
          const isFirst = mode === "startOne" && firstIdx === i;
          return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 0", borderBottom: "1px solid var(--rule)",
            background: isFirst ? "rgba(0,0,0,0.02)" : "transparent",
            marginLeft: isFirst ? -8 : 0, marginRight: isFirst ? -8 : 0,
            paddingLeft: isFirst ? 8 : 0, paddingRight: isFirst ? 8 : 0,
            borderRadius: isFirst ? 6 : 0,
            transition: "background 200ms",
          }}>
            {mode === "startOne" ? (
              <button
                onClick={() => setFirstIdx(i)}
                aria-label="Start with this step"
                style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: `1.5px solid ${isFirst ? "var(--ink)" : "var(--rule-strong)"}`,
                  background: "transparent", padding: 0, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isFirst && <span style={{
                  width: 8, height: 8, borderRadius: "50%", background: "var(--ink)",
                }}/>}
              </button>
            ) : (
              <span className="serif" style={{
                fontSize: 13, color: "var(--ink-faint)", fontStyle: "italic", width: 18,
              }}>{numerals[i]}.</span>
            )}
            <input
              ref={(el) => inputRefs.current[i] = el}
              className="paper-input"
              style={{
                borderBottom: "none", fontSize: 15, flex: 1,
                fontStyle: isFirst ? "italic" : "normal",
              }}
              placeholder={mode === "startOne" && i === 0 ? "The smallest first step…" : placeholders[i]}
              value={val}
              onChange={(e) => update(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (i < parts.length - 1) inputRefs.current[i+1]?.focus();
                  else if (parts.length < MAX_STEPS && val.trim()) addStep();
                  else submit();
                }
              }}
            />
            {parts.length > 2 && (
              <button
                onClick={() => removeStep(i)}
                style={{
                  background: "transparent", border: "none",
                  color: "var(--ink-faint)", fontSize: 18,
                  cursor: "pointer", padding: "0 4px", lineHeight: 1,
                }}
                aria-label="Remove step"
              >×</button>
            )}
          </div>
          );
        })}

        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12}}>
          <button
            onClick={addStep}
            disabled={parts.length >= MAX_STEPS}
            style={{
              background: "transparent", border: "none",
              color: parts.length >= MAX_STEPS ? "var(--ink-faint)" : "var(--ink-soft)",
              fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
              cursor: parts.length >= MAX_STEPS ? "default" : "pointer", padding: 0,
            }}
          >
            + another step
          </button>
          <span className="serif" style={{
            fontSize: 11, color: "var(--ink-faint)", fontStyle: "italic",
          }}>
            {parts.length} of {MAX_STEPS}
          </span>
        </div>

        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24}}>
          <button onClick={onClose} className="ghost-btn" style={{color: "var(--ink-faint)"}}>not yet</button>
          <button
            onClick={submit}
            disabled={mode === "startOne" ? filled < 1 : filled < 2}
            style={{
              background: (mode === "startOne" ? filled >= 1 : filled >= 2) ? "var(--ink)" : "var(--paper-deep)",
              color: (mode === "startOne" ? filled >= 1 : filled >= 2) ? "var(--paper)" : "var(--ink-faint)",
              border: "none", borderRadius: 999, padding: "12px 22px",
              fontFamily: "var(--serif)", fontSize: 15,
              cursor: (mode === "startOne" ? filled >= 1 : filled >= 2) ? "pointer" : "default",
            }}
          >
            {mode === "startOne" ? "Start with this one" : "Replace with steps"}
          </button>
        </div>
      </div>
    </>
  );
}

// ---------- Carry Forward (new day rollover) ----------
function CarryForward({ leftovers, prevDateStr, onComplete }) {
  // leftovers: array of unfinished tasks from yesterday
  // user goes thru them one at a time: keep / let go / later
  const [i, setI] = useState(0);
  const [decisions, setDecisions] = useState([]); // {task, action: 'keep'|'release'|'later'}

  const total = leftovers.length;
  const done = i >= total;
  const current = leftovers[i];

  function decide(action) {
    const next = [...decisions, { task: current, action }];
    setDecisions(next);
    if (i + 1 >= total) {
      // finalize after a beat
      setTimeout(() => onComplete(next), 360);
    }
    setI(i + 1);
  }

  if (done) {
    const kept = decisions.filter(d => d.action === "keep").length;
    const released = decisions.filter(d => d.action === "release").length;
    const later = decisions.filter(d => d.action === "later").length;
    return (
      <div className="screen fade-soft" style={{justifyContent: "center", padding: "0 36px", textAlign: "center"}}>
        <div className="kicker ascend" style={{marginBottom: 16}}>thank you</div>
        <div className="serif ascend" style={{fontSize: 26, color: "var(--ink)", lineHeight: 1.4, animationDelay: "120ms"}}>
          {kept > 0 && <>You're bringing <em style={{fontStyle: "italic"}}>{kept}</em> with you.<br/></>}
          {later > 0 && <span style={{color: "var(--ink-soft)"}}>{later} {later === 1 ? "is" : "are"} resting for now.<br/></span>}
          {released > 0 && <span style={{color: "var(--ink-soft)"}}>And you let <em style={{fontStyle: "italic"}}>{released}</em> go — that's good.</span>}
          {kept === 0 && released === 0 && later === 0 && <span style={{color: "var(--ink-soft)"}}>The page is clear.</span>}
        </div>
        <div className="serif ascend" style={{fontSize: 15, color: "var(--ink-faint)", marginTop: 24, fontStyle: "italic", animationDelay: "280ms"}}>
          Begin where you are.
        </div>
      </div>
    );
  }

  // currentMark: how it appears on yesterday's page
  const isFirstCarry = !current.mark;
  const isCarriedOnce = current.mark === ">";
  const isCarriedTwice = current.mark === ">>";
  const isAtDecision = current.mark === "?"; // 4th day carry — auto-shelve path
  // What it would become if kept:
  const nextMark = isFirstCarry ? ">" : isCarriedOnce ? ">>" : isCarriedTwice ? "?" : "shelf";
  const nextLabel = isFirstCarry
    ? "bring it to today"
    : isCarriedOnce
    ? "yes, carry it again"
    : isCarriedTwice
    ? "keep it — and decide"
    : "set it gently down";

  return (
    <div className="screen fade-soft" style={{padding: "20px 0 30px", display: "flex", flexDirection: "column"}}>
      {/* Header */}
      <div style={{padding: "12px 28px 18px"}}>
        <div className="kicker" style={{marginBottom: 6}}>now, gently</div>
        <div className="serif" style={{fontSize: 22, color: "var(--ink)", lineHeight: 1.35}}>
          A few things from <span style={{fontStyle: "italic", color: "var(--ink-soft)"}}>{prevDateStr}</span> are still here. Let's look at them together.
        </div>
        <div className="serif" style={{fontSize: 13, color: "var(--ink-faint)", marginTop: 10, fontStyle: "italic"}}>
          One at a time. {i + 1} of {total}. No rush.
        </div>
      </div>

      {/* Progress dots */}
      <div style={{display: "flex", gap: 6, padding: "0 28px 18px"}}>
        {leftovers.map((_, idx) => (
          <div key={idx} style={{
            flex: 1,
            height: 2,
            background: idx < i ? "var(--ink)" : idx === i ? "var(--ink-soft)" : "var(--rule-strong)",
            transition: "background 280ms ease",
          }}/>
        ))}
      </div>

      {/* Current task card */}
      <div key={current.id} className="ascend" style={{
        flex: 1,
        margin: "0 28px",
        padding: "28px 24px",
        borderTop: "1px solid var(--rule-strong)",
        borderBottom: "1px solid var(--rule-strong)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 18,
      }}>
        {/* yesterday's mark visualization */}
        <div style={{display: "flex", alignItems: "baseline", gap: 12}}>
          <div style={{
            width: 22,
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: 22,
            color: isCarriedTwice ? "var(--mark)" : "var(--ink-faint)",
            fontWeight: 500,
          }}>
            {isCarriedOnce ? "›" : isCarriedTwice ? "››" : ""}
          </div>
          <div style={{flex: 1}}>
            <div className="kicker" style={{marginBottom: 6, fontSize: 10}}>
              {isFirstCarry ? "from yesterday" : isCarriedOnce ? "this is its second day" : isCarriedTwice ? "this has been here three days" : "this has been with you a while"}
            </div>
            <div className="serif" style={{fontSize: 22, color: "var(--ink)", lineHeight: 1.35}}>
              {current.text}
            </div>
            {current.tenMin && (
              <div style={{
                marginTop: 8,
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 13,
                color: "var(--ink-soft)",
              }}>
                — 10 min: {current.tenMin}
              </div>
            )}
          </div>
        </div>

        {/* What it becomes if kept */}
        {!isFirstCarry && (
          <div style={{
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: 13,
            color: "var(--mark)",
            opacity: 0.85,
            lineHeight: 1.5,
          }}>
            {isCarriedOnce
              ? "If you bring this again, it'll wear a ››. That's okay — it just means there's friction here."
              : isCarriedTwice
              ? "It's been three days. Carrying it makes it a ? — a moment to decide or divide. No pressure."
              : "Some things keep showing up because they're hard. That's allowed. We can set this on a quiet shelf and come back when you're ready."}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{padding: "20px 28px 0", display: "flex", flexDirection: "column", gap: 10}}>
        <button
          onClick={() => decide("keep")}
          style={{
            background: "var(--ink)",
            color: "var(--paper)",
            border: "none",
            borderRadius: 14,
            padding: "14px 18px",
            fontFamily: "var(--serif)",
            fontSize: 15,
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{nextLabel}</span>
          <span style={{
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: 16,
            opacity: 0.7,
          }}>
            {isAtDecision ? "◦" : nextMark === "?" ? "?" : nextMark === ">>" ? "››" : "›"}
          </span>
        </button>
        <div style={{display: "flex", gap: 10}}>
          <button
            onClick={() => decide("later")}
            style={{
              flex: 1,
              background: "transparent",
              color: "var(--ink)",
              border: "1px solid var(--rule-strong)",
              borderRadius: 14,
              padding: "13px 14px",
              fontFamily: "var(--serif)",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            rest for now
          </button>
          <button
            onClick={() => decide("release")}
            style={{
              flex: 1,
              background: "transparent",
              color: "var(--ink-soft)",
              border: "1px solid var(--rule-strong)",
              borderRadius: 14,
              padding: "13px 14px",
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            release it
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Set Down Sheet (reflective prompt) ----------
function SetDownSheet({ task, onClose, onConfirm }) {
  const [tag, setTag] = useState(null);
  const [note, setNote] = useState("");

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}/>
      <div className="sheet" style={{paddingBottom: 28, maxHeight: "82%", overflowY: "auto"}}>
        <div className="kicker" style={{marginBottom: 8}}>set it down</div>
        <div className="serif" style={{
          fontSize: 21, color: "var(--ink)", lineHeight: 1.4, marginBottom: 6,
        }}>
          {task.text}
        </div>
        <div className="serif" style={{
          fontSize: 14, color: "var(--ink-soft)", fontStyle: "italic",
          marginBottom: 18, lineHeight: 1.55,
        }}>
          This has been with you a while. That's okay. Some things are hard. Let's set it on a quiet shelf — you'll come back when you have space.
        </div>

        <div className="kicker" style={{marginBottom: 10, fontSize: 10}}>
          if you want — what's keeping it here?
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14,
        }}>
          {REASON_TAGS.map(r => (
            <button key={r.key} onClick={() => setTag(tag === r.key ? null : r.key)} style={{
              textAlign: "left",
              background: tag === r.key ? "var(--ink)" : "transparent",
              color: tag === r.key ? "var(--paper)" : "var(--ink)",
              border: `1px solid ${tag === r.key ? "var(--ink)" : "var(--rule-strong)"}`,
              borderRadius: 10, padding: "10px 12px",
              fontFamily: "var(--serif)", fontSize: 13, lineHeight: 1.3,
              cursor: "pointer",
            }}>
              <div style={{fontStyle: "italic"}}>{r.label}</div>
              <div style={{
                fontSize: 10, opacity: tag === r.key ? 0.75 : 0.55, marginTop: 2,
                fontStyle: "normal", letterSpacing: "0.03em",
              }}>{r.sub}</div>
            </button>
          ))}
        </div>

        <div className="kicker" style={{marginBottom: 6, fontSize: 10}}>
          or in your own words — anything you want to remember
        </div>
        <input
          className="paper-input serif"
          style={{fontSize: 15, fontStyle: "italic", fontFamily: "var(--serif)"}}
          placeholder="optional…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="serif" style={{
          fontSize: 12, color: "var(--ink-faint)", fontStyle: "italic",
          marginTop: 14, lineHeight: 1.5,
        }}>
          Both fields are optional. You can just set it down.
        </div>

        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22}}>
          <button onClick={onClose} className="ghost-btn" style={{color: "var(--ink-faint)"}}>not yet</button>
          <button
            onClick={() => onConfirm({ reasonTag: tag, reasonNote: note.trim() || null })}
            style={{
              background: "var(--ink)", color: "var(--paper)",
              border: "none", borderRadius: 999, padding: "12px 22px",
              fontFamily: "var(--serif)", fontSize: 15, cursor: "pointer",
            }}
          >
            Set it down
          </button>
        </div>
      </div>
    </>
  );
}

// ---------- Reframe Sheet ----------
function ReframeSheet({ item, onClose, onConfirm }) {
  const [text, setText] = useState(item.text);
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}/>
      <div className="sheet">
        <div className="kicker" style={{marginBottom: 6}}>reframe</div>
        <div className="serif" style={{
          fontSize: 18, color: "var(--ink-soft)", lineHeight: 1.4, marginBottom: 6,
          fontStyle: "italic",
        }}>
          “{item.text}”
        </div>
        <div className="serif" style={{
          fontSize: 14, color: "var(--ink-soft)", fontStyle: "italic",
          marginBottom: 14, lineHeight: 1.5,
        }}>
          Sometimes the words on the page aren't quite right. What was this <em>actually</em> about?
        </div>
        <input
          className="paper-input serif"
          style={{fontSize: 17, fontFamily: "var(--serif)"}}
          placeholder="this was actually about…"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) onConfirm(text.trim()); }}
        />
        <div style={{display: "flex", justifyContent: "space-between", marginTop: 22}}>
          <button onClick={onClose} className="ghost-btn" style={{color: "var(--ink-faint)"}}>cancel</button>
          <button
            onClick={() => text.trim() && onConfirm(text.trim())}
            style={{
              background: "var(--ink)", color: "var(--paper)",
              border: "none", borderRadius: 999, padding: "12px 22px",
              fontFamily: "var(--serif)", fontSize: 15, cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}

// ---------- Waiting On Sheet ----------
function WaitingOnSheet({ item, onClose, onConfirm }) {
  const [text, setText] = useState(item.waitingOn || "");
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}/>
      <div className="sheet">
        <div className="kicker" style={{marginBottom: 6}}>waiting on</div>
        <div className="serif" style={{
          fontSize: 14, color: "var(--ink-soft)", fontStyle: "italic",
          marginBottom: 14, lineHeight: 1.5,
        }}>
          Sometimes things stay because they're outside your hands. Naming it can help — both of you can rest.
        </div>
        <input
          className="paper-input serif"
          style={{fontSize: 16, fontFamily: "var(--serif)", fontStyle: "italic"}}
          placeholder="…a person, a date, a decision"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onConfirm(text.trim() || null); }}
        />
        <div style={{display: "flex", justifyContent: "space-between", marginTop: 22}}>
          <button onClick={onClose} className="ghost-btn" style={{color: "var(--ink-faint)"}}>cancel</button>
          <button
            onClick={() => onConfirm(text.trim() || null)}
            style={{
              background: "var(--ink)", color: "var(--paper)",
              border: "none", borderRadius: 999, padding: "12px 22px",
              fontFamily: "var(--serif)", fontSize: 15, cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}

// ---------- Re-Offer Card (gentle invitation back) ----------
function ReOfferCard({ item, recentDone, onAccept, onLater, onRest }) {
  const list = recentDone.slice(0, 3);
  const recap = list.length === 0
    ? "You've been moving."
    : list.length === 1
    ? `You finished “${list[0]}.”`
    : list.length === 2
    ? `You finished “${list[0]}” and “${list[1]}.”`
    : `You finished “${list[0]},” “${list[1]},” and “${list[2]}.”`;
  return (
    <div className="fade-in" style={{
      margin: "14px 22px 6px",
      background: "var(--paper-deep)",
      border: "1px solid var(--rule-strong)",
      borderRadius: 12,
      padding: "16px 18px",
      position: "relative",
    }}>
      <div className="kicker" style={{marginBottom: 6, color: "var(--accent)"}}>
        a small offering
      </div>
      <div className="serif" style={{
        fontSize: 16, color: "var(--ink)", lineHeight: 1.5, marginBottom: 8,
      }}>
        {recap} You're moving.
      </div>
      <div className="serif" style={{
        fontSize: 15, color: "var(--ink-soft)", fontStyle: "italic",
        lineHeight: 1.5, marginBottom: 14,
      }}>
        Would <span style={{color: "var(--ink)"}}>“{item.text}”</span> like to come back into the day? Only if it feels right.
      </div>
      <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
        <button onClick={onAccept} style={{
          background: "var(--ink)", color: "var(--paper)", border: "none",
          borderRadius: 999, padding: "8px 14px",
          fontFamily: "var(--serif)", fontSize: 13, cursor: "pointer",
        }}>yes — bring it back</button>
        <button onClick={onLater} style={{
          background: "transparent", border: "1px solid var(--rule-strong)",
          borderRadius: 999, padding: "8px 14px",
          fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
          color: "var(--ink-soft)", cursor: "pointer",
        }}>not yet</button>
        <button onClick={onRest} style={{
          background: "transparent", border: "none",
          padding: "8px 4px",
          fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 12,
          color: "var(--ink-faint)", cursor: "pointer",
        }}>let it keep resting</button>
      </div>
    </div>
  );
}

// ---------- Key / Reference ----------
function KeyReference({ onClose }) {
  const items = [
    { glyph: "□", label: "An open task", note: "Tap to mark done." },
    { glyph: "›", label: "Carried once", note: "Left from yesterday." },
    { glyph: "››", label: "Carried twice", note: "Friction is gathering. There is a 10-min version waiting.", strong: true },
    { glyph: "?", label: "Decision point", note: "Three days. Time to divide it or move it off the page.", strong: true },
    { glyph: "◦", label: "On the desk", note: "Set down gently. Resting until you have space again." },
    { glyph: "✓", label: "Done", note: "Quietly noted." },
  ];
  const actions = [
    { name: "Tap a row", note: "Reveals note / desk / trash." },
    { name: "Drawer", note: "Tuck a note away. Out of sight, kept for later." },
    { name: "Divide", note: "Break a task into 2–5 small steps." },
    { name: "+ a win", note: "Log an unseen win — \"I started\", \"I stayed calm\"." },
    { name: "next day", note: "Carry forward unfinished things, one at a time." },
  ];
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}/>
      <div className="sheet" style={{maxHeight: "82%", overflowY: "auto"}}>
        <div className="kicker" style={{marginBottom: 6}}>the key</div>
        <div className="serif" style={{
          fontSize: 22, color: "var(--ink)", marginBottom: 4,
        }}>What the marks mean.</div>
        <div className="serif" style={{
          fontSize: 13, color: "var(--ink-soft)", fontStyle: "italic", marginBottom: 18,
        }}>From the pocket notebook, into the page.</div>

        {items.map((it) => (
          <div key={it.label} style={{
            display: "flex", gap: 14, padding: "10px 0",
            borderBottom: "1px solid var(--rule)",
          }}>
            <div style={{
              width: 28, fontFamily: "var(--serif)", fontStyle: "italic",
              fontSize: 18, fontWeight: 500, color: it.strong ? "var(--mark)" : "var(--ink)",
              lineHeight: 1.2,
            }}>{it.glyph}</div>
            <div style={{flex: 1}}>
              <div className="serif" style={{fontSize: 15, color: "var(--ink)"}}>{it.label}</div>
              <div className="serif" style={{
                fontSize: 12, color: "var(--ink-soft)", fontStyle: "italic", marginTop: 2,
              }}>{it.note}</div>
            </div>
          </div>
        ))}

        <div className="kicker" style={{marginTop: 22, marginBottom: 8}}>actions</div>
        {actions.map((a) => (
          <div key={a.name} style={{
            padding: "8px 0", borderBottom: "1px solid var(--rule)",
          }}>
            <div className="serif" style={{fontSize: 14, color: "var(--ink)"}}>{a.name}</div>
            <div className="serif" style={{
              fontSize: 12, color: "var(--ink-soft)", fontStyle: "italic", marginTop: 2,
            }}>{a.note}</div>
          </div>
        ))}

        <div style={{display: "flex", justifyContent: "flex-end", marginTop: 22}}>
          <button onClick={onClose} className="ghost-btn">close</button>
        </div>
      </div>
    </>
  );
}

// ---------- Recap (end-of-day celebration before carry-forward) ----------
function Recap({ recap, onContinue }) {
  const { wins, completed, leftovers, prevDateStr } = recap;
  const [phase, setPhase] = useState(0); // 0=wins, 1=done, 2=transition

  const hasWins = wins.length > 0;
  const hasDone = completed.length > 0;
  const hasLeftovers = leftovers.length > 0;

  // The opening greeting depends on what there is to celebrate
  let opening;
  if (hasWins && hasDone) {
    opening = "Before we turn the page — look at this.";
  } else if (hasWins) {
    opening = "Before we turn the page — these matter.";
  } else if (hasDone) {
    opening = "Before we turn the page — look what you finished.";
  } else {
    opening = "Before we turn the page —";
  }

  // Phase 0: wins  |  Phase 1: completed tasks  |  Phase 2: bridge to carry/anchor
  if (phase === 0 && hasWins) {
    return (
      <div className="screen fade-soft" style={{padding: "44px 32px 32px", justifyContent: "space-between"}}>
        <div>
          <div className="kicker ascend" style={{marginBottom: 16}}>{prevDateStr}</div>
          <div className="serif ascend" style={{
            fontSize: 22, color: "var(--ink)", lineHeight: 1.4, marginBottom: 24,
            animationDelay: "100ms",
          }}>
            {opening}
          </div>

          <div className="kicker ascend" style={{
            marginBottom: 14, animationDelay: "240ms",
          }}>your unseen wins</div>

          <div style={{display: "flex", flexDirection: "column", gap: 10}}>
            {wins.map((w, i) => (
              <div key={i} className="ascend" style={{
                display: "flex", gap: 12, alignItems: "baseline",
                paddingBottom: 10, borderBottom: "1px solid var(--rule)",
                animationDelay: `${360 + i * 110}ms`,
              }}>
                <span style={{
                  fontFamily: "var(--serif)", fontStyle: "italic",
                  fontSize: 14, color: "var(--accent)",
                  flexShrink: 0,
                }}>✦</span>
                <span className="serif" style={{
                  fontSize: 17, color: "var(--ink)", lineHeight: 1.4,
                }}>{w}</span>
              </div>
            ))}
          </div>

          <div className="serif ascend" style={{
            fontSize: 15, color: "var(--ink-soft)", fontStyle: "italic",
            marginTop: 22, lineHeight: 1.5,
            animationDelay: `${360 + wins.length * 110 + 120}ms`,
          }}>
            These count. Even when nothing else does.
          </div>
        </div>

        <button onClick={() => setPhase(hasDone ? 1 : 2)} style={{
          background: "var(--ink)", color: "var(--paper)", border: "none",
          borderRadius: 999, padding: "14px 24px",
          fontFamily: "var(--serif)", fontSize: 15, cursor: "pointer",
          alignSelf: "flex-end",
        }}>
          {hasDone ? "And what you finished →" : hasLeftovers ? "Now, the things still here →" : "Begin a new page →"}
        </button>
      </div>
    );
  }

  // Phase 0 fallback when no wins
  if (phase === 0 && !hasWins) {
    if (hasDone) { setPhase(1); return null; }
    setPhase(2); return null;
  }

  if (phase === 1) {
    return (
      <div className="screen fade-soft" style={{padding: "44px 32px 32px", justifyContent: "space-between"}}>
        <div>
          <div className="kicker ascend" style={{marginBottom: 16}}>{prevDateStr}</div>
          <div className="serif ascend" style={{
            fontSize: 22, color: "var(--ink)", lineHeight: 1.4, marginBottom: 24,
            animationDelay: "100ms",
          }}>
            {hasWins ? "And —" : "Before we turn the page —"} you finished {completed.length === 1 ? "this" : "these"}.
          </div>

          <div className="kicker ascend" style={{marginBottom: 14, animationDelay: "240ms"}}>done</div>

          <div style={{display: "flex", flexDirection: "column", gap: 6}}>
            {completed.map((t, i) => (
              <div key={t.id} className="ascend" style={{
                display: "flex", gap: 12, alignItems: "baseline",
                paddingBottom: 10, borderBottom: "1px solid var(--rule)",
                animationDelay: `${360 + i * 80}ms`,
              }}>
                <span style={{
                  width: 18, height: 18, marginTop: 2,
                  background: "var(--ink)", borderRadius: 2,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{
                    width: 6, height: 11, marginTop: -2,
                    borderRight: "1.5px solid var(--paper)",
                    borderBottom: "1.5px solid var(--paper)",
                    transform: "rotate(45deg)",
                  }}/>
                </span>
                <span className="task-text sans" style={{
                  fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.4,
                  textDecoration: "line-through",
                  textDecorationColor: "var(--ink-faint)",
                }}>{t.text}</span>
              </div>
            ))}
          </div>

          <div className="serif ascend" style={{
            fontSize: 15, color: "var(--ink-soft)", fontStyle: "italic",
            marginTop: 22, lineHeight: 1.5,
            animationDelay: `${360 + completed.length * 80 + 120}ms`,
          }}>
            {completed.length === 1
              ? "One real thing. That's a day."
              : `${completed.length} real things. That's a day worth having.`}
          </div>
        </div>

        <button onClick={() => setPhase(2)} style={{
          background: "var(--ink)", color: "var(--paper)", border: "none",
          borderRadius: 999, padding: "14px 24px",
          fontFamily: "var(--serif)", fontSize: 15, cursor: "pointer",
          alignSelf: "flex-end",
        }}>
          {hasLeftovers ? "Now, what's still here →" : "Begin a new page →"}
        </button>
      </div>
    );
  }

  // Phase 2 — bridge into carry forward (or straight into anchor if nothing left)
  return (
    <div className="screen fade-soft" style={{padding: "0 36px", justifyContent: "center", textAlign: "center"}}>
      <div className="kicker ascend" style={{marginBottom: 16}}>a new day</div>
      <div className="serif ascend" style={{
        fontSize: 24, color: "var(--ink)", lineHeight: 1.4,
        animationDelay: "120ms", marginBottom: 16,
      }}>
        {hasLeftovers
          ? <>A few things didn't get to you.<br/><span style={{color: "var(--ink-soft)"}}>That's okay. Let's decide together.</span></>
          : <>The page is fresh.<br/><span style={{color: "var(--ink-soft)"}}>Nothing carried.</span></>
        }
      </div>
      <div className="serif ascend" style={{
        fontSize: 15, color: "var(--ink-faint)", fontStyle: "italic",
        animationDelay: "280ms", marginBottom: 36, lineHeight: 1.5,
      }}>
        {hasLeftovers
          ? "We'll go one at a time. Some come with you, some can rest, some can go."
          : "Begin where you are."}
      </div>
      <button onClick={onContinue} className="ascend" style={{
        background: "var(--ink)", color: "var(--paper)", border: "none",
        borderRadius: 999, padding: "14px 26px",
        fontFamily: "var(--serif)", fontSize: 16, cursor: "pointer",
        alignSelf: "center", animationDelay: "440ms",
      }}>
        {hasLeftovers ? "Look at them with me" : "Open today's page"}
      </button>
    </div>
  );
}

// ---------- Desk Postit (shelf item) ----------
function DeskShelfPostit({ item, index, isInDrawer, onBringBack, onReframe, onWaiting, onToggleDrawer, onRelease }) {
  const [expanded, setExpanded] = useState(false);
  const reasonLabel = item.reasonTag ? reasonLabelFor(item.reasonTag) : null;
  return (
    <div className="fade-in" style={{
      background: "var(--paper)",
      border: "1px solid var(--rule-strong)",
      borderRadius: 4,
      padding: "10px 12px 10px",
      animationDelay: `${index * 30}ms`,
      transform: `rotate(${index % 2 === 0 ? -0.4 : 0.5}deg)`,
      display: "flex", flexDirection: "column", gap: 6,
      minHeight: 130,
      boxShadow: "0 1px 0 var(--rule), 0 2px 6px -2px rgba(0,0,0,0.06)",
      position: "relative",
    }}>
      <button onClick={onToggleDrawer} title={isInDrawer ? "place on desk" : "place in drawer"} style={{
        position: "absolute", top: 4, right: 4,
        width: 26, height: 26, padding: 0,
        background: "transparent", border: "none", cursor: "pointer",
        color: "var(--ink-faint)", fontSize: 14, lineHeight: 1,
        borderRadius: 4,
        fontFamily: "var(--serif)",
      }}>{isInDrawer ? "↑" : "↓"}</button>
      <div className="kicker" style={{fontSize: 9, color: "var(--ink-faint)", paddingRight: 22}}>
        set down · {item.shelvedOn}
      </div>
      <div className="serif" style={{
        fontSize: 13, color: "var(--ink)", lineHeight: 1.35, flex: 1,
      }}>
        {item.text}
      </div>
      {reasonLabel && !expanded && (
        <div className="serif" style={{fontSize: 10, color: "var(--ink-faint)", fontStyle: "italic"}}>
          {reasonLabel}
        </div>
      )}
      {item.waitingOn && !expanded && (
        <div className="serif" style={{fontSize: 10, color: "var(--accent)", fontStyle: "italic"}}>
          ⟶ waiting on {item.waitingOn}
        </div>
      )}
      {!expanded ? (
        <div style={{display: "flex", gap: 6, marginTop: 2}}>
          <button onClick={onBringBack} style={{
            flex: 1, background: "var(--ink)", color: "var(--paper)", border: "none",
            borderRadius: 999, padding: "5px 8px",
            fontFamily: "var(--serif)", fontSize: 11, cursor: "pointer",
          }}>bring back</button>
          <button onClick={() => setExpanded(true)} style={{
            background: "transparent", border: "1px solid var(--rule-strong)",
            borderRadius: 999, padding: "5px 10px",
            fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 11,
            color: "var(--ink-soft)", cursor: "pointer",
          }}>more</button>
        </div>
      ) : (
        <div className="fade-in" style={{
          display: "flex", flexDirection: "column", gap: 4, marginTop: 2,
          paddingTop: 6, borderTop: "1px dashed var(--rule)",
        }}>
          <button onClick={onBringBack} className="ghost-btn" style={{
            fontSize: 11, fontStyle: "italic", padding: "3px 0", color: "var(--ink)", textAlign: "left",
          }}>→ bring to now</button>
          <button onClick={onReframe} className="ghost-btn" style={{
            fontSize: 11, fontStyle: "italic", padding: "3px 0", color: "var(--ink-soft)", textAlign: "left",
          }}>reframe</button>
          <button onClick={onWaiting} className="ghost-btn" style={{
            fontSize: 11, fontStyle: "italic", padding: "3px 0", color: "var(--ink-soft)", textAlign: "left",
          }}>{item.waitingOn ? "change waiting" : "mark waiting"}</button>
          <button onClick={onRelease} className="ghost-btn" style={{
            fontSize: 11, fontStyle: "italic", padding: "3px 0", color: "var(--mark)", textAlign: "left",
          }}>toss in trash can</button>
          <button onClick={() => setExpanded(false)} className="ghost-btn" style={{
            fontSize: 10, fontStyle: "italic", padding: "3px 0", color: "var(--ink-faint)", textAlign: "left",
          }}>fewer</button>
        </div>
      )}
    </div>
  );
}

function DeskNotePostit({ note, index, isInDrawer, decideOpen, onDecide, onCloseDecide, onBringToNow, onToggleDrawer, onDelete }) {
  return (
    <div className="fade-in" style={{
      background: "var(--paper-deep)",
      border: "1px solid var(--rule)",
      borderRadius: 4,
      padding: "12px 12px 10px",
      minHeight: 130,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      transform: `rotate(${index % 2 === 0 ? -0.4 : 0.5}deg)`,
      animationDelay: `${index * 30}ms`,
      position: "relative",
    }}>
      <button onClick={onToggleDrawer} title={isInDrawer ? "place on desk" : "place in drawer"} style={{
        position: "absolute", top: 4, right: 4,
        width: 26, height: 26, padding: 0,
        background: "transparent", border: "none", cursor: "pointer",
        color: "var(--ink-faint)", fontSize: 14, lineHeight: 1,
        borderRadius: 4,
        fontFamily: "var(--serif)",
      }}>{isInDrawer ? "↑" : "↓"}</button>
      <div className="serif" style={{
        fontSize: 13, color: "var(--ink)", lineHeight: 1.35, flex: 1, paddingRight: 22,
      }}>{note.text}</div>
      <div className="serif" style={{
        fontSize: 10, color: "var(--ink-faint)", fontStyle: "italic",
      }}>
        {note.savedOn || "kept aside"}
      </div>
      {decideOpen ? (
        <div className="fade-in" style={{
          display: "flex", flexDirection: "column", gap: 4, marginTop: 2,
          paddingTop: 6, borderTop: "1px dashed var(--rule)",
        }}>
          <button onClick={onBringToNow} className="ghost-btn" style={{
            fontSize: 11, fontStyle: "italic", padding: "3px 0", color: "var(--ink)", textAlign: "left",
          }}>→ bring to now</button>
          <button onClick={onDelete} className="ghost-btn" style={{
            fontSize: 11, fontStyle: "italic", padding: "3px 0", color: "var(--mark)", textAlign: "left",
          }}>toss in trash can</button>
          <button onClick={onCloseDecide} className="ghost-btn" style={{
            fontSize: 10, fontStyle: "italic", padding: "3px 0", color: "var(--ink-faint)", textAlign: "left",
          }}>keep keeping</button>
        </div>
      ) : (
        <div style={{display: "flex", gap: 6, marginTop: 2}}>
          <button onClick={onDecide} style={{
            flex: 1, background: "transparent", border: "1px solid var(--rule-strong)",
            borderRadius: 999, padding: "5px 8px",
            fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 11,
            color: "var(--ink)", cursor: "pointer",
          }}>decide</button>
        </div>
      )}
    </div>
  );
}

// ---------- The Desk (worth-considering on top, drawer below) ----------
function DeskPage({
  shelf, notes,
  onBringBack, onOpenShelfSheet, onReleaseShelf,
  onRestoreNote, onDeleteNote,
  onSetShelfInDrawer, onSetNoteInDrawer,
  onAddOpen,
  trashCount, onOpenTrash,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [decideFor, setDecideFor] = useState(null);

  // Position driven by the per-item `inDrawer` flag — explicit top-vs-back,
  // toggled by the corner arrow on each card. Until the real unified-priority
  // score lands, recency wins within each zone (shelf items above bare notes,
  // newest-first within each kind).
  const tagged = [
    ...shelf.map(s => ({ kind: "shelf", id: `s${s.id}`, raw: s, inDrawer: !!s.inDrawer })),
    ...notes.map(n => ({ kind: "note",  id: `n${n.id}`, raw: n, inDrawer: !!n.inDrawer })),
  ];
  const top = tagged.filter(it => !it.inDrawer);
  const back = tagged.filter(it => it.inDrawer);
  const total = tagged.length;

  function renderCard(it, i) {
    const isInDrawer = it.inDrawer;
    if (it.kind === "shelf") {
      return (
        <DeskShelfPostit
          key={it.id} item={it.raw} index={i}
          isInDrawer={isInDrawer}
          onBringBack={() => onBringBack(it.raw)}
          onReframe={() => onOpenShelfSheet(it.raw, "reframe")}
          onWaiting={() => onOpenShelfSheet(it.raw, "waiting")}
          onToggleDrawer={() => onSetShelfInDrawer(it.raw, !isInDrawer)}
          onRelease={() => onReleaseShelf(it.raw)}
        />
      );
    }
    return (
      <DeskNotePostit
        key={it.id} note={it.raw} index={i}
        isInDrawer={isInDrawer}
        decideOpen={decideFor === it.raw.id}
        onDecide={() => setDecideFor(it.raw.id)}
        onCloseDecide={() => setDecideFor(null)}
        onBringToNow={() => { onRestoreNote(it.raw); setDecideFor(null); }}
        onToggleDrawer={() => { onSetNoteInDrawer(it.raw, !isInDrawer); setDecideFor(null); }}
        onDelete={() => { onDeleteNote(it.raw.id); setDecideFor(null); }}
      />
    );
  }

  return (
    <div className="screen surface-desk" style={{padding: "12px 0 0"}}>
      <div className="surface-mark" aria-hidden="true"/>
      <div style={{padding: "12px 28px 12px"}}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12}}>
          <div style={{flex: 1, minWidth: 0}}>
            <div className="kicker" style={{marginBottom: 4}}>worth considering</div>
            <div className="serif" style={{fontSize: 28, color: "var(--ink)"}}>
              Desk.
            </div>
          </div>
          <button onClick={onAddOpen} style={{
            background: "var(--ink)", color: "var(--paper)", border: "none",
            borderRadius: 999, padding: "8px 14px",
            fontFamily: "var(--serif)", fontSize: 13, cursor: "pointer",
            flexShrink: 0, alignSelf: "flex-end",
          }}>+ place</button>
        </div>
        <div className="serif" style={{
          fontSize: 13, color: "var(--ink-faint)", marginTop: 4, fontStyle: "italic", lineHeight: 1.5,
        }}>
          On top: what's worth considering. The drawer at the bottom holds the rest.
        </div>
      </div>

      {/* Top zone — post-it grid on the desk surface */}
      <div className="scroll-y" style={{flex: 1, overflowY: "auto", padding: "8px 22px 10px"}}>
        {total === 0 && (
          <div className="serif" style={{
            padding: "60px 24px 24px", color: "var(--ink-faint)", fontStyle: "italic",
            fontSize: 16, lineHeight: 1.6, textAlign: "center",
          }}>
            The desk is clear.<br/>
            <span style={{fontSize: 13}}>Nothing has been set down or kept aside yet.</span>
          </div>
        )}
        {top.length > 0 && (
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12}}>
            {top.map((it, i) => renderCard(it, i))}
          </div>
        )}
      </div>

      {/* Drawer affordance pinned to the bottom */}
      <div style={{padding: "0 22px 14px"}}>
        {!drawerOpen ? (
          <button
            onClick={() => setDrawerOpen(true)}
            className="fade-soft"
            style={{
              position: "relative", width: "100%",
              background: "var(--paper-deep)",
              border: "1px solid var(--rule-strong)",
              borderRadius: "4px 4px 12px 12px",
              padding: "20px 18px 22px",
              cursor: "pointer", textAlign: "center",
              fontFamily: "var(--serif)", color: "var(--ink)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 0 var(--rule), 0 4px 12px -4px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{
              position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
              width: 36, height: 4, borderRadius: 2,
              background: "var(--rule-strong)",
            }}/>
            <div className="kicker" style={{marginTop: 6, marginBottom: 6, color: "var(--ink-faint)"}}>
              {back.length === 0
                ? "drawer empty"
                : back.length === 1 ? "1 in the drawer" : `${back.length} in the drawer`}
            </div>
            <div className="serif" style={{
              fontSize: 13, fontStyle: "italic", color: "var(--ink-soft)", lineHeight: 1.5,
            }}>
              {back.length === 0
                ? "Less vital things will tuck in here."
                : "Tap to open."}
            </div>
          </button>
        ) : (
          <div className="fade-in" style={{
            background: "var(--paper-deep)",
            border: "1px solid var(--rule-strong)",
            borderRadius: "4px 4px 12px 12px",
            padding: "10px 12px 14px",
          }}>
            <div style={{textAlign: "center", marginBottom: 8}}>
              <button
                onClick={() => setDrawerOpen(false)}
                className="ghost-btn"
                style={{
                  fontFamily: "var(--serif)", fontStyle: "italic",
                  fontSize: 11, color: "var(--ink-faint)", padding: "4px 10px",
                }}
              >⌃ close drawer</button>
            </div>
            {back.length === 0 ? (
              <div className="serif" style={{
                padding: "20px 8px", color: "var(--ink-faint)", fontStyle: "italic",
                fontSize: 13, textAlign: "center",
              }}>
                Nothing tucked away.
              </div>
            ) : (
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
                maxHeight: 300, overflowY: "auto",
              }}>
                {back.map((it, i) => renderCard(it, i))}
              </div>
            )}
            {trashCount > 0 && (
              <div style={{
                marginTop: 12, paddingTop: 10,
                borderTop: "1px dashed var(--rule)", textAlign: "center",
              }}>
                <button
                  onClick={onOpenTrash}
                  className="ghost-btn"
                  style={{
                    fontFamily: "var(--serif)", fontStyle: "italic",
                    fontSize: 11, color: "var(--ink-faint)", padding: "4px 10px",
                  }}
                >
                  {trashCount === 1
                    ? "1 thing released — kept for 30 days"
                    : `${trashCount} things released — kept for 30 days`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Trash Bin (released, kept for 30 days) ----------
function TrashBin({ trash, onRestore, onPurge, onClose }) {
  const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 30;
  const visible = trash.filter(t => t.releasedAt > cutoff);

  function relativeDays(ms) {
    const days = Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24));
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    return `${days} days ago`;
  }
  function daysLeft(ms) {
    const left = 30 - Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24));
    return Math.max(0, left);
  }

  function previewText(item) {
    if (item.kind === "task") return item.payload.text;
    if (item.kind === "note") return item.payload.text;
    if (item.kind === "shelf") return item.payload.text;
    return "—";
  }

  function kindLabel(kind) {
    if (kind === "task") return "from notebook";
    if (kind === "note") return "from desk";
    if (kind === "shelf") return "from desk";
    return "";
  }

  return (
    <div className="screen fade-soft surface-trash" style={{padding: "44px 28px 32px", justifyContent: "flex-start"}}>
      <div className="surface-mark" aria-hidden="true"/>
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22}}>
        <button onClick={onClose} className="ghost-btn" style={{
          color: "var(--ink-soft)", padding: 0, fontSize: 14,
        }}>
          ← back
        </button>
        <div className="kicker" style={{fontSize: 10}}>recently released</div>
      </div>

      <div className="ascend" style={{marginBottom: 6}}>
        <div className="serif" style={{
          fontSize: 22, color: "var(--ink)", lineHeight: 1.4,
          letterSpacing: "-0.005em",
        }}>
          A holding place.
        </div>
        <div className="serif" style={{
          fontSize: 13, color: "var(--ink-faint)", fontStyle: "italic", marginTop: 6, lineHeight: 1.5,
        }}>
          Things you've let go of stay here for thirty days. After that, they're gone — quietly.
        </div>
      </div>

      <div style={{height: 1, background: "var(--rule)", margin: "20px 0 12px"}}/>

      <div className="scroll-y" style={{flex: 1, overflowY: "auto", margin: "0 -8px"}}>
        {visible.length === 0 && (
          <div className="serif" style={{
            padding: "60px 24px", color: "var(--ink-faint)", fontStyle: "italic",
            fontSize: 15, lineHeight: 1.5, textAlign: "center",
          }}>
            Nothing here.<br/>
            What you release stays gone.
          </div>
        )}

        {visible.map((t, i) => (
          <div key={t.id} className="fade-in" style={{
            padding: "14px 8px 12px",
            borderBottom: "1px solid var(--rule)",
            display: "flex", alignItems: "flex-start", gap: 10,
            animationDelay: `${i * 30}ms`,
          }}>
            <div style={{flex: 1, minWidth: 0}}>
              <div className="serif" style={{
                fontSize: 15, color: "var(--ink)", lineHeight: 1.4,
              }}>
                {previewText(t)}
              </div>
              <div style={{
                marginTop: 4, display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap",
              }}>
                <span className="kicker" style={{fontSize: 9, color: "var(--ink-faint)"}}>
                  {kindLabel(t.kind)}
                </span>
                <span className="serif" style={{
                  fontSize: 11, color: "var(--ink-faint)", fontStyle: "italic",
                }}>
                  released {relativeDays(t.releasedAt)} · {daysLeft(t.releasedAt)} days left
                </span>
              </div>
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: 6}}>
              <button onClick={() => onRestore(t)} style={{
                background: "transparent", border: "1px solid var(--rule-strong)",
                borderRadius: 999, padding: "5px 12px",
                fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 11,
                color: "var(--ink)", cursor: "pointer", whiteSpace: "nowrap",
              }}>welcome back</button>
              <button onClick={() => onPurge(t.id)} style={{
                background: "transparent", border: "none",
                fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 11,
                color: "var(--ink-faint)", cursor: "pointer", whiteSpace: "nowrap",
              }}>let go now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  TurnThePage,
  REASON_TAGS, reasonLabelFor,
  DecisionPointSheet, DecisionHub, StartOnePanel, BreakDownPanel, SharePanel,
  DivideSheet,
  CarryForward,
  SetDownSheet, ReframeSheet, WaitingOnSheet,
  ReOfferCard,
  KeyReference,
  Recap,
  DeskShelfPostit, DeskNotePostit, DeskPage,
  TrashBin,
});
