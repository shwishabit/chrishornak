/* SCANDISK Jam 3 — shared barebones core (FROZEN after the jam starts).
 * Plain 8x8 Othello pieces + a generic look-ahead search. Works in the browser (window.Core) and in node (require).
 * Teams build their own rules + legal moves ON TOP of this file. Do not edit it; ask, and a change goes to all teams.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Core = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var N = 8, EMPTY = 0, BLUE = 1, RED = 2;
  var DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  // Classic positional weights (corners good, squares next to corners bad).
  var W = [100, -20, 10, 5, 5, 10, -20, 100,
           -20, -50, -2, -2, -2, -2, -50, -20,
            10, -2, -1, -1, -1, -1, -2, 10,
             5, -2, -1, -1, -1, -1, -2, 5,
             5, -2, -1, -1, -1, -1, -2, 5,
            10, -2, -1, -1, -1, -1, -2, 10,
           -20, -50, -2, -2, -2, -2, -50, -20,
           100, -20, 10, 5, 5, 10, -20, 100];

  function other(side) { return 3 - side; }
  function idx(r, c) { return r * N + c; }
  function rc(i) { return [i >> 3, i & 7]; }

  // Standard start. Blue moves first. Returns a 64-array of EMPTY/BLUE/RED.
  function newBoard() {
    var b = [];
    for (var i = 0; i < 64; i++) b.push(EMPTY);
    b[27] = RED; b[36] = RED; b[28] = BLUE; b[35] = BLUE;
    return b;
  }

  // Every line a chip of `side` placed at i would trap. Each line = enemy indexes, ordered from the one
  // touching i outward. Types are ignored here — teams decide what types do to a line.
  function trapLines(b, i, side) {
    if (b[i] !== EMPTY) return [];
    var r = i >> 3, c = i & 7, o = other(side), out = [];
    for (var d = 0; d < 8; d++) {
      var rr = r + DIRS[d][0], cc = c + DIRS[d][1], line = [];
      while (rr >= 0 && rr < N && cc >= 0 && cc < N && b[rr * N + cc] === o) {
        line.push(rr * N + cc); rr += DIRS[d][0]; cc += DIRS[d][1];
      }
      if (line.length && rr >= 0 && rr < N && cc >= 0 && cc < N && b[rr * N + cc] === side) out.push(line);
    }
    return out;
  }

  // Plain Othello helpers (use them for the ?twist=0 mode).
  function plainMoves(b, side) {
    var m = [];
    for (var i = 0; i < 64; i++) if (b[i] === EMPTY && trapLines(b, i, side).length) m.push(i);
    return m;
  }
  function placePlain(b, i, side) {
    var n = b.slice(), lines = trapLines(b, i, side);
    n[i] = side;
    for (var l = 0; l < lines.length; l++) for (var k = 0; k < lines[l].length; k++) n[lines[l][k]] = side;
    return n;
  }
  function count(b) {
    var x = 0, y = 0;
    for (var i = 0; i < 64; i++) { if (b[i] === BLUE) x++; else if (b[i] === RED) y++; }
    return { 1: x, 2: y };
  }
  function empties(b) { var e = 0; for (var i = 0; i < 64; i++) if (b[i] === EMPTY) e++; return e; }

  // Three types in a circle: type t beats type (t+1)%3. Types are 0, 1, 2. Teams name them.
  function beats(a, b) { return (a + 1) % 3 === b; }

  // A plain board score from `side`'s view: position weights + mobility.
  function plainEval(b, side) {
    var s = 0, o = other(side);
    for (var i = 0; i < 64; i++) { if (b[i] === side) s += W[i]; else if (b[i] === o) s -= W[i]; }
    return s + 5 * (plainMoves(b, side).length - plainMoves(b, o).length);
  }

  // Seeded random (mulberry32). Pass rng() everywhere so ladder runs repeat exactly.
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Generic look-ahead for turn-based games. `g` is the team's game:
   *   g.turn(state) -> 1|2 · g.moves(state) -> array · g.apply(state, move) -> new state
   *   g.isOver(state) -> bool · g.evaluate(state, side) -> number (higher = better for side)
   * Handles a side moving twice in a row (e.g. a bonus move). Returns the score for the side to move.
   */
  function search(g, state, depth, alpha, beta) {
    if (depth === 0 || g.isOver(state)) return g.evaluate(state, g.turn(state));
    var ms = g.moves(state);
    if (!ms.length) return g.evaluate(state, g.turn(state));
    var me = g.turn(state), best = -Infinity;
    for (var j = 0; j < ms.length; j++) {
      var child = g.apply(state, ms[j]), v;
      if (g.turn(child) === me) v = search(g, child, depth - 1, alpha, beta);
      else v = -search(g, child, depth - 1, -beta, -alpha);
      if (v > best) best = v;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }

  /* Pick a move. level 0 = random · 1 = greedy (1 move ahead) · 2 = looks 2 ahead · 3 = looks 3 ahead.
   * Works for either side. Tiny random tie-break so games vary.
   */
  function bestMove(g, state, level, r) {
    var ms = g.moves(state);
    if (!ms.length) return null;
    if (level <= 0) return ms[Math.floor(r() * ms.length)];
    var me = g.turn(state), best = -Infinity, pick = ms[0];
    for (var j = 0; j < ms.length; j++) {
      var child = g.apply(state, ms[j]), v;
      if (level === 1 || g.isOver(child)) v = g.evaluate(child, me);
      else if (g.turn(child) === me) v = search(g, child, level - 1, -Infinity, Infinity);
      else v = -search(g, child, level - 1, -Infinity, Infinity);
      v += r() * 0.5;
      if (v > best) { best = v; pick = ms[j]; }
    }
    return pick;
  }

  return {
    N: N, EMPTY: EMPTY, BLUE: BLUE, RED: RED, DIRS: DIRS, W: W,
    other: other, idx: idx, rc: rc, newBoard: newBoard, trapLines: trapLines,
    plainMoves: plainMoves, placePlain: placePlain, count: count, empties: empties,
    beats: beats, plainEval: plainEval, rng: rng, search: search, bestMove: bestMove
  };
});
