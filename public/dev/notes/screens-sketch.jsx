/* The Daily Now — sketchbook (deferred-loaded) */
/* Page 2 of the Journal notebook spread. Pointer-event drawing on <canvas>
   for live editing; SVG render for view-only past days. Vector eraser
   removes whole strokes (no pixel scrubbing) — keeps storage clean and
   SVG/canvas renders identical. Storage:
     ${STORAGE_NS}:sketchbook.YYYY-MM-DD → {strokes:[{points:[{x,y}], width, tool}]}
   Debounced 800ms autosave, mirrors Journal's 600ms cadence (slightly
   longer because strokes are commits, not keystrokes).
*/
/* eslint-disable */

const { useState, useEffect, useRef, useCallback } = React;

const ERASER_RADIUS = 14;

function sketchKeyForIso(iso) {
  return `${window.STORAGE_NS || "dn"}:sketchbook.${iso}`;
}

function loadStrokes(iso) {
  try {
    const raw = localStorage.getItem(sketchKeyForIso(iso));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed && parsed.strokes) ? parsed.strokes : [];
  } catch (e) { return []; }
}

function saveStrokes(iso, strokes) {
  try {
    const key = sketchKeyForIso(iso);
    if (!strokes || strokes.length === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify({ strokes }));
    }
  } catch (e) {}
}

function strokeToPath(stroke) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  return d;
}

function drawStrokeOnCanvas(ctx, stroke, ink) {
  const pts = stroke.points;
  if (!pts || pts.length < 1) return;
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = stroke.width || 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, (stroke.width || 2) / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}

function distPtToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function strokePassesNear(stroke, pt, radius) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return false;
  if (pts.length === 1) return Math.hypot(pts[0].x - pt.x, pts[0].y - pt.y) <= radius;
  for (let i = 1; i < pts.length; i++) {
    if (distPtToSegment(pt, pts[i - 1], pts[i]) <= radius) return true;
  }
  return false;
}

// Live-editable canvas surface. Used on today + on past days when user
// taps "edit". Owns its own stroke state + autosave debounce.
function SketchCanvasSurface({ iso }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [strokes, setStrokes] = useState(() => loadStrokes(iso));
  const [tool, setTool] = useState("pencil");
  const drawingRef = useRef(null);
  const dirtyRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const inkColorRef = useRef("#1F1A14");
  const [, setRenderTick] = useState(0);

  // Reload on iso change (day flip mid-session, or admin force-next-day).
  useEffect(() => {
    setStrokes(loadStrokes(iso));
    drawingRef.current = null;
    dirtyRef.current = false;
  }, [iso]);

  // Resolve --ink for canvas (CSS variables don't apply to canvas pixels).
  // The container has color: var(--ink), so getComputedStyle reads the
  // resolved value as the literal hex/rgb the theme produced.
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      const c = getComputedStyle(canvasRef.current).color;
      if (c) inkColorRef.current = c;
    } catch (e) {}
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h, dpr } = sizeRef.current;
    if (!w || !h) return;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    const ink = inkColorRef.current;
    for (const s of strokes) drawStrokeOnCanvas(ctx, s, ink);
    if (drawingRef.current) drawStrokeOnCanvas(ctx, drawingRef.current, ink);
  }, [strokes]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    sizeRef.current = { w: rect.width, h: rect.height, dpr };
    redraw();
  }, [redraw]);

  useEffect(() => { resize(); }, [resize]);
  useEffect(() => { redraw(); }, [redraw]);

  useEffect(() => {
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resize]);

  useEffect(() => {
    if (!dirtyRef.current) return;
    const id = setTimeout(() => { saveStrokes(iso, strokes); }, 800);
    return () => clearTimeout(id);
  }, [strokes, iso]);

  function pointFromEvent(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e) {
    if (!canvasRef.current) return;
    e.stopPropagation();
    try { canvasRef.current.setPointerCapture(e.pointerId); } catch (_) {}
    const pt = pointFromEvent(e);
    if (tool === "pencil") {
      // Per-stroke width: stylus pressure-aware, finger constant. Per-point
      // pressure intentionally not stored — simpler render, easier reload.
      let width = 2;
      if (e.pointerType === "pen" && e.pressure > 0) {
        width = 2 * (0.65 + 0.85 * e.pressure);
      }
      drawingRef.current = { points: [pt], width, tool: "ink" };
      setRenderTick(t => t + 1);
    } else {
      eraseAt(pt);
    }
  }

  function eraseAt(pt) {
    setStrokes(prev => {
      const filtered = prev.filter(s => !strokePassesNear(s, pt, ERASER_RADIUS));
      if (filtered.length !== prev.length) {
        dirtyRef.current = true;
        return filtered;
      }
      return prev;
    });
  }

  function onPointerMove(e) {
    if (!canvasRef.current) return;
    if (!canvasRef.current.hasPointerCapture(e.pointerId)) return;
    e.stopPropagation();
    const pt = pointFromEvent(e);
    if (tool === "pencil" && drawingRef.current) {
      drawingRef.current.points.push(pt);
      setRenderTick(t => t + 1);
    } else if (tool === "eraser") {
      eraseAt(pt);
    }
  }

  function onPointerUp(e) {
    if (!canvasRef.current) return;
    try { canvasRef.current.releasePointerCapture(e.pointerId); } catch (_) {}
    if (tool === "pencil" && drawingRef.current) {
      const stroke = drawingRef.current;
      drawingRef.current = null;
      if (stroke.points.length > 0) {
        setStrokes(prev => { dirtyRef.current = true; return [...prev, stroke]; });
      } else {
        setRenderTick(t => t + 1);
      }
    }
  }

  const isEmpty = strokes.length === 0 && !drawingRef.current;

  return (
    <>
      <div
        ref={containerRef}
        className="sketch-surface"
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          background: "var(--paper-deep)",
          border: "1px solid var(--rule)",
          borderRadius: 4,
          overflow: "hidden",
          color: "var(--ink)",
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            touchAction: "none",
            cursor: tool === "eraser" ? "cell" : "crosshair",
          }}
        />
        {isEmpty && (
          <div className="serif sketch-blank" aria-hidden="true">
            the page is blank
          </div>
        )}
      </div>
      <div className="sketch-toolbar">
        <button
          onClick={() => setTool("pencil")}
          aria-label="pencil"
          aria-pressed={tool === "pencil"}
          className={`sketch-tool ${tool === "pencil" ? "sketch-tool--active" : ""}`}
        >
          <Icon name="pencil" size={16}/>
        </button>
        <button
          onClick={() => setTool("eraser")}
          aria-label="eraser"
          aria-pressed={tool === "eraser"}
          className={`sketch-tool ${tool === "eraser" ? "sketch-tool--active" : ""}`}
        >
          <Icon name="eraser" size={16}/>
        </button>
      </div>
    </>
  );
}

// Read-only render of saved strokes for past days. No pointer events,
// no edit buffer. Container measures itself so the SVG viewBox matches
// the original drawing coordinate space — strokes were captured in
// pixel coords inside a same-shaped container at draw time, so a 1:1
// viewBox preserves placement when the phone-frame width is constant.
function SketchSVGView({ strokes }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const measure = () => {
      const r = ref.current && ref.current.getBoundingClientRect();
      if (r) setSize({ w: r.width, h: r.height });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div
      ref={ref}
      className="sketch-surface"
      style={{
        flex: 1,
        minHeight: 0,
        position: "relative",
        background: "var(--paper-deep)",
        border: "1px solid var(--rule)",
        borderRadius: 4,
        overflow: "hidden",
        color: "var(--ink)",
      }}
    >
      {strokes.length > 0 && size.w > 0 && (
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${size.w} ${size.h}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block" }}
        >
          {strokes.map((s, i) => (
            <path
              key={i}
              d={strokeToPath(s)}
              fill="none"
              stroke="currentColor"
              strokeWidth={s.width || 2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      )}
      {strokes.length === 0 && (
        <div className="serif sketch-blank" aria-hidden="true">
          nothing drawn this day
        </div>
      )}
    </div>
  );
}

// Past-day view container. Defaults to read-only SVG; "edit" toggles to
// the live canvas (which immediately autosaves into that day's slot).
function SketchView({ iso }) {
  const [editing, setEditing] = useState(false);
  const [strokes, setStrokes] = useState(() => loadStrokes(iso));

  useEffect(() => {
    setEditing(false);
    setStrokes(loadStrokes(iso));
  }, [iso]);

  if (editing) return <SketchCanvasSurface iso={iso}/>;

  return (
    <>
      <SketchSVGView strokes={strokes}/>
      <div className="sketch-toolbar sketch-toolbar--view">
        <button
          onClick={() => setEditing(true)}
          className="ghost-btn"
          style={{
            color: "var(--ink-soft)", fontSize: 12, fontStyle: "italic",
            fontFamily: "var(--serif)", padding: "6px 8px",
          }}
        >
          edit
        </button>
      </div>
    </>
  );
}

// Resolves the day's prompt from sketch-prompts.js (window.sketchPromptForDate).
// Falls back to a plain "draw a while" if the bank hasn't loaded yet.
function sketchPromptFor(iso) {
  try {
    if (window.sketchPromptForDate && window.dateFromIso) {
      const d = window.dateFromIso(iso);
      const p = window.sketchPromptForDate(d);
      if (p) return p;
    }
  } catch (e) {}
  return "draw a while";
}

// SketchPage = the inside of page 2. Renders the prompt header + either
// the editable canvas (today) or the read-only SVG view with edit toggle
// (past days). Outer page chrome (header bar, page indicator, swipe handler)
// lives in Journal — this component is content only.
function SketchPage({ iso, isToday }) {
  const promptText = sketchPromptFor(iso);
  return (
    <>
      <div className="ascend" style={{marginBottom: 14}}>
        <div className="kicker" style={{marginBottom: 8}}>sketch</div>
        <div className="serif" style={{
          fontSize: 19, color: "var(--ink)", lineHeight: 1.4, fontStyle: "italic",
          letterSpacing: "-0.005em",
        }}>
          {promptText}
        </div>
      </div>
      {isToday ? <SketchCanvasSurface iso={iso}/> : <SketchView iso={iso}/>}
    </>
  );
}

Object.assign(window, {
  sketchKeyForIso, loadStrokes, saveStrokes, sketchPromptFor,
  SketchCanvasSurface, SketchSVGView, SketchView, SketchPage,
});
