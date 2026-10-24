/*
 * Comedic password feedback. These functions only ever receive a length or a
 * match state, never the password itself, so the jokes can't "analyze" it.
 */
(function (ns) {
  'use strict';

  var ROTATE_EVERY = 4; // characters typed within a category before the roast changes

  var ROASTS = {
    short: {
      headline: 'Too short.',
      lines: [
        "Size doesn't matter. That's what they told you, right? 💀",
        "It's okay. Size doesn't matter.",
        'Short, but full of disappointment.',
        'Your password has commitment issues.',
        "Even your password couldn't last."
      ]
    },
    perfect: {
      headline: 'PERFECT SIZE.',
      lines: [
        "Perfect. Wait... is that your ex's birthday?",
        'Suspiciously perfect. Is that their favorite number?',
        "You remembered this password, but you're still remembering their birthday?",
        'Looks strong. Unlike your last relationship.',
        'Did your ex help you come up with that?'
      ]
    },
    long: {
      headline: 'TOO LONG.',
      lines: [
        "Too long. Sadly, you can't relate.",
        'Overcompensating for something?',
        "That's a lot of characters for someone with no character development.",
        'Your password lasted longer than your situationship.',
        'Finally, something in your life with commitment.'
      ]
    }
  };

  var CONFIRM = {
    match: [
      'Wow. Finally something in your life that matches.',
      'Congratulations. Your passwords have better chemistry than your last relationship.'
    ],
    mismatch: [
      'Another failed relationship. Shocking.',
      "Even your passwords don't want to be together."
    ]
  };

  function categorize(length) {
    if (!length) return null;
    if (length < 8) return 'short';
    if (length <= 16) return 'perfect';
    return 'long';
  }

  // Returns a stateful function: length -> { category, headline, line } | null.
  // The first visit to a category opens with its signature line, then rotates.
  function createPasswordRoaster() {
    var visits = { short: 0, perfect: 0, long: 0 };
    var category = null;
    var anchorLength = 0;
    var line = '';

    return function roast(length) {
      var next = categorize(length);
      if (!next) {
        category = null;
        return null;
      }

      var set = ROASTS[next];
      if (next !== category) {
        line = set.lines[visits[next]++ % set.lines.length];
        category = next;
        anchorLength = length;
      } else if (Math.abs(length - anchorLength) >= ROTATE_EVERY) {
        line = set.lines[visits[next]++ % set.lines.length];
        anchorLength = length;
      }

      return { category: next, headline: set.headline, line: line };
    };
  }

  // Returns a stateful function: 'match' | 'mismatch' | null -> line | null.
  // Picks a new line only when the state flips, so it doesn't flicker per keystroke.
  function createConfirmRoaster() {
    var counts = { match: 0, mismatch: 0 };
    var state = null;
    var line = null;

    return function roast(next) {
      if (next !== state) {
        state = next;
        line = next ? CONFIRM[next][counts[next]++ % CONFIRM[next].length] : null;
      }
      return line;
    };
  }

  ns.passwordRoasts = {
    createPasswordRoaster: createPasswordRoaster,
    createConfirmRoaster: createConfirmRoaster
  };
})(window.TheExchange = window.TheExchange || {});
