/* The Daily Now — rituals (deferred-loaded) */
/* Three Breaths, Meditate (Setup / Square / Active), Journal + Calendar. */
/* eslint-disable */

const { useState, useEffect, useRef } = React;

// ---------- Three Breaths ----------
// Robbins' 5-second rule, softened: count down, breathe, then go.
function ThreeBreaths({ onComplete, pacing = "normal" }) {
  // Phase: "intro" -> three breath cycles (3, 2, 1) -> "go" -> "focus"
  // Each breath: inhale (in) for ~paceIn, exhale (out) for ~paceOut.
  const paceMs = pacing === "slow" ? 5000 : pacing === "fast" ? 3500 : 4200; // per inhale & per exhale
  const [phase, setPhase] = useState("intro");
  const [count, setCount] = useState(3); // 3, 2, 1
  const [breath, setBreath] = useState("in"); // "in" | "out"
  const [focus, setFocus] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (phase === "intro") {
      const t = setTimeout(() => {
        setPhase("breath");
        setCount(3);
        setBreath("in");
      }, 1400);
      return () => clearTimeout(t);
    }
    if (phase === "breath") {
      // inhale -> exhale -> next count (or go)
      if (breath === "in") {
        const t = setTimeout(() => setBreath("out"), paceMs);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => {
          if (count > 1) {
            setCount(count - 1);
            setBreath("in");
          } else {
            setPhase("go");
          }
        }, paceMs);
        return () => clearTimeout(t);
      }
    }
    if (phase === "go") {
      const t = setTimeout(() => {
        setPhase("focus");
        setTimeout(() => inputRef.current?.focus(), 60);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [phase, count, breath, paceMs]);

  // Visual state
  const isInhale = phase === "breath" && breath === "in";
  const isExhale = phase === "breath" && breath === "out";
  const isGo = phase === "go";

  const circleScale = phase === "intro" ? 0.6
                    : isInhale ? 1.0
                    : isExhale ? 0.55
                    : isGo ? 1.15
                    : 0.6;
  const circleOpacity = phase === "focus" ? 0 : 1;

  return (
    <div className="screen fade-soft" style={{
      justifyContent: "space-between",
      padding: "56px 32px 36px",
      alignItems: "center",
      textAlign: "center",
    }}>
      {/* Top kicker */}
      <div className="kicker" style={{
        opacity: phase === "focus" ? 0 : 1,
        transition: "opacity 600ms ease",
      }}>
        {phase === "intro" ? "settle in" :
         phase === "breath" ? (isInhale ? "breathe in" : "and out") :
         phase === "go" ? "go" : ""}
      </div>

      {/* Breathing circle */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        opacity: circleOpacity,
        transition: "opacity 700ms ease",
      }}>
        <div style={{
          width: 240,
          height: 240,
          borderRadius: "50%",
          border: "1px solid var(--rule-strong)",
          background: "radial-gradient(circle at 35% 30%, var(--paper) 0%, var(--paper-deep) 80%)",
          transform: `scale(${circleScale})`,
          transition: `transform ${paceMs}ms cubic-bezier(0.4, 0, 0.5, 1)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "inset 0 0 40px rgba(0,0,0,0.04)",
        }}>
          <div className="serif" style={{
            fontSize: isGo ? 56 : 88,
            fontWeight: 300,
            color: "var(--ink)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}>
            {phase === "intro" ? "" :
             phase === "breath" ? count :
             isGo ? "go" : ""}
          </div>
        </div>
      </div>

      {/* Focus prompt (after countdown) */}
      {phase === "focus" && (
        <div className="ascend" style={{width: "100%", textAlign: "left"}}>
          <div className="kicker" style={{marginBottom: 10}}>one small thing</div>
          <div className="serif" style={{
            fontSize: 22, color: "var(--ink)", lineHeight: 1.3, marginBottom: 18,
          }}>
            What's the one small<br/>
            thing you can do<br/>
            <em style={{fontStyle: "italic", color: "var(--ink-soft)"}}>right now?</em>
          </div>
          <input
            ref={inputRef}
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && focus.trim()) onComplete(focus.trim());
            }}
            placeholder="just one"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid var(--rule-strong)",
              padding: "10px 2px",
              fontFamily: "var(--serif)",
              fontSize: 19,
              color: "var(--ink)",
              outline: "none",
            }}
          />
          <div style={{display: "flex", justifyContent: "space-between", marginTop: 20, alignItems: "center"}}>
            <button
              onClick={() => onComplete(null)}
              style={{
                background: "transparent", border: "none",
                color: "var(--ink-faint)", fontFamily: "var(--serif)",
                fontStyle: "italic", fontSize: 13, cursor: "pointer", padding: 0,
              }}
            >open today as-is</button>
            <button
              onClick={() => onComplete(focus.trim() || null)}
              style={{
                background: "var(--ink)", color: "var(--paper)", border: "none",
                borderRadius: 999, padding: "12px 22px",
                fontFamily: "var(--serif)", fontSize: 15, cursor: "pointer",
              }}
            >begin →</button>
          </div>
        </div>
      )}

      {/* Skip — only during breath phases */}
      {phase !== "focus" && (
        <button
          onClick={() => onComplete(null)}
          style={{
            background: "transparent", border: "none",
            color: "var(--ink-faint)", fontFamily: "var(--serif)",
            fontStyle: "italic", fontSize: 13, cursor: "pointer",
            opacity: 0.6,
          }}
        >skip</button>
      )}
    </div>
  );
}

// ---------- Meditate ----------
// Setup screen: pick length and sound. Then active timer.
function MeditateSetup({ defaultMinutes = 5, onStart, onCancel }) {
  // length is in seconds: 30 = square breathing, others = quiet meditation in minutes
  const [lengthSec, setLengthSec] = useState(defaultMinutes * 60);
  const [sound, setSound] = useState("none");

  const lengths = [
    { val: 30, label: "30 sec", hint: "square breathing", kind: "square" },
    { val: 120, label: "2 min", hint: "a pause", kind: "sit" },
    { val: 300, label: "5 min", hint: "settle in", kind: "sit" },
    { val: 600, label: "10 min", hint: "go deeper", kind: "sit" },
  ];

  const sounds = [
    { val: "none", label: "silence" },
    { val: "stream", label: "stream" },
    { val: "rain", label: "rain" },
    { val: "binaural", label: "binaural" },
  ];

  const isSquare = lengthSec === 30;

  return (
    <div className="screen fade-soft" style={{
      padding: "44px 32px 32px",
      justifyContent: "space-between",
    }}>
      <div>
        <div className="kicker" style={{marginBottom: 14}}>sit a while</div>
        <div className="serif" style={{
          fontSize: 28, color: "var(--ink)", lineHeight: 1.25, marginBottom: 28,
        }}>
          A few quiet minutes.<br/>
          <span style={{color: "var(--ink-soft)", fontStyle: "italic", fontSize: 18}}>
            Then begin.
          </span>
        </div>

        <div className="kicker" style={{marginBottom: 10}}>length</div>
        <div style={{display: "flex", flexDirection: "column", gap: 0, marginBottom: 28}}>
          {lengths.map((l) => (
            <button
              key={l.val}
              onClick={() => setLengthSec(l.val)}
              style={{
                background: "transparent",
                border: "none",
                borderTop: "1px solid var(--rule)",
                padding: "14px 0",
                textAlign: "left",
                fontFamily: "var(--serif)",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                color: lengthSec === l.val ? "var(--ink)" : "var(--ink-soft)",
              }}
            >
              <div>
                <span style={{fontSize: 18}}>{l.label}</span>
                <span style={{
                  fontSize: 12, fontStyle: "italic", marginLeft: 12,
                  color: "var(--ink-faint)",
                }}>{l.hint}</span>
              </div>
              <span style={{fontSize: 14, color: "var(--ink)"}}>
                {lengthSec === l.val ? "●" : "○"}
              </span>
            </button>
          ))}
        </div>

        {!isSquare && (
          <>
            <div className="kicker" style={{marginBottom: 10}}>sound</div>
            <div style={{display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22}}>
              {sounds.map((s) => (
                <button
                  key={s.val}
                  onClick={() => setSound(s.val)}
                  style={{
                    background: sound === s.val ? "var(--ink)" : "transparent",
                    color: sound === s.val ? "var(--paper)" : "var(--ink-soft)",
                    border: "1px solid " + (sound === s.val ? "var(--ink)" : "var(--rule-strong)"),
                    borderRadius: 999,
                    padding: "8px 16px",
                    fontFamily: "var(--serif)",
                    fontSize: 14,
                    cursor: "pointer",
                    fontStyle: sound === s.val ? "normal" : "italic",
                  }}
                >{s.label}</button>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <button
          onClick={onCancel}
          style={{
            background: "transparent", border: "none",
            color: "var(--ink-faint)", fontFamily: "var(--serif)",
            fontStyle: "italic", fontSize: 14, cursor: "pointer",
          }}
        >back</button>
        <button
          onClick={() => onStart({ lengthSec, sound: isSquare ? "none" : sound, kind: isSquare ? "square" : "sit" })}
          style={{
            background: "var(--ink)", color: "var(--paper)",
            border: "none", borderRadius: 999,
            padding: "14px 28px",
            fontFamily: "var(--serif)", fontSize: 16, cursor: "pointer",
          }}
        >begin →</button>
      </div>
    </div>
  );
}

// ---------- Square Breath (4·4·4·4) ----------
// 30-second pause: ~2 cycles of 4-in / 4-hold / 4-out / 4-hold (16s each).
// Visual: a circle that grows on inhale, holds with a tracing arc, shrinks on
// exhale, holds with another tracing arc. Every phase has its own motion.
function SquareBreath({ totalSec = 30, onComplete, onCancel }) {
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  // Sub-second progress within the current phase (0..1)
  const [phaseT, setPhaseT] = useState(0);

  // Smooth animation tick (rAF)
  useEffect(() => {
    if (done) return;
    let raf;
    const start = performance.now();
    const baseElapsed = elapsed;
    const tick = (now) => {
      const t = baseElapsed + (now - start) / 1000;
      if (t >= totalSec) {
        setElapsed(totalSec);
        setPhaseT(1);
        setDone(true);
        return;
      }
      setElapsed(t);
      const cyc = t % 16;
      const inPhase = cyc % 4;
      setPhaseT(inPhase / 4);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [done, totalSec]);

  // Phase
  const cyclePos = elapsed % 16; // 16-second cycle
  let phase, phaseLabel, countDown;
  if (cyclePos < 4)       { phase = "inhale";  phaseLabel = "breathe in"; countDown = Math.ceil(4 - cyclePos); }
  else if (cyclePos < 8)  { phase = "hold-in"; phaseLabel = "hold";       countDown = Math.ceil(8 - cyclePos); }
  else if (cyclePos < 12) { phase = "exhale";  phaseLabel = "breathe out";countDown = Math.ceil(12 - cyclePos); }
  else                    { phase = "hold-out";phaseLabel = "hold";       countDown = Math.ceil(16 - cyclePos); }

  // Circle size by phase
  const SMALL = 70;   // diameter, px
  const LARGE = 220;
  let diameter;
  if (phase === "inhale")        diameter = SMALL + (LARGE - SMALL) * phaseT;
  else if (phase === "hold-in")  diameter = LARGE;
  else if (phase === "exhale")   diameter = LARGE - (LARGE - SMALL) * phaseT;
  else                            diameter = SMALL;

  // Arc progress for holds (0..1, sweeps clockwise around the circle)
  const showArc = phase === "hold-in" || phase === "hold-out";
  const arcProgress = showArc ? phaseT : 0;

  // SVG ring geometry — sized to wrap whatever the current diameter is plus a gap
  const ringRadius = (diameter / 2) + 14;
  const ringStroke = 1.5;
  const circumference = 2 * Math.PI * ringRadius;
  const dashOffset = circumference * (1 - arcProgress);

  // Auto-finish a beat after the last second
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(onComplete, 900);
    return () => clearTimeout(id);
  }, [done, onComplete]);

  // Stage size (room for largest circle + ring)
  const STAGE = 280;

  return (
    <div className="screen fade-soft" style={{
      padding: "44px 32px 32px",
      justifyContent: "space-between",
      alignItems: "stretch",
    }}>
      {/* Top: kicker + remaining */}
      <div>
        <div className="kicker" style={{marginBottom: 6}}>square breathing</div>
        <div className="serif" style={{
          fontSize: 15, color: "var(--ink-faint)", fontStyle: "italic",
        }}>
          {Math.max(0, Math.ceil(totalSec - elapsed))}s
        </div>
      </div>

      {/* Center: circle + (during holds) tracing arc + phase label */}
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 40,
      }}>
        <div style={{
          position: "relative",
          width: STAGE, height: STAGE,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {/* Faint reference ring — full inhale size, always visible */}
          <div style={{
            position: "absolute",
            width: LARGE, height: LARGE,
            border: "1px solid var(--rule)",
            borderRadius: "50%",
            opacity: 0.45,
          }}/>

          {/* Active breathing circle — fills softly */}
          <div style={{
            width: diameter, height: diameter,
            background: "var(--ink)",
            borderRadius: "50%",
            opacity: 0.92,
            // No CSS transition — rAF drives the size every frame for smoothness
          }}/>

          {/* Hold arc — only during the two hold phases */}
          {showArc && (
            <svg
              width={STAGE} height={STAGE}
              style={{position: "absolute", inset: 0, pointerEvents: "none"}}
              viewBox={`0 0 ${STAGE} ${STAGE}`}
            >
              {/* Faint full ring */}
              <circle
                cx={STAGE/2} cy={STAGE/2} r={ringRadius}
                fill="none"
                stroke="var(--rule)"
                strokeWidth={ringStroke}
                opacity={0.6}
              />
              {/* Sweeping progress arc */}
              <circle
                cx={STAGE/2} cy={STAGE/2} r={ringRadius}
                fill="none"
                stroke="var(--ink)"
                strokeWidth={ringStroke + 0.5}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${STAGE/2} ${STAGE/2})`}
                style={{transition: "stroke-dashoffset 80ms linear"}}
              />
            </svg>
          )}
        </div>

        <div style={{textAlign: "center"}}>
          <div className="serif" style={{
            fontSize: 26, color: "var(--ink)", lineHeight: 1, marginBottom: 10,
            letterSpacing: "0.01em",
          }}>{phaseLabel}</div>
          <div className="serif" style={{
            fontSize: 13, color: "var(--ink-faint)", fontStyle: "italic",
            letterSpacing: "0.05em",
          }}>
            {countDown}
          </div>
        </div>
      </div>

      {/* Bottom: stop */}
      <div style={{display: "flex", justifyContent: "center"}}>
        <button
          onClick={onCancel}
          style={{
            background: "transparent", border: "none",
            color: "var(--ink-faint)", fontFamily: "var(--serif)",
            fontStyle: "italic", fontSize: 13, cursor: "pointer",
            opacity: 0.6,
          }}
        >stop</button>
      </div>
    </div>
  );
}

function MeditateActive({ minutes, sound, guided, onComplete, onCancel }) {
  const totalSec = minutes * 60;
  const [remaining, setRemaining] = useState(totalSec);
  const [paused, setPaused] = useState(false);
  const [prompt, setPrompt] = useState(null);
  const audioRef = useRef(null);

  // Tick
  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining(r => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [paused, remaining]);

  // Soundscape (Web Audio)
  useEffect(() => {
    if (sound === "none") return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const cleanup = [];
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    // Fade in
    master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime);
    master.gain.linearRampToValueAtTime(sound === "binaural" ? 0.08 : 0.18, ctx.currentTime + 1.5);

    if (sound === "stream" || sound === "rain") {
      // Generate noise buffer
      const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      const data = buf.getChannelData(0);
      // Pink-ish noise via simple filter cascade
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < data.length; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + 0.0555179 * w;
        b1 = 0.96 * b1 + 0.2965164 * w;
        b2 = 0.57 * b2 + 1.0526913 * w;
        data[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      if (sound === "stream") {
        filter.type = "lowpass";
        filter.frequency.value = 1400;
        filter.Q.value = 0.4;
      } else {
        // rain — broader, with slight high shelf
        filter.type = "lowpass";
        filter.frequency.value = 4500;
        filter.Q.value = 0.5;
      }
      src.connect(filter);
      filter.connect(master);
      src.start();
      cleanup.push(() => { try { src.stop(); } catch(e) {} });

      // Subtle drift modulation for liveliness
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.07;
      lfoGain.gain.value = sound === "rain" ? 800 : 200;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      cleanup.push(() => { try { lfo.stop(); } catch(e) {} });
    } else if (sound === "binaural") {
      // Theta-ish: 200Hz left, 207Hz right -> 7Hz beat
      const merger = ctx.createChannelMerger(2);
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      oscL.frequency.value = 200;
      oscR.frequency.value = 207;
      oscL.type = "sine";
      oscR.type = "sine";
      const gL = ctx.createGain(); gL.gain.value = 0.5;
      const gR = ctx.createGain(); gR.gain.value = 0.5;
      oscL.connect(gL); gL.connect(merger, 0, 0);
      oscR.connect(gR); gR.connect(merger, 0, 1);
      merger.connect(master);
      oscL.start(); oscR.start();
      cleanup.push(() => { try { oscL.stop(); oscR.stop(); } catch(e) {} });
    }

    audioRef.current = { ctx, master };

    return () => {
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      } catch(e) {}
      cleanup.forEach(fn => fn());
      setTimeout(() => { try { ctx.close(); } catch(e) {} }, 600);
    };
  }, [sound]);

  // Auto-complete when timer hits 0
  useEffect(() => {
    if (remaining === 0) {
      const t = setTimeout(() => onComplete(), 2500);
      return () => clearTimeout(t);
    }
  }, [remaining]);

  // Slow breathing pace: ~6 sec inhale, 6 sec exhale = 12s cycle
  const cycleMs = 12000;
  const [breathPhase, setBreathPhase] = useState("in");
  useEffect(() => {
    if (paused || remaining === 0) return;
    const id = setInterval(() => {
      setBreathPhase(p => p === "in" ? "out" : "in");
    }, cycleMs / 2);
    return () => clearInterval(id);
  }, [paused, remaining]);

  // Guided prompts — text-only, on-screen. The prompt fades in, holds, fades
  // out. Paced ~32s apart, with a settle-in pause at the start and quiet last
  // 20s at the end. Eyes-closed users won't see them; that's fine — they're
  // for visual reference only when someone glances at the screen.
  useEffect(() => {
    if (!guided || paused || remaining === 0) return;
    const PROMPTS = [
      "settle in",
      "let the breath be soft",
      "if your mind wanders, that's fine",
      "soften your jaw, soften your eyes",
      "nothing to fix, nothing to chase",
      "just this breath",
      "and the next one",
      "notice the small space between breaths",
      "let the room be quiet around you",
      "you don't have to feel anything in particular",
    ];
    let idx = 0;
    let cancelled = false;
    const speak = (text) => {
      setPrompt(text);
      setTimeout(() => { if (!cancelled) setPrompt(null); }, 7000);
    };
    const initial = setTimeout(() => {
      if (!cancelled) speak(PROMPTS[0]);
      idx = 1;
    }, 6000);
    const interval = setInterval(() => {
      if (cancelled) return;
      if (remaining <= 20) return;
      const next = PROMPTS[idx % PROMPTS.length];
      idx++;
      speak(next);
    }, 32000);
    return () => {
      cancelled = true;
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [guided, paused, remaining === 0]);

  const mm = Math.floor(remaining / 60);
  const ss = (remaining % 60).toString().padStart(2, "0");
  const finished = remaining === 0;

  return (
    <div className="screen fade-soft" style={{
      padding: "44px 32px 32px",
      justifyContent: "space-between",
      alignItems: "center",
      textAlign: "center",
    }}>
      <div className="kicker" style={{
        opacity: finished ? 0 : 0.85,
        transition: "opacity 1s ease",
      }}>
        {finished ? "" : (breathPhase === "in" ? "in" : "out")}
      </div>

      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
      }}>
        <div style={{
          width: 220, height: 220, borderRadius: "50%",
          border: "1px solid var(--rule-strong)",
          background: "radial-gradient(circle at 35% 30%, var(--paper) 0%, var(--paper-deep) 85%)",
          transform: `scale(${finished ? 1 : breathPhase === "in" ? 1 : 0.6})`,
          transition: `transform ${cycleMs / 2}ms cubic-bezier(0.4, 0, 0.5, 1)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div className="serif" style={{
            fontSize: finished ? 22 : 32,
            fontStyle: finished ? "italic" : "normal",
            color: "var(--ink)",
            fontWeight: 300,
            letterSpacing: "0.02em",
          }}>
            {finished ? "thank you" : `${mm}:${ss}`}
          </div>
        </div>
        {finished && (
          <div className="serif fade-in" style={{
            fontSize: 16, color: "var(--ink-soft)", fontStyle: "italic", maxWidth: 240,
          }}>
            Carry that with you.
          </div>
        )}
        {!finished && prompt && (
          <div className="serif fade-in" key={prompt} style={{
            fontSize: 16, color: "var(--ink-soft)", fontStyle: "italic",
            maxWidth: 280, lineHeight: 1.5,
            transition: "opacity 800ms ease",
          }}>
            {prompt}
          </div>
        )}
      </div>

      <div style={{display: "flex", gap: 20, alignItems: "center"}}>
        {!finished && (
          <>
            <button
              onClick={() => setPaused(p => !p)}
              style={{
                background: "transparent", border: "1px solid var(--rule-strong)",
                borderRadius: 999, padding: "10px 18px",
                fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13,
                color: "var(--ink-soft)", cursor: "pointer",
              }}
            >{paused ? "resume" : "pause"}</button>
            <button
              onClick={onCancel}
              style={{
                background: "transparent", border: "none",
                color: "var(--ink-faint)", fontFamily: "var(--serif)",
                fontStyle: "italic", fontSize: 13, cursor: "pointer",
              }}
            >end early</button>
          </>
        )}
        {finished && (
          <button
            onClick={onComplete}
            style={{
              background: "var(--ink)", color: "var(--paper)",
              border: "none", borderRadius: 999,
              padding: "14px 28px",
              fontFamily: "var(--serif)", fontSize: 16, cursor: "pointer",
            }}
          >open today's page →</button>
        )}
      </div>
    </div>
  );
}

// ---------- Journal (Reflect a moment) ----------
// Light-weight reflective writing. Persists per-day in localStorage so a refresh
// doesn't lose the entry. 500-char soft cap — this is meant to be brief, a few
// lines, not an essay. Prompt rotates by day-of-year so it feels like the day's
// own question, not a random one.
const JOURNAL_PROMPTS = [
  "What's true for you this morning?",
  "What's asking for your attention?",
  "What would yesterday's self thank you for?",
  "What's one thing you don't have to do today?",
  "Where is there tightness? Where is there ease?",
  "What's the smallest honest thing you can say right now?",
  "What did you almost not notice?",
  "What's one thing you can let be unfinished?",
  "What are you carrying that isn't yours?",
  "What's quietly working?",
  "What would softer look like, today?",
  "What did you mean when you said yes?",
];

function promptForDay() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const doy = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return JOURNAL_PROMPTS[doy % JOURNAL_PROMPTS.length];
}

function journalKeyForIso(iso) {
  return `${window.STORAGE_NS || "dn"}:journal.${iso}`;
}
function journalKeyFor(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return journalKeyForIso(`${y}-${m}-${d}`);
}

function isoFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function dateFromIso(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function listJournalEntries() {
  const out = [];
  const prefix = `${window.STORAGE_NS || "dn"}:journal.`;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;
      const iso = k.slice(prefix.length);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) continue;
      const text = localStorage.getItem(k) || "";
      if (!text.trim()) continue;
      out.push({ iso, text });
    }
  } catch (e) {}
  out.sort((a, b) => b.iso.localeCompare(a.iso)); // newest first
  return out;
}

// Used by Journal to seed dev demo entries on first run so the calendar /
// history is not empty when previewing. Idempotent — only seeds if NO entries
// exist at all. Gated on data-seed="true" on the root div so the real
// user-facing instance (/dev/notes) boots truly empty.
function seedJournalIfEmpty() {
  if (!window.SEED_DEMO) return;
  try {
    if (listJournalEntries().length > 0) return;
    const today = new Date();
    const seeds = [
      { offset: -1, text: "Slept badly. Felt like everything was urgent before I'd even sat down. Did one thing — replied to Mara — and the static quieted." },
      { offset: -3, text: "Walked instead of scrolled. Noticed the light. Came home and the proposal felt smaller." },
      { offset: -7, text: "I keep saying yes to things that aren't mine. The kitchen contractor decision is the next one to release, I think." },
      { offset: -12, text: "Quiet day. Tea, the book, a long phone call with Sam. Nothing crossed off, but plenty done." },
      { offset: -20, text: "First real spring morning. Wrote one paragraph of the intro and it was enough." },
    ];
    seeds.forEach(({ offset, text }) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      localStorage.setItem(journalKeyFor(d), text);
    });
  } catch (e) {}
}

function Journal({ onClose, dateStr, weekday, todayIso }) {
  const MAX = 500;

  // Mode: 'write' (today, editable), 'view' (past entry, read-only), 'calendar' (picker)
  const [mode, setMode] = useState("write");
  const [viewingIso, setViewingIso] = useState(todayIso);
  const [entries, setEntries] = useState(() => {
    seedJournalIfEmpty();
    return listJournalEntries();
  });

  const isToday = viewingIso === todayIso;
  const storageKey = journalKeyForIso(viewingIso);
  const prompt = promptForDay(); // today's prompt for write mode
  // For viewing past, use the prompt that would have been shown on that day.
  const promptForViewing = (() => {
    const d = dateFromIso(viewingIso);
    const start = new Date(d.getFullYear(), 0, 0);
    const doy = Math.floor((d - start) / (1000 * 60 * 60 * 24));
    return JOURNAL_PROMPTS[doy % JOURNAL_PROMPTS.length];
  })();

  const [text, setText] = useState(() => {
    try { return localStorage.getItem(journalKeyForIso(todayIso)) || ""; } catch (e) { return ""; }
  });

  // When viewing a past entry, pull its text fresh from storage.
  const viewedText = (() => {
    if (isToday) return text;
    try { return localStorage.getItem(storageKey) || ""; } catch (e) { return ""; }
  })();

  const [savedAt, setSavedAt] = useState(null);

  // Autosave today's entry — debounce 600ms after last keystroke.
  useEffect(() => {
    if (mode !== "write") return;
    const todayKey = journalKeyForIso(todayIso);
    if (text === "") {
      try { localStorage.removeItem(todayKey); } catch (e) {}
      setSavedAt(null);
      return;
    }
    const id = setTimeout(() => {
      try {
        localStorage.setItem(todayKey, text);
        setSavedAt(Date.now());
        setEntries(listJournalEntries());
      } catch (e) {}
    }, 600);
    return () => clearTimeout(id);
  }, [text, todayIso, mode]);

  // Resync editor on day flip (admin advance / real midnight via App's
  // visibility tick) — pulls the new day's stored entry into local state.
  // Race safety: the autosave effect's cleanup runs first when deps change
  // and clears its pending 600ms timer, so yesterday's text can't post-write
  // itself into today's key after we've moved.
  useEffect(() => {
    if (mode !== "write") return;
    setViewingIso(todayIso);
    try { setText(localStorage.getItem(journalKeyForIso(todayIso)) || ""); } catch (e) {}
  }, [todayIso, mode]);

  const remaining = MAX - text.length;
  const overSoft = remaining < 0;

  // ---------- Calendar mode ----------
  if (mode === "calendar") {
    return (
      <JournalCalendar
        entries={entries}
        todayIso={todayIso}
        onPickToday={() => { setViewingIso(todayIso); setMode("write"); }}
        onPickPast={(iso) => { setViewingIso(iso); setMode("view"); }}
        onClose={() => setMode(isToday ? "write" : "view")}
      />
    );
  }

  // ---------- View mode (past entry, read-only) ----------
  if (mode === "view" && !isToday) {
    const dt = dateFromIso(viewingIso);
    const viewWeekday = dt.toLocaleDateString(undefined, { weekday: "long" }).toLowerCase();
    const viewDateStr = dt.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    // Find prev/next entries for paging (entries are newest-first)
    const idx = entries.findIndex(e => e.iso === viewingIso);
    const olderIso = idx >= 0 && idx < entries.length - 1 ? entries[idx + 1].iso : null;
    const newerIso = idx > 0 ? entries[idx - 1].iso : null;

    return (
      <div className="screen fade-soft surface-journal" style={{padding: "44px 28px 32px", justifyContent: "flex-start"}}>
        <div className="surface-mark" aria-hidden="true"/>
        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22}}>
          <button onClick={() => { setMode("write"); setViewingIso(todayIso); }} className="ghost-btn" style={{
            color: "var(--ink-soft)", padding: 0, fontSize: 14,
          }}>
            ← back
          </button>
          <button onClick={() => setMode("calendar")} className="ghost-btn" style={{
            color: "var(--ink-soft)", fontSize: 12, fontStyle: "italic", padding: 0,
          }}>
            calendar
          </button>
        </div>

        <div className="ascend" style={{marginBottom: 18}}>
          <div className="kicker" style={{marginBottom: 8}}>{viewWeekday} · {viewDateStr}</div>
          <div className="serif" style={{
            fontSize: 18, color: "var(--ink-soft)", lineHeight: 1.4, fontStyle: "italic",
          }}>
            {promptForViewing}
          </div>
        </div>

        <div className="ascend" style={{
          flex: 1, minHeight: 0, animationDelay: "120ms",
          background: "var(--paper-deep)",
          border: "1px solid var(--rule)",
          borderRadius: 4,
          padding: "18px 18px 14px",
          overflowY: "auto",
        }}>
          <div className="serif" style={{
            fontSize: 16, lineHeight: 1.65, color: "var(--ink)",
            whiteSpace: "pre-wrap",
          }}>
            {viewedText}
          </div>
        </div>

        {/* pager */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 18,
        }}>
          <button
            onClick={() => olderIso && setViewingIso(olderIso)}
            disabled={!olderIso}
            className="ghost-btn"
            style={{
              fontSize: 12, fontStyle: "italic", padding: "6px 4px",
              color: olderIso ? "var(--ink-soft)" : "var(--ink-faint)",
              opacity: olderIso ? 1 : 0.4, cursor: olderIso ? "pointer" : "default",
            }}
          >← older</button>
          <div className="serif" style={{
            fontSize: 11, color: "var(--ink-faint)", fontStyle: "italic",
          }}>
            {idx + 1} of {entries.length}
          </div>
          <button
            onClick={() => newerIso && setViewingIso(newerIso)}
            disabled={!newerIso}
            className="ghost-btn"
            style={{
              fontSize: 12, fontStyle: "italic", padding: "6px 4px",
              color: newerIso ? "var(--ink-soft)" : "var(--ink-faint)",
              opacity: newerIso ? 1 : 0.4, cursor: newerIso ? "pointer" : "default",
            }}
          >newer →</button>
        </div>
      </div>
    );
  }

  // ---------- Write mode (today) ----------
  const hasHistory = entries.some(e => e.iso !== todayIso);

  return (
    <div className="screen fade-soft surface-journal" style={{padding: "44px 28px 32px", justifyContent: "flex-start"}}>
      <div className="surface-mark" aria-hidden="true"/>
      {/* header */}
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22}}>
        <button onClick={onClose} className="ghost-btn" style={{
          color: "var(--ink-soft)", padding: 0, fontSize: 14,
        }}>
          ← back
        </button>
        <div style={{display: "flex", alignItems: "center", gap: 14}}>
          <div className="kicker" style={{fontSize: 10}}>{weekday} · {dateStr}</div>
          {hasHistory && (
            <button onClick={() => setMode("calendar")} className="ghost-btn" style={{
              color: "var(--ink-soft)", fontSize: 12, fontStyle: "italic", padding: 0,
            }}>
              past
            </button>
          )}
        </div>
      </div>

      {/* prompt */}
      <div className="ascend" style={{marginBottom: 18}}>
        <div className="kicker" style={{marginBottom: 8}}>reflect a moment</div>
        <div className="serif" style={{
          fontSize: 22, color: "var(--ink)", lineHeight: 1.4, fontStyle: "italic",
          letterSpacing: "-0.005em",
        }}>
          {prompt}
        </div>
      </div>

      {/* writing surface */}
      <div className="ascend" style={{
        flex: 1, minHeight: 0, position: "relative",
        animationDelay: "120ms",
        background: "var(--paper-deep)",
        border: "1px solid var(--rule)",
        borderRadius: 4,
        padding: "18px 18px 14px",
        display: "flex", flexDirection: "column",
      }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="A few lines. No more than feels true."
          autoFocus
          style={{
            flex: 1, width: "100%", resize: "none",
            background: "transparent", border: "none", outline: "none",
            fontFamily: "var(--serif)", fontSize: 16,
            lineHeight: 1.65, color: "var(--ink)",
            fontStyle: text ? "normal" : "italic",
          }}
        />
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--rule)",
        }}>
          <div className="serif" style={{
            fontSize: 11, color: "var(--ink-faint)", fontStyle: "italic",
          }}>
            {savedAt
              ? "kept for today"
              : text
                ? "writing…"
                : "autosaved as you write"}
          </div>
          <div className="serif" style={{
            fontSize: 11, fontStyle: "italic",
            color: overSoft ? "var(--mark)" : "var(--ink-faint)",
          }}>
            {overSoft ? `${-remaining} over` : `${remaining} left`}
          </div>
        </div>
      </div>

      <div style={{display: "flex", flexDirection: "column", alignItems: "center", marginTop: 22, gap: 12}}>
        <button onClick={onClose} className="ascend" style={{
          background: "var(--ink)", color: "var(--paper)", border: "none",
          borderRadius: 999, padding: "12px 28px",
          fontFamily: "var(--serif)", fontSize: 15, cursor: "pointer",
          fontStyle: "italic", animationDelay: "200ms",
        }}>
          {text ? "kept. carry on" : "carry on"}
        </button>
        {hasHistory && (
          <button onClick={() => setMode("calendar")} className="ascend ghost-btn" style={{
            color: "var(--ink-soft)", fontSize: 12, fontStyle: "italic",
            padding: "4px 8px", animationDelay: "260ms",
          }}>
            past entries →
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Journal Calendar (entry-day picker) ----------
function JournalCalendar({ entries, todayIso, onPickToday, onPickPast, onClose }) {
  // Derive "today" from the prop so the calendar opens to the right month
  // when the 3am boundary is in effect (1-2am would otherwise show next
  // month with no highlighted today cell).
  const today = dateFromIso(todayIso);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const entrySet = new Set(entries.map(e => e.iso));

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build a 6-week grid (42 cells)
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    cells.push({ dt, iso: isoFromDate(dt), day: d });
  }
  while (cells.length < 42) cells.push(null);

  // Disable forward nav past current month
  const canGoForward =
    cursor.getFullYear() < today.getFullYear() ||
    (cursor.getFullYear() === today.getFullYear() && cursor.getMonth() < today.getMonth());

  function pick(cell) {
    if (!cell) return;
    if (cell.iso === todayIso) { onPickToday(); return; }
    if (entrySet.has(cell.iso)) onPickPast(cell.iso);
  }

  return (
    <div className="screen fade-soft surface-journal" style={{padding: "44px 28px 32px"}}>
      <div className="surface-mark" aria-hidden="true"/>
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22}}>
        <button onClick={onClose} className="ghost-btn" style={{
          color: "var(--ink-soft)", padding: 0, fontSize: 14,
        }}>
          ← back
        </button>
        <div className="kicker" style={{fontSize: 10}}>past entries</div>
      </div>

      {/* month nav */}
      <div className="ascend" style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 18,
      }}>
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="ghost-btn" style={{
          color: "var(--ink-soft)", fontSize: 18, padding: "6px 8px",
        }}>‹</button>
        <div className="serif" style={{fontSize: 18, color: "var(--ink)", fontStyle: "italic"}}>
          {monthLabel}
        </div>
        <button
          onClick={() => canGoForward && setCursor(new Date(year, month + 1, 1))}
          className="ghost-btn"
          disabled={!canGoForward}
          style={{
            color: canGoForward ? "var(--ink-soft)" : "var(--ink-faint)",
            fontSize: 18, padding: "6px 8px",
            opacity: canGoForward ? 1 : 0.3,
            cursor: canGoForward ? "pointer" : "default",
          }}
        >›</button>
      </div>

      {/* day headings */}
      <div className="ascend" style={{
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
        marginBottom: 8, animationDelay: "60ms",
      }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="kicker" style={{
            textAlign: "center", fontSize: 9, color: "var(--ink-faint)",
          }}>{d}</div>
        ))}
      </div>

      {/* grid */}
      <div className="ascend" style={{
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
        gap: 4, animationDelay: "120ms",
      }}>
        {cells.map((c, i) => {
          if (!c) return <div key={i} style={{aspectRatio: "1"}}/>;
          const isToday = c.iso === todayIso;
          const hasEntry = entrySet.has(c.iso);
          const selectable = isToday || hasEntry;
          return (
            <button
              key={i}
              onClick={() => pick(c)}
              disabled={!selectable}
              style={{
                aspectRatio: "1",
                background: hasEntry && !isToday ? "var(--paper-deep)" : "transparent",
                border: isToday ? "1.5px solid var(--accent)" :
                        hasEntry ? "1px solid var(--rule-strong)" :
                        "1px solid transparent",
                borderRadius: 4,
                fontFamily: "var(--serif)", fontSize: 14,
                color: selectable ? "var(--ink)" : "var(--ink-faint)",
                opacity: selectable ? 1 : 0.45,
                cursor: selectable ? "pointer" : "default",
                position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 160ms ease",
              }}
            >
              {c.day}
              {hasEntry && (
                <div style={{
                  position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)",
                  width: 4, height: 4, borderRadius: 50,
                  background: isToday ? "var(--accent)" : "var(--ink-soft)",
                }}/>
              )}
            </button>
          );
        })}
      </div>

      <div className="serif" style={{
        textAlign: "center", marginTop: 22,
        fontSize: 12, color: "var(--ink-faint)", fontStyle: "italic",
      }}>
        {entries.length === 1
          ? "1 entry kept"
          : `${entries.length} entries kept`}
      </div>
    </div>
  );
}

Object.assign(window, {
  ThreeBreaths, MeditateSetup, SquareBreath, MeditateActive,
  JOURNAL_PROMPTS, promptForDay, journalKeyFor, isoFromDate, dateFromIso,
  listJournalEntries, seedJournalIfEmpty,
  Journal, JournalCalendar,
});
