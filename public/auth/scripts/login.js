/*
 * Login step wiring. Reuses the step switcher, field errors and toasts from
 * signup.js, and sends anyone who already has a session straight to the app.
 */
(function (ns) {
  'use strict';

  var signup = ns.signup;
  var form = document.getElementById('login-form');
  var submitBtn = form.querySelector('.submit');
  var formError = document.getElementById('login-form-error');
  var fields = {
    email: document.getElementById('login-email'),
    password: document.getElementById('login-password')
  };

  function enterApp() {
    location.replace(signup.appUrl);
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? 'Checking your baggage…' : 'Log in';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    formError.hidden = true;

    var email = fields.email.value.trim();
    var password = fields.password.value;
    signup.setError(fields.email, email ? '' : 'Enter your email. You did give it to us.');
    signup.setError(fields.password, password ? '' : 'Enter your password. Closure requires two parties.');
    if (!email) return fields.email.focus();
    if (!password) return fields.password.focus();

    setBusy(true);
    ns.auth.login({ email: email, password: password }).then(function (result) {
      if (result.ok) return enterApp();
      setBusy(false);
      fields.password.value = '';
      formError.textContent = result.error;
      formError.hidden = false;
      fields.password.focus();
    });
  });

  Object.keys(fields).forEach(function (name) {
    fields[name].addEventListener('input', function () { signup.setError(fields[name], ''); });
  });

  document.querySelectorAll('[data-go-step]').forEach(function (button) {
    button.addEventListener('click', function () {
      var step = button.dataset.goStep;
      signup.goToStep(step);
      history.replaceState(null, '', step === 'login' ? '#login' : '#signup');
      (step === 'login' ? fields.email : document.getElementById('email')).focus();
    });
  });

  // Already logged in? Skip the forms entirely.
  ns.auth.me().then(function (result) {
    if (result.ok) enterApp();
  });
})(window.TheExchange = window.TheExchange || {});
