/* SCANDISK Jam 3 — Team C: CROSS-LINKED.
 * Plain Othello lines (type-blind) + one touch rule: the file you write turns each orthogonal enemy neighbour
 * whose type it beats. Types never change; only colour does. No passes: a stuck side makes a quiet write.
 * Move encoding (twist on): i*3 + t  (a turning write) · QUIET + i*3 + t (a quiet write). Twist off: i, or PASS.
 * UI and bot both use moves(s). Browser global: TeamC.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.TeamC = factory(root.Core);
})(typeof self !== 'undefined' ? self : this, function (Core) {
  var PASS = -1, QUIET = 1000;
  var NAMES = ['BAT', 'TXT', 'WAV'];           // BAT beats TXT beats WAV beats BAT (Core.beats)
  var ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function newGame(opts) {
    opts = opts || {};
    var twist = opts.twist !== false && opts.twist !== 0;
    var ty = []; for (var i = 0; i < 64; i++) ty.push(-1);
    // Start: each side holds one TXT and one WAV... mirrored so neither side starts ahead.
    ty[27] = 2; ty[36] = 1; ty[28] = 1; ty[35] = 2;
    return { twist: twist, b: Core.newBoard(), ty: ty, turn: Core.BLUE, stuck: { 1: 0, 2: 0 }, turns: 0, passes: 0 };
  }
  function turn(s) { return s.turn; }

  function bites(s, i, t, side) {
    var o = Core.other(side), r = i >> 3, c = i & 7, out = [];
    for (var d = 0; d < 4; d++) {
      var rr = r + ORTH[d][0], cc = c + ORTH[d][1];
      if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
      var n = rr * 8 + cc;
      if (s.b[n] === o && Core.beats(t, s.ty[n])) out.push(n);
    }
    return out;
  }
  function touchesOwn(b, i, side) {
    var r = i >> 3, c = i & 7;
    for (var d = 0; d < 8; d++) {
      var rr = r + Core.DIRS[d][0], cc = c + Core.DIRS[d][1];
      if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === side) return true;
    }
    return false;
  }

  function moves(s) {
    if (!s.twist) {
      var m = Core.plainMoves(s.b, s.turn);
      if (m.length) return m;
      return Core.plainMoves(s.b, Core.other(s.turn)).length ? [PASS] : [];
    }
    if (isOver(s)) return [];
    var out = [], i, t;
    for (i = 0; i < 64; i++) {
      if (s.b[i] !== Core.EMPTY) continue;
      var hasLine = Core.trapLines(s.b, i, s.turn).length > 0;
      for (t = 0; t < 3; t++) if (hasLine || bites(s, i, t, s.turn).length) out.push(i * 3 + t);
    }
    if (out.length) return out;
    // Stuck: quiet write next to own chips (or anywhere if none touch).
    var sq = [];
    for (i = 0; i < 64; i++) if (s.b[i] === Core.EMPTY && touchesOwn(s.b, i, s.turn)) sq.push(i);
    if (!sq.length) for (i = 0; i < 64; i++) if (s.b[i] === Core.EMPTY) sq.push(i);
    for (var k = 0; k < sq.length; k++) for (t = 0; t < 3; t++) out.push(QUIET + sq[k] * 3 + t);
    return out;
  }

  // What a move turns (for the UI preview and apply). Returns { i, t, quiet, line: [...], bite: [...] }.
  function decode(s, mv) {
    var quiet = mv >= QUIET, v = quiet ? mv - QUIET : mv, i = Math.floor(v / 3), t = v % 3;
    var line = [], bite = [];
    if (!quiet) {
      var ls = Core.trapLines(s.b, i, s.turn);
      for (var l = 0; l < ls.length; l++) for (var k = 0; k < ls[l].length; k++) line.push(ls[l][k]);
      bite = bites(s, i, t, s.turn).filter(function (n) { return line.indexOf(n) < 0; });
    }
    return { i: i, t: t, quiet: quiet, line: line, bite: bite };
  }

  function apply(s, mv) {
    var n = { twist: s.twist, b: s.b, ty: s.ty, turn: Core.other(s.turn), stuck: { 1: s.stuck[1], 2: s.stuck[2] },
              turns: s.turns + 1, passes: s.passes, last: mv };
    if (!s.twist) {
      if (mv === PASS) { n.stuck[s.turn]++; n.passes++; return n; }
      n.b = Core.placePlain(s.b, mv, s.turn); return n;
    }
    var d = decode(s, mv), b = s.b.slice(), ty = s.ty.slice();
    if (d.quiet) n.stuck[s.turn]++;
    b[d.i] = s.turn; ty[d.i] = d.t;
    for (var k = 0; k < d.line.length; k++) b[d.line[k]] = s.turn;
    for (k = 0; k < d.bite.length; k++) b[d.bite[k]] = s.turn;
    n.b = b; n.ty = ty;
    return n;
  }

  function isOver(s) {
    if (!s.twist) return moves(s).length === 0;
    var k = Core.count(s.b);
    return Core.empties(s.b) === 0 || k[1] === 0 || k[2] === 0;
  }
  function winner(s) {
    var k = Core.count(s.b);
    return k[1] > k[2] ? 1 : k[2] > k[1] ? 2 : 0;
  }
  function evaluate(s, side) {
    var o = Core.other(side);
    if (isOver(s)) { var k = Core.count(s.b); return (k[side] - k[o]) * 1000; }
    if (!s.twist) return Core.plainEval(s.b, side);
    var v = 0;
    for (var i = 0; i < 64; i++) {
      if (s.b[i] === Core.EMPTY) continue;
      // Exposure: a chip with an empty square beside it can be cross-linked away.
      var ex = 0, r = i >> 3, c = i & 7;
      for (var d = 0; d < 4; d++) {
        var rr = r + ORTH[d][0], cc = c + ORTH[d][1];
        if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && s.b[rr * 8 + cc] === Core.EMPTY) ex++;
      }
      var w = Core.W[i] + 3 - 2 * ex;
      if (s.b[i] === side) v += w; else v -= w;
    }
    return v;
  }
  var G = { turn: turn, moves: moves, apply: apply, isOver: isOver, evaluate: evaluate };
  function botMove(s, level, r) { return Core.bestMove(G, s, Math.max(0, Math.min(3, level)), r); }
  function stats(s) { return { stuck: s.stuck, turns: s.turns }; }
  function playGame(levelBlue, levelRed, seed, twist) {
    var r = Core.rng(seed), s = newGame({ twist: twist, seed: seed });
    while (!isOver(s) && s.turns < 400) {
      var mv = botMove(s, s.turn === 1 ? levelBlue : levelRed, r);
      if (mv === null) break;
      s = apply(s, mv);
    }
    return { winner: winner(s), stuck: s.stuck, turns: s.turns, fill: 64 - Core.empties(s.b) };
  }

  return { PASS: PASS, QUIET: QUIET, NAMES: NAMES, newGame: newGame, turn: turn, moves: moves, decode: decode,
           apply: apply, isOver: isOver, winner: winner, evaluate: evaluate, botMove: botMove, stats: stats,
           playGame: playGame };
});
