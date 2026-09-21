/* SCANDISK Jam 3 · Team A · RESCAN
 * Othello + three file types (0 SYS > 1 EXE > 2 DAT > 0 SYS, via Core.beats).
 *  - GUARD: a trapped line won't flip if it holds a chip whose type beats the placed/firing chip.
 *  - RESCAN: a flipped chip that the firing chip beats fires its own lines (chain, breadth-first).
 *  - LOCK: you can't place the type you placed last turn.
 *  - QUARANTINE: no flip available -> place any type on an empty square next to your own chip, no flip.
 *  - END: board full, side to move can't place at all, or 200-turn cap. Most chips wins.
 * Twist moves are encoded sq*8 + type + (quarantine ? 4 : 0). twist:false = plain Othello (Plain rules, PASS = -1).
 * Same exports as plain.js. The UI and the bot both use moves(s).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.TeamA = factory(root.Core);
})(typeof self !== 'undefined' ? self : this, function (Core) {
  var PASS = -1, CAP = 200, TYPES = ['SYS', 'EXE', 'DAT'];

  function enc(sq, type, quiet) { return sq * 8 + type + (quiet ? 4 : 0); }
  function dec(mv) { return { sq: mv >> 3, type: mv & 3, quiet: !!(mv & 4) }; }

  function newGame(opts) {
    var twist = !opts || opts.twist === undefined ? true : !!opts.twist;
    var t = []; for (var i = 0; i < 64; i++) t.push(-1);
    t[28] = 0; t[35] = 1; t[36] = 0; t[27] = 1; // blue SYS/EXE, red SYS/EXE (180-degree symmetric)
    return { b: Core.newBoard(), t: t, turn: Core.BLUE, lock: { 1: -1, 2: -1 }, stuck: { 1: 0, 2: 0 },
             turns: 0, twist: twist, last: -1, flipped: [], rescans: 0, quiet: false };
  }
  function turn(s) { return s.turn; }

  // Lines a chip of `side` sitting at j would trap (j may be occupied — used for rescans).
  function linesFrom(b, j, side) {
    var r = j >> 3, c = j & 7, o = Core.other(side), out = [];
    for (var d = 0; d < 8; d++) {
      var dr = Core.DIRS[d][0], dc = Core.DIRS[d][1], rr = r + dr, cc = c + dc, line = [];
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === o) { line.push(rr * 8 + cc); rr += dr; cc += dc; }
      if (line.length && rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === side) out.push(line);
    }
    return out;
  }
  function guarded(t, line, type) {
    for (var k = 0; k < line.length; k++) if (Core.beats(t[line[k]], type)) return true;
    return false;
  }
  function canFlip(s, i, type, side) {
    var lines = Core.trapLines(s.b, i, side);
    for (var l = 0; l < lines.length; l++) if (!guarded(s.t, lines[l], type)) return true;
    return false;
  }
  function adjOwn(b, i, side) {
    var r = i >> 3, c = i & 7;
    for (var d = 0; d < 8; d++) {
      var rr = r + Core.DIRS[d][0], cc = c + Core.DIRS[d][1];
      if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === side) return true;
    }
    return false;
  }

  function moves(s) {
    if (s._m) return s._m;
    var m = [], i, ty;
    if (!s.twist) {
      m = Core.plainMoves(s.b, s.turn);
      if (!m.length && s.turns < CAP) m = Core.plainMoves(s.b, Core.other(s.turn)).length ? [PASS] : [];
      if (s.turns >= CAP) m = [];
      return (s._m = m);
    }
    if (s.turns >= CAP) return (s._m = m);
    for (i = 0; i < 64; i++) {
      if (s.b[i] !== Core.EMPTY) continue;
      for (ty = 0; ty < 3; ty++) if (ty !== s.lock[s.turn] && canFlip(s, i, ty, s.turn)) m.push(enc(i, ty, false));
    }
    if (!m.length) { // QUARANTINE: stuck side still places, any type, next to its own chip, no flip
      for (i = 0; i < 64; i++) if (s.b[i] === Core.EMPTY && adjOwn(s.b, i, s.turn))
        for (ty = 0; ty < 3; ty++) m.push(enc(i, ty, true));
    }
    return (s._m = m);
  }

  function apply(s, mv) {
    var side = s.turn;
    var n = { b: s.b, t: s.t, turn: Core.other(side), lock: { 1: s.lock[1], 2: s.lock[2] },
              stuck: { 1: s.stuck[1], 2: s.stuck[2] }, turns: s.turns + 1, twist: s.twist,
              last: -1, flipped: [], rescans: 0, quiet: false };
    if (!s.twist) {
      if (mv === PASS) { n.stuck[side]++; return n; }
      n.b = Core.placePlain(s.b, mv, side); n.last = mv; return n;
    }
    var m = dec(mv), b = s.b.slice(), t = s.t.slice();
    b[m.sq] = side; t[m.sq] = m.type; n.last = m.sq; n.lock[side] = m.type;
    if (m.quiet) { n.stuck[side]++; n.quiet = true; n.b = b; n.t = t; return n; }
    var queue = [m.sq], q = 0;
    while (q < queue.length) {
      var j = queue[q++], tj = t[j], lines = linesFrom(b, j, side);
      if (q > 1) n.rescans++;
      for (var l = 0; l < lines.length; l++) {
        if (guarded(t, lines[l], tj)) continue;
        for (var k = 0; k < lines[l].length; k++) {
          var x = lines[l][k];
          if (b[x] === side) continue; // already flipped by an earlier line this turn
          b[x] = side; n.flipped.push(x);
          if (Core.beats(tj, t[x])) queue.push(x);
        }
      }
    }
    n.b = b; n.t = t;
    return n;
  }

  function isOver(s) { return Core.empties(s.b) === 0 || moves(s).length === 0; }
  function winner(s) { var k = Core.count(s.b); return k[1] > k[2] ? 1 : k[2] > k[1] ? 2 : 0; }
  function evaluate(s, side) {
    if (isOver(s)) { var k = Core.count(s.b); return (k[side] - k[Core.other(side)]) * 1000; }
    return Core.plainEval(s.b, side);
  }
  var G = { turn: turn, moves: moves, apply: apply, isOver: isOver, evaluate: evaluate };
  function botMove(s, level, r) { return Core.bestMove(G, s, Math.max(0, Math.min(3, level)), r); }
  function stats(s) { return { stuck: s.stuck, turns: s.turns }; }
  function playGame(levelBlue, levelRed, seed, twist) {
    var r = Core.rng(seed), s = newGame({ twist: twist, seed: seed });
    while (!isOver(s)) s = apply(s, botMove(s, s.turn === 1 ? levelBlue : levelRed, r));
    return { winner: winner(s), stuck: s.stuck, turns: s.turns, fill: 64 - Core.empties(s.b) };
  }

  return { PASS: PASS, TYPES: TYPES, enc: enc, dec: dec, newGame: newGame, turn: turn, moves: moves, apply: apply,
           isOver: isOver, winner: winner, evaluate: evaluate, botMove: botMove, stats: stats, playGame: playGame };
});
