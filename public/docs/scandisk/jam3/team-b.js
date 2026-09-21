/* SCANDISK Jam 3 — TEAM B: SURFACE SCAN.
 * Othello where a scan bar sweeps one row per move; in the scanned row, a file beside an enemy file that
 * beats its type switches sides (all at once). Types never affect flipping. Stuck side steers the scan.
 * Moves: placement = i*3 + type (0..191) · steer = STEER + row (stuck only) · PASS only in plain mode.
 * Types: 0 EXE, 1 TXT, 2 WAV. Core.beats(a,b): a beats (a+1)%3 -> EXE>TXT>WAV>EXE.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.TeamB = factory(root.Core);
})(typeof self !== 'undefined' ? self : this, function (Core) {
  var PASS = -1, STEER = 1000, TYPES = ['EXE', 'TXT', 'WAV'];

  function newGame(opts) {
    opts = opts || {};
    var tw = opts.twist !== false && opts.twist !== 0;
    var b = Core.newBoard(), ty = [];
    for (var i = 0; i < 64; i++) ty.push(-1);
    if (tw) {
      // Random but fair: seeded start types, mirrored so blue and red hold the same pair.
      var r = Core.rng((opts.seed || 1) * 7919 + 13);
      var t1 = Math.floor(r() * 3), t2 = Math.floor(r() * 3);
      ty[28] = t1; ty[27] = t1; ty[35] = t2; ty[36] = t2;
    }
    return { tw: tw, b: b, ty: ty, turn: Core.BLUE, scan: 0, stuck: { 1: 0, 2: 0 }, turns: 0, log: [] };
  }
  function turn(s) { return s.turn; }

  function moves(s) {
    var side = s.turn, sq = Core.plainMoves(s.b, side);
    if (!s.tw) {
      if (sq.length) return sq;
      return Core.plainMoves(s.b, Core.other(side)).length ? [PASS] : [];
    }
    var m = [];
    for (var j = 0; j < sq.length; j++) for (var t = 0; t < 3; t++) m.push(sq[j] * 3 + t);
    if (m.length) return m;
    // Stuck: steer the scan — only while the other side can still write (so the game can't loop).
    if (!Core.plainMoves(s.b, Core.other(side)).length) return [];
    for (var row = 0; row < 8; row++) m.push(STEER + row);
    return m;
  }

  // Resolve a scan of `row` on board b / types ty. Returns list of switched squares.
  function scanRow(b, ty, row) {
    var sw = [];
    for (var c = 0; c < 8; c++) {
      var i = row * 8 + c; if (b[i] === Core.EMPTY) continue;
      var nb = [];
      if (c > 0) nb.push(i - 1);
      if (c < 7) nb.push(i + 1);
      for (var k = 0; k < nb.length; k++) {
        var j = nb[k];
        if (b[j] !== Core.EMPTY && b[j] !== b[i] && Core.beats(ty[j], ty[i])) { sw.push(i); break; }
      }
    }
    for (var q = 0; q < sw.length; q++) b[sw[q]] = Core.other(b[sw[q]]);
    return sw;
  }

  function apply(s, mv) {
    var n = { tw: s.tw, b: s.b, ty: s.ty, turn: Core.other(s.turn), scan: s.scan,
              stuck: { 1: s.stuck[1], 2: s.stuck[2] }, turns: s.turns + 1, log: null, last: -1, switched: [], scanned: -1 };
    if (!s.tw) {
      if (mv === PASS) { n.stuck[s.turn]++; return n; }
      n.b = Core.placePlain(s.b, mv, s.turn); n.last = mv; return n;
    }
    var b = s.b.slice(), ty = s.ty.slice(), row;
    if (mv >= STEER) {
      n.stuck[s.turn]++; row = mv - STEER;
    } else {
      var i = Math.floor(mv / 3), t = mv % 3, lines = Core.trapLines(b, i, s.turn);
      b[i] = s.turn; ty[i] = t;
      for (var l = 0; l < lines.length; l++) for (var k = 0; k < lines[l].length; k++) b[lines[l][k]] = s.turn;
      row = s.scan; n.last = i;
    }
    n.switched = scanRow(b, ty, row);
    n.scanned = row;
    n.scan = (row + 1) % 8;
    n.b = b; n.ty = ty;
    return n;
  }

  function isOver(s) { return moves(s).length === 0; }
  function winner(s) {
    var k = Core.count(s.b);
    return k[1] > k[2] ? 1 : k[2] > k[1] ? 2 : 0;
  }

  // Board score: position weights + a little material + the threat waiting in the next scan row.
  function evaluate(s, side) {
    var o = Core.other(side), k;
    if (isOver(s)) { k = Core.count(s.b); return (k[side] - k[o]) * 1000; }
    if (!s.tw) return Core.plainEval(s.b, side);
    var v = 0, b = s.b;
    for (var i = 0; i < 64; i++) { if (b[i] === side) v += Core.W[i] + 4; else if (b[i] === o) v -= Core.W[i] + 4; }
    // Preview the next scan: switches are worth a lot, weighted by who moves before it lands.
    var b2 = b.slice(), sw = scanRow(b2, s.ty, s.scan);
    for (var q = 0; q < sw.length; q++) v += (b2[sw[q]] === side ? 1 : -1) * 6;
    return v;
  }

  var G = { turn: turn, moves: moves, apply: apply, isOver: isOver, evaluate: evaluate };
  function botMove(s, level, r) { return Core.bestMove(G, s, Math.min(level, 3), r); }
  function stats(s) { return { stuck: s.stuck, turns: s.turns }; }
  function playGame(levelBlue, levelRed, seed, twist) {
    var r = Core.rng(seed), s = newGame({ twist: twist, seed: seed });
    while (!isOver(s) && s.turns < 400) s = apply(s, botMove(s, s.turn === 1 ? levelBlue : levelRed, r));
    return { winner: winner(s), stuck: s.stuck, turns: s.turns, fill: 64 - Core.empties(s.b) };
  }

  return { PASS: PASS, STEER: STEER, TYPES: TYPES, newGame: newGame, turn: turn, moves: moves, apply: apply,
           isOver: isOver, winner: winner, evaluate: evaluate, botMove: botMove, stats: stats, playGame: playGame,
           scanRow: scanRow };
});
