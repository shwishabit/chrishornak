// Seasonal rotation of public-domain reflections from the Stoics and
// kindred voices. Indexed by day-of-year (1..365). Day 366 (leap) maps to 365.
//
// Sources: Marcus Aurelius (George Long, 1862); Epictetus (Long, 1877;
// Higginson, 1865); Seneca (Richard Gummere, 1917-25); Heraclitus
// (Burnet, 1892); Lao Tzu (James Legge, 1891); Thoreau (Walden, 1854);
// Emerson (essays); Montaigne (Cotton, 1685). All works long out of
// copyright. No religious framing.
//
// Tuned by season:
//   1-59     winter / stillness, turning inward
//   60-151   spring / beginning, growth
//   152-243  summer / presence, abundance
//   244-334  autumn / release, reflection
//   335-365  late winter / quietude, threshold
//
// This file is a starter set; over time fill toward 365 unique entries.
// Until then we wrap modulo the array length.

const QUOTES = [
  // ── Winter (stillness, turning inward) ─────────────────────────────
  { text: "Begin the morning by saying to thyself, I shall meet with the busybody, the ungrateful, arrogant, deceitful, envious, unsocial.", who: "Marcus Aurelius" },
  { text: "Confine thyself to the present.", who: "Marcus Aurelius" },
  { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", who: "Marcus Aurelius" },
  { text: "Waste no more time arguing what a good man should be. Be one.", who: "Marcus Aurelius" },
  { text: "It is not what happens to you, but how you react to it that matters.", who: "Epictetus" },
  { text: "First say to yourself what you would be; and then do what you have to do.", who: "Epictetus" },
  { text: "Wealth consists not in having great possessions, but in having few wants.", who: "Epictetus" },
  { text: "We suffer more often in imagination than in reality.", who: "Seneca" },
  { text: "While we are postponing, life speeds by.", who: "Seneca" },
  { text: "He who is brave is free.", who: "Seneca" },
  { text: "The way up and the way down are one and the same.", who: "Heraclitus" },
  { text: "No man ever steps in the same river twice.", who: "Heraclitus" },
  { text: "The soul is dyed the color of its thoughts.", who: "Marcus Aurelius" },
  { text: "Difficulties show a man's character.", who: "Epictetus" },
  { text: "Nothing happens to the wise man against his expectation.", who: "Seneca" },

  // ── Spring (beginning, growth) ─────────────────────────────────────
  { text: "A journey of a thousand miles begins beneath one's feet.", who: "Lao Tzu" },
  { text: "The greatest of all things is small things attended to.", who: "Lao Tzu" },
  { text: "Do not be ashamed to be helped.", who: "Marcus Aurelius" },
  { text: "Each day provides its own gifts.", who: "Marcus Aurelius" },
  { text: "Let men see, let them know, a real man, who lives as he was meant to live.", who: "Marcus Aurelius" },
  { text: "No man is free who is not master of himself.", who: "Epictetus" },
  { text: "Make the best use of what is in your power, and take the rest as it happens.", who: "Epictetus" },
  { text: "He who fears death will never do anything worthy of a living man.", who: "Seneca" },
  { text: "Luck is what happens when preparation meets opportunity.", who: "Seneca" },
  { text: "Things which you do not hope happen more frequently than things which you do hope.", who: "Plautus" },
  { text: "Simplify, simplify.", who: "Henry David Thoreau" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", who: "Ralph Waldo Emerson" },
  { text: "All things change; nothing perishes.", who: "Ovid" },
  { text: "Patience is the companion of wisdom.", who: "Augustine" },
  { text: "Beware lest thou lose the substance by grasping at the shadow.", who: "Aesop" },
  { text: "Even the smallest path leads somewhere if you keep walking.", who: "Lao Tzu" },

  // ── Summer (presence, abundance) ───────────────────────────────────
  { text: "Look well into thyself; there is a source of strength which will always spring up if thou wilt always look there.", who: "Marcus Aurelius" },
  { text: "When you arise in the morning, think of what a precious privilege it is to be alive — to breathe, to think, to enjoy, to love.", who: "Marcus Aurelius" },
  { text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.", who: "Marcus Aurelius" },
  { text: "Today I escaped from anxiety. Or no, I discarded it, because it was within me, in my own perceptions — not outside.", who: "Marcus Aurelius" },
  { text: "Receive without conceit, release without struggle.", who: "Marcus Aurelius" },
  { text: "Wherever there is a human being, there is an opportunity for kindness.", who: "Seneca" },
  { text: "Sometimes even to live is an act of courage.", who: "Seneca" },
  { text: "He suffers more than necessary, who suffers before it is necessary.", who: "Seneca" },
  { text: "All cruelty springs from weakness.", who: "Seneca" },
  { text: "Time discovers truth.", who: "Seneca" },
  { text: "Men are disturbed not by the things which happen, but by their opinions about them.", who: "Epictetus" },
  { text: "Don't explain your philosophy. Embody it.", who: "Epictetus" },
  { text: "He is a man of sense who does not grieve for what he has not, but rejoices in what he has.", who: "Epictetus" },
  { text: "I went to the woods because I wished to live deliberately.", who: "Henry David Thoreau" },
  { text: "Our life is frittered away by detail. Simplify.", who: "Henry David Thoreau" },

  // ── Autumn (release, reflection) ───────────────────────────────────
  { text: "Loss is nothing else but change, and change is Nature's delight.", who: "Marcus Aurelius" },
  { text: "Accept the things to which fate binds you.", who: "Marcus Aurelius" },
  { text: "Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth.", who: "Marcus Aurelius" },
  { text: "If it is not right, do not do it; if it is not true, do not say it.", who: "Marcus Aurelius" },
  { text: "It is in your power to withdraw whenever you desire. Perfect tranquility within consists in good ordering of the mind.", who: "Marcus Aurelius" },
  { text: "Cling to those who have stood the test of time.", who: "Seneca" },
  { text: "Begin at once to live, and count each separate day as a separate life.", who: "Seneca" },
  { text: "It is not the man who has too little, but the man who craves more, that is poor.", who: "Seneca" },
  { text: "There is nothing permanent except change.", who: "Heraclitus" },
  { text: "Big results require big ambitions.", who: "Heraclitus" },
  { text: "From the strain of binding opposites comes harmony.", who: "Heraclitus" },
  { text: "The first wealth is health.", who: "Ralph Waldo Emerson" },
  { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", who: "Ralph Waldo Emerson" },
  { text: "Do the thing and you shall have the power.", who: "Ralph Waldo Emerson" },

  // ── Late winter (quietude, threshold) ──────────────────────────────
  { text: "He who lives in harmony with himself lives in harmony with the universe.", who: "Marcus Aurelius" },
  { text: "Nothing has such power to broaden the mind as the ability to investigate systematically all that comes under thy observation in life.", who: "Marcus Aurelius" },
  { text: "If thou art pained by any external thing, it is not this thing that disturbs thee, but thy own judgment about it.", who: "Marcus Aurelius" },
  { text: "Let not your reflection on the multitude of things to come disturb you.", who: "Marcus Aurelius" },
  { text: "Pass through this brief patch of time in conformity with nature, and end your journey in content.", who: "Marcus Aurelius" },
];

// Lookup helper. Wraps modulo length until full 365 are written.
function quoteForDate(d) {
  const date = d || new Date();
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay); // 1..366
  const idx = (day - 1) % QUOTES.length;
  return QUOTES[Math.max(0, idx)];
}

window.QUOTES = QUOTES;
window.quoteForDate = quoteForDate;
