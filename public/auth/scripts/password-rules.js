/*
 * Real password validation and strength estimation. Nothing in here is a joke,
 * and nothing in here is logged or sent anywhere.
 */
(function (ns) {
  'use strict';

  var MIN_LENGTH = 8;
  var MAX_LENGTH = 128;
  var PASSPHRASE_LENGTH = 16;

  // A tiny sample, not a breach check.
  var COMMON = [
    'password', 'passw0rd', '12345678', '123456789', '1234567890', 'qwerty', 'qwertyuiop',
    'iloveyou', 'letmein', 'welcome', 'admin', 'abc123', '11111111', 'sunshine', 'princess',
    'football', 'baseball', 'dragon', 'monkey', 'trustno1'
  ];

  var STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Strong', 'Very strong'];

  function length(password) {
    return Array.from(password).length;
  }

  function classes(password) {
    return {
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      digit: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password)
    };
  }

  function isCommon(password) {
    var lowered = password.toLowerCase();
    return COMMON.some(function (word) { return lowered === word || lowered.indexOf(word) !== -1 && lowered.length - word.length <= 2; });
  }

  function hasSequence(password) {
    var lowered = password.toLowerCase();
    for (var i = 0; i + 3 <= lowered.length; i++) {
      var a = lowered.charCodeAt(i), b = lowered.charCodeAt(i + 1), c = lowered.charCodeAt(i + 2);
      if ((b - a === 1 && c - b === 1) || (a - b === 1 && b - c === 1)) return true;
    }
    return false;
  }

  function score(password, len, cls) {
    if (!len) return 0;
    var pool = (cls.lower ? 26 : 0) + (cls.upper ? 26 : 0) + (cls.digit ? 10 : 0) + (cls.symbol ? 33 : 0);
    var bits = len * Math.log2(Math.max(pool, 2));
    if (/(.)\1{2,}/.test(password)) bits *= 0.75;
    if (hasSequence(password)) bits *= 0.85;
    if (isCommon(password)) bits = Math.min(bits, 10);

    var s = bits < 28 ? 1 : bits < 40 ? 2 : bits < 60 ? 3 : 4;
    return len < MIN_LENGTH ? 1 : s;
  }

  function check(password) {
    var len = length(password);
    var cls = classes(password);
    var classCount = [cls.lower, cls.upper, cls.digit, cls.symbol].filter(Boolean).length;
    var common = len > 0 && isCommon(password);

    var requirements = [
      { id: 'length', label: 'At least ' + MIN_LENGTH + ' characters', met: len >= MIN_LENGTH },
      {
        id: 'variety',
        label: '3 of: lowercase, uppercase, number, symbol (or ' + PASSPHRASE_LENGTH + '+ characters)',
        met: classCount >= 3 || len >= PASSPHRASE_LENGTH
      },
      { id: 'common', label: 'Not a famously common password', met: len > 0 && !common }
    ];

    var s = score(password, len, cls);
    return {
      length: len,
      requirements: requirements,
      valid: len <= MAX_LENGTH && requirements.every(function (r) { return r.met; }),
      score: s,
      label: STRENGTH_LABELS[s]
    };
  }

  ns.passwordRules = { check: check, MIN_LENGTH: MIN_LENGTH, MAX_LENGTH: MAX_LENGTH };
})(window.TheExchange = window.TheExchange || {});
