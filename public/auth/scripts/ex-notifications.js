/*
 * The ex's notification script. Content only: positioning and behavior live
 * in notifications.js.
 */
(function (ns) {
  'use strict';

  var SESSION_KEY = 'the-exchange:ex-sequence-done';

  var EX = { sender: 'Your Ex 💔', icon: 'EX', tone: 'ex' };
  var EXCHANGE = { sender: 'THE EXCHANGE', icon: 'TX', tone: 'exchange' };

  var SEQUENCE = [
    Object.assign({}, EX, { slot: 'top-right', message: 'hey... can we talk?' }),
    Object.assign({}, EX, { slot: 'top-left', message: 'why are you ignoring me 💀' }),
    Object.assign({}, EX, { slot: 'bottom-right', message: "wow okay. you're just like the others." }),
    Object.assign({}, EXCHANGE, {
      slot: 'bottom-left',
      message: 'Your ex has been emotionally quarantined. For now.',
      autoDismissMs: 5000,
      openNotes: ['Quarantine is non-negotiable. Unlike your boundaries.']
    })
  ];

  // One-off notifications for later onboarding phases, e.g. trigger(center, 'exJoined')
  // once signup completion is wired to the real flow.
  var CALLBACKS = {
    exJoined: Object.assign({}, EXCHANGE, {
      slot: 'top-right',
      message: 'BREAKING: Your ex has joined THE EXCHANGE.',
      autoDismissMs: 6000
    })
  };

  function isDone() {
    try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) { return false; }
  }

  function markDone() {
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) { /* session-only anyway */ }
  }

  // Each X press advances the sequence; the final message dismisses for real.
  // Plays once per browser session and never loops.
  function run(center) {
    if (isDone()) return false;
    var index = 0;

    function showStep() {
      var isLast = index === SEQUENCE.length - 1;
      if (isLast) markDone();
      center.show(Object.assign({}, SEQUENCE[index], {
        onDismiss: isLast ? null : function () { index++; showStep(); }
      }));
    }

    showStep();
    return true;
  }

  function trigger(center, name) {
    if (CALLBACKS[name]) center.show(Object.assign({}, CALLBACKS[name]));
  }

  function reset() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* nothing to reset */ }
  }

  ns.exNotifications = { run: run, trigger: trigger, reset: reset, callbacks: CALLBACKS };
})(window.TheExchange = window.TheExchange || {});
