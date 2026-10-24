/*
 * Notification center: one small floating toast that docks near the viewport
 * edges. It never takes focus on its own, never blocks the page, and steers
 * around elements marked [data-toast-avoid] (plus whatever is focused) so it
 * can't sit on top of the inputs the user is typing into.
 */
(function (ns) {
  'use strict';

  var EDGE_GAP = 16;
  var SLOTS = ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'];
  var DEFAULT_OPEN_NOTES = [
    'Just like your relationship, this conversation is unavailable.',
    'Message unavailable. Emotional closure not found.'
  ];

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), Math.max(min, max));
  }

  function slotPoint(slot, w, h, vw, vh) {
    var x = slot.indexOf('left') !== -1 ? EDGE_GAP
      : slot.indexOf('right') !== -1 ? vw - w - EDGE_GAP
      : (vw - w) / 2;
    var y = slot.indexOf('top') === 0 ? EDGE_GAP : vh - h - EDGE_GAP;
    return { x: clamp(x, 0, vw - w), y: clamp(y, 0, vh - h) };
  }

  function overlapArea(a, b) {
    var w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    var h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > 0 && h > 0 ? w * h : 0;
  }

  function createNotificationCenter(options) {
    options = options || {};
    var avoidSelector = options.avoidSelector || '[data-toast-avoid]';
    var getFallbackFocus = options.getFallbackFocus || function () { return null; };

    var root = document.createElement('aside');
    root.className = 'toast';
    root.hidden = true;
    root.setAttribute('aria-label', 'Notification');
    root.innerHTML =
      '<div class="toast__inner">' +
        '<button type="button" class="toast__open">' +
          '<span class="toast__avatar" aria-hidden="true"></span>' +
          '<span class="toast__body">' +
            '<span class="toast__meta"><span class="toast__sender"></span><span class="toast__time">now</span></span>' +
            '<span class="toast__message"></span>' +
            '<span class="toast__note" hidden></span>' +
          '</span>' +
        '</button>' +
        '<button type="button" class="toast__close" aria-label="Dismiss notification"><span aria-hidden="true">×</span></button>' +
      '</div>';

    var inner = root.querySelector('.toast__inner');
    var openBtn = root.querySelector('.toast__open');
    var closeBtn = root.querySelector('.toast__close');
    var avatarEl = root.querySelector('.toast__avatar');
    var senderEl = root.querySelector('.toast__sender');
    var messageEl = root.querySelector('.toast__message');
    var noteEl = root.querySelector('.toast__note');

    var announcer = document.createElement('div');
    announcer.className = 'visually-hidden';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');

    document.body.appendChild(root);
    document.body.appendChild(announcer);

    var current = null;
    var noteIndex = 0;
    var frame = null;
    var leaveTimer = null;
    var dismissTimer = null;
    var remainingMs = 0;
    var timerStartedAt = 0;
    var hovering = false;

    function announce(text) {
      announcer.textContent = '';
      setTimeout(function () { announcer.textContent = text; }, 50);
    }

    function avoidRects(vh) {
      var els = Array.prototype.slice.call(document.querySelectorAll(avoidSelector));
      var active = document.activeElement;
      if (active && active !== document.body && !root.contains(active)) els.push(active);
      return els
        .map(function (el) { return el.getBoundingClientRect(); })
        .filter(function (r) { return r.width && r.height && r.bottom > 0 && r.top < vh; });
    }

    // Prefer the notification's own slot; fall back to whichever edge slot
    // overlaps the protected controls the least.
    function place() {
      frame = null;
      if (!current || root.hidden) return;

      var vw = document.documentElement.clientWidth;
      var vh = window.innerHeight;
      var w = root.offsetWidth;
      var h = root.offsetHeight;
      var rects = avoidRects(vh);
      var candidates = [current.slot].concat(SLOTS.filter(function (s) { return s !== current.slot; }));
      var best = null;

      for (var i = 0; i < candidates.length; i++) {
        var p = slotPoint(candidates[i], w, h, vw, vh);
        var box = { left: p.x, top: p.y, right: p.x + w, bottom: p.y + h };
        var overlap = rects.reduce(function (sum, r) { return sum + overlapArea(box, r); }, 0);
        if (!best || overlap < best.overlap) best = { slot: candidates[i], x: p.x, y: p.y, overlap: overlap };
        if (overlap === 0) break;
      }

      root.style.transform = 'translate3d(' + Math.round(best.x) + 'px,' + Math.round(best.y) + 'px,0)';
      root.dataset.slot = best.slot;
    }

    function schedulePlace() {
      if (frame === null && current) frame = requestAnimationFrame(place);
    }

    function replay(className) {
      inner.classList.remove('is-arriving', 'is-denied');
      void inner.offsetWidth;
      inner.classList.add(className);
    }

    function clearTimers() {
      clearTimeout(dismissTimer);
      clearTimeout(leaveTimer);
      dismissTimer = null;
      remainingMs = 0;
    }

    function resumeTimer() {
      if (!remainingMs || dismissTimer || hovering || root.contains(document.activeElement)) return;
      timerStartedAt = Date.now();
      dismissTimer = setTimeout(hide, remainingMs);
    }

    function pauseTimer() {
      if (!dismissTimer) return;
      clearTimeout(dismissTimer);
      dismissTimer = null;
      remainingMs = Math.max(1500, remainingMs - (Date.now() - timerStartedAt));
    }

    /*
     * notification: {
     *   sender, message, icon, tone ('ex' | 'exchange'), slot,
     *   autoDismissMs?  hide on its own after this long (paused on hover/focus)
     *   openNotes?      lines shown when the user tries to open it
     *   onDismiss?      replaces the default hide when X is pressed
     *   onHidden?       called after it has fully disappeared
     * }
     */
    function show(notification) {
      clearTimers();
      var wasHidden = root.hidden || root.classList.contains('is-leaving');

      current = Object.assign({ slot: 'top-right', tone: 'ex', icon: '', openNotes: DEFAULT_OPEN_NOTES }, notification);
      root.classList.remove('is-leaving');
      root.dataset.tone = current.tone;
      avatarEl.textContent = current.icon;
      senderEl.textContent = current.sender;
      messageEl.textContent = current.message;
      noteEl.textContent = '';
      noteEl.hidden = true;

      if (wasHidden) {
        root.hidden = false;
        root.classList.add('is-instant');
        place();
        void root.offsetWidth;
        root.classList.remove('is-instant');
      } else {
        place();
      }

      replay('is-arriving');
      announce('New notification from ' + current.sender + ': ' + current.message);

      if (current.autoDismissMs) {
        remainingMs = current.autoDismissMs;
        resumeTimer();
      }
    }

    function hide() {
      if (!current) return;
      clearTimers();
      var closing = current;
      current = null;

      if (root.contains(document.activeElement)) {
        var fallback = getFallbackFocus();
        if (fallback) fallback.focus({ preventScroll: true });
      }

      root.classList.add('is-leaving');
      leaveTimer = setTimeout(function () {
        root.hidden = true;
        root.classList.remove('is-leaving');
        if (closing.onHidden) closing.onHidden();
      }, prefersReducedMotion() ? 0 : 220);
    }

    // Keep focus wherever the user already is (e.g. mid-password) when they click the toast.
    root.addEventListener('mousedown', function (event) {
      if (event.target.closest('button')) event.preventDefault();
    });

    openBtn.addEventListener('click', function () {
      if (!current) return;
      var notes = current.openNotes;
      noteEl.textContent = notes[noteIndex++ % notes.length];
      noteEl.hidden = false;
      replay('is-denied');
      announce(noteEl.textContent);
      schedulePlace();
    });

    closeBtn.addEventListener('click', function () {
      if (!current) return;
      if (current.onDismiss) current.onDismiss();
      else hide();
    });

    root.addEventListener('mouseenter', function () { hovering = true; pauseTimer(); });
    root.addEventListener('mouseleave', function () { hovering = false; resumeTimer(); });
    root.addEventListener('focusin', pauseTimer);
    root.addEventListener('focusout', function () { setTimeout(resumeTimer, 0); });

    window.addEventListener('resize', schedulePlace);
    window.addEventListener('scroll', schedulePlace, { passive: true, capture: true });
    document.addEventListener('focusin', schedulePlace);

    return {
      show: show,
      hide: hide,
      isVisible: function () { return !!current; }
    };
  }

  ns.createNotificationCenter = createNotificationCenter;
})(window.TheExchange = window.TheExchange || {});
