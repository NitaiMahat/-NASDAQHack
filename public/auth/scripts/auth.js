/*
 * Talks to the ExChange auth API (server/auth.ts), which stores accounts in
 * data/accounts.json and keeps the session in an HttpOnly cookie. Hashing
 * happens on the server; the password is only ever sent in the request body,
 * never stored or logged here.
 */
(function (ns) {
  'use strict';

  var API = '/api/auth/';
  var HAS_ACCOUNT_KEY = 'exchange-has-account';

  // Resolves to { ok: true, account } or { ok: false, error, field? }.
  function request(action, method, payload) {
    if (location.protocol === 'file:') {
      return Promise.resolve({
        ok: false,
        error: 'The trading floor is closed. Start the app with "npm run dev" and open the URL Vite prints.'
      });
    }

    return fetch(API + action, {
      method: method,
      credentials: 'same-origin',
      headers: payload ? { 'Content-Type': 'application/json' } : {},
      body: payload ? JSON.stringify(payload) : undefined
    })
      .then(function (response) {
        return response.json().then(function (body) {
          if (response.ok) return { ok: true, account: body.account };
          return { ok: false, status: response.status, error: body.error || 'Request failed.', field: body.field };
        });
      })
      .catch(function () {
        return { ok: false, error: "Can't reach the server. It's not you, it's... no, it might be you. Is it running?" };
      });
  }

  function remember(result) {
    if (result.ok) {
      try { localStorage.setItem(HAS_ACCOUNT_KEY, '1'); } catch (e) { /* only picks the default form */ }
    }
    return result;
  }

  function register(details) {
    return request('signup', 'POST', { email: details.email, alias: details.alias, password: details.password }).then(remember);
  }

  function login(details) {
    return request('login', 'POST', { email: details.email, password: details.password }).then(remember);
  }

  function me() {
    return request('me', 'GET');
  }

  function hasAccount() {
    try { return localStorage.getItem(HAS_ACCOUNT_KEY) === '1'; } catch (e) { return false; }
  }

  ns.auth = { register: register, login: login, me: me, hasAccount: hasAccount };
})(window.TheExchange = window.TheExchange || {});
