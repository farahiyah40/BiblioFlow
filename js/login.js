/* BiblioFlow - Login page */
BFAuth.redirectIfLoggedIn();

document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('loginForm'), box = $('loginBox'), alertEl = $('loginAlert');
  let attempts = 0;

  /* Info banners from redirects */
  const params = new URLSearchParams(location.search);
  if (params.get('auth') === 'required') showAlert('info', 'bi-shield-lock', 'Please log in to access that page.');
  if (params.get('logout')) showAlert('success', 'bi-check-circle', 'You have been logged out successfully.');

  function showAlert(type, icon, msg) {
    alertEl.className = `alert alert-${type} d-flex align-items-center gap-2 py-2 small`;
    alertEl.innerHTML = `<i class="bi ${icon} fs-5"></i><div>${msg}</div>`;
  }

  /* Show / hide password */
  $('togglePass').addEventListener('click', () => {
    const p = $('password'), show = p.type === 'password';
    p.type = show ? 'text' : 'password';
    $('togglePass').innerHTML = `<i class="bi ${show ? 'bi-eye-slash' : 'bi-eye'}"></i>`;
  });

  /* Pre-fill the demo account so the tester only needs to press Log In */
  $('username').value = BFAuth.demo[0].username;
  $('password').value = BFAuth.demo[0].password;

  /* Submit */
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }

    const btn = $('loginBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';

    setTimeout(() => {   // small delay to simulate a server request
      const user = BFAuth.login($('username').value, $('password').value);
      if (user) {
        showAlert('success', 'bi-check-circle', `Welcome back, <strong>${BF.esc(user.name)}</strong>! Redirecting...`);
        setTimeout(() => location.replace('dashboard.html'), 700);
      } else {
        attempts++;
        let msg = '<strong>Invalid username or password.</strong> Please try again.';
        if (attempts >= 2) msg += '<br>Hint: refresh the page to restore the demo login, or see the README.';
        showAlert('danger', 'bi-exclamation-triangle', msg);
        $('password').value = '';
        $('password').focus();
        box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Log In';
      }
    }, 650);
  });
});