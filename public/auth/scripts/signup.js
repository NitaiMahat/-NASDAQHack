/*
 * Signup page wiring. Each concern lives in its own module:
 *   notifications.js / ex-notifications.js  the ex's toasts
 *   password-rules.js                       real validation + strength
 *   password-roasts.js                      the jokes
 *   auth.js                                 requests to the auth API (server/auth.ts)
 *   login.js                                the login step for returning traders
 * Later onboarding steps can be added as more [data-step] sections.
 */
(function (ns) {
  'use strict';

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var APP_URL = '/';
  var REDIRECT_DELAY_MS = 1500;

  var form = document.getElementById('signup-form');
  var submitBtn = form.querySelector('.submit');
  var formError = document.getElementById('form-error');

  var fields = {
    email: document.getElementById('email'),
    alias: document.getElementById('alias'),
    password: document.getElementById('password'),
    confirm: document.getElementById('confirm')
  };

  var strengthEl = document.getElementById('password-strength');
  var meterEl = strengthEl.querySelector('.meter');
  var strengthLabelEl = strengthEl.querySelector('[data-strength-label]');
  var roastEl = document.getElementById('password-roast');
  var roastHeadlineEl = roastEl.querySelector('.roast__headline');
  var roastLineEl = roastEl.querySelector('.roast__line');
  var requirementsEl = document.getElementById('password-requirements');
  var confirmFeedbackEl = document.getElementById('confirm-feedback');

  var roastPassword = ns.passwordRoasts.createPasswordRoaster();
  var roastConfirm = ns.passwordRoasts.createConfirmRoaster();
  var confirmTouched = false;

  var notifications = ns.createNotificationCenter({
    getFallbackFocus: function () {
      return form.querySelector('input:invalid, input[aria-invalid="true"]') || fields.email;
    }
  });

  // ---------- Steps ----------

  function goToStep(name) {
    document.querySelectorAll('[data-step]').forEach(function (step) {
      step.hidden = step.dataset.step !== name;
    });
  }

  // ---------- Field errors ----------

  function setError(input, message) {
    var errorEl = document.getElementById(input.id + '-error');
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (!errorEl) return;
    errorEl.textContent = message || '';
    errorEl.hidden = !message;
  }

  // ---------- Password ----------

  function renderRequirements(requirements) {
    if (!requirementsEl.children.length) {
      requirements.forEach(function (req) {
        var li = document.createElement('li');
        li.dataset.requirement = req.id;
        li.innerHTML = '<span></span><span class="visually-hidden"></span>';
        li.firstChild.textContent = req.label;
        requirementsEl.appendChild(li);
      });
    }
    requirements.forEach(function (req) {
      var li = requirementsEl.querySelector('[data-requirement="' + req.id + '"]');
      li.classList.toggle('is-met', req.met);
      li.lastChild.textContent = req.met ? ' (met)' : ' (not met)';
    });
  }

  function renderPassword() {
    var result = ns.passwordRules.check(fields.password.value);
    var hasValue = result.length > 0;

    renderRequirements(result.requirements);

    strengthEl.hidden = !hasValue;
    meterEl.dataset.score = String(result.score);
    strengthLabelEl.textContent = result.label;

    var roast = roastPassword(result.length);
    roastEl.hidden = !roast;
    if (roast) {
      roastEl.dataset.category = roast.category;
      roastHeadlineEl.textContent = roast.headline + ' ';
      roastLineEl.textContent = roast.line;
    }

    if (result.valid) setError(fields.password, '');
    renderConfirm();
  }

  // ---------- Confirmation ----------

  function confirmState() {
    var password = fields.password.value;
    var confirm = fields.confirm.value;
    if (!confirm) return null;
    if (confirm === password) return 'match';
    // Don't call it a failed relationship while they're still typing.
    return confirmTouched || confirm.length >= password.length ? 'mismatch' : null;
  }

  function renderConfirm() {
    var state = confirmState();
    var line = roastConfirm(state);
    confirmFeedbackEl.hidden = !line;
    confirmFeedbackEl.textContent = line || '';
    confirmFeedbackEl.dataset.state = state || '';
    fields.confirm.setAttribute('aria-invalid', state === 'mismatch' ? 'true' : 'false');
  }

  // ---------- Show / hide ----------

  document.querySelectorAll('[data-reveal]').forEach(function (button) {
    var input = document.getElementById(button.dataset.reveal);
    var baseLabel = button.getAttribute('aria-label').replace(/^Show /, '');
    button.addEventListener('click', function () {
      var reveal = input.type === 'password';
      input.type = reveal ? 'text' : 'password';
      button.textContent = reveal ? 'Hide' : 'Show';
      button.setAttribute('aria-pressed', String(reveal));
      button.setAttribute('aria-label', (reveal ? 'Hide ' : 'Show ') + baseLabel);
    });
  });

  // ---------- Validation + submit ----------

  function validate() {
    var errors = [];
    var email = fields.email.value.trim();
    var alias = fields.alias.value.trim();

    if (!EMAIL_PATTERN.test(email)) errors.push([fields.email, "Enter a valid email. Even your ex had one of those."]);
    if (alias.length < 2 || alias.length > 24) errors.push([fields.alias, 'Alias must be 2–24 characters.']);
    if (!ns.passwordRules.check(fields.password.value).valid) {
      errors.push([fields.password, "Password doesn't meet the requirements below."]);
    }
    if (fields.confirm.value !== fields.password.value || !fields.confirm.value) {
      errors.push([fields.confirm, null]);
    }

    [fields.email, fields.alias, fields.password].forEach(function (input) { setError(input, ''); });
    errors.forEach(function (entry) { if (entry[1]) setError(entry[0], entry[1]); });

    if (errors.some(function (e) { return e[0] === fields.confirm; })) {
      confirmTouched = true;
      renderConfirm();
      if (!fields.confirm.value) {
        confirmFeedbackEl.hidden = false;
        confirmFeedbackEl.dataset.state = 'mismatch';
        confirmFeedbackEl.textContent = 'Confirm your password. Closure requires two parties.';
        fields.confirm.setAttribute('aria-invalid', 'true');
      }
    }

    return errors;
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? 'Processing your baggage…' : 'Open account';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    formError.hidden = true;

    var errors = validate();
    if (errors.length) {
      errors[0][0].focus();
      return;
    }

    setBusy(true);
    ns.auth.register({
      email: fields.email.value,
      alias: fields.alias.value,
      password: fields.password.value
    }).then(function (result) {
      setBusy(false);
      if (!result.ok) {
        if (result.field) {
          setError(fields[result.field], result.error);
          fields[result.field].focus();
        } else {
          formError.textContent = result.error;
          formError.hidden = false;
        }
        return;
      }

      fields.password.value = '';
      fields.confirm.value = '';
      document.querySelector('[data-done-alias]').textContent = ', ' + result.account.alias;
      goToStep('done');
      document.getElementById('done-title').focus();
      ns.exNotifications.trigger(notifications, 'exJoined');
      setTimeout(function () { location.replace(APP_URL); }, REDIRECT_DELAY_MS);
    });
  });

  fields.password.addEventListener('input', renderPassword);
  fields.confirm.addEventListener('input', renderConfirm);
  fields.confirm.addEventListener('blur', function () {
    if (fields.confirm.value) confirmTouched = true;
    renderConfirm();
  });
  ['email', 'alias'].forEach(function (name) {
    fields[name].addEventListener('input', function () { setError(fields[name], ''); });
  });

  // #login / #signup pick the form; otherwise returning browsers start on login.
  function initialStep() {
    if (location.hash === '#login') return 'login';
    if (location.hash === '#signup') return 'account';
    return ns.auth.hasAccount() ? 'login' : 'account';
  }

  renderPassword();
  goToStep(initialStep());

  // The ex texts you the moment you arrive.
  setTimeout(function () { ns.exNotifications.run(notifications); }, 400);

  ns.signup = { notifications: notifications, goToStep: goToStep, setError: setError, appUrl: APP_URL };
})(window.TheExchange = window.TheExchange || {});
