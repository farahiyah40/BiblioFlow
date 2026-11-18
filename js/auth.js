/* auth.js
   Handles login, logout and page access.
   Uses a fixed account without a database. */

(function () {
  'use strict';
  const KEY = 'biblioflow_user';

  /* Hardcoded demo accounts (no database required) */
const USERS = [
  { username: 'farahiyah', password: 'fl@W123', name: 'Nur Farahiyah', role: 'Admin' }
];

  /* Apply saved theme (light / dark) immediately */
  try { document.documentElement.setAttribute('data-bs-theme', localStorage.getItem('bf_theme') || 'light'); } catch (e) { /* storage blocked */ }

  window.BFAuth = {
    /* Shown on the login page as clickable demo hints */
    demo: USERS.map(u => ({ username: u.username, password: u.password, role: u.role })),

    /* Returns the user object on success, otherwise null */
    login(username, password) {
      const found = USERS.find(u => u.username === String(username).trim() && u.password === password);
      if (!found) return null;
      sessionStorage.setItem(KEY, JSON.stringify({ username: found.username, name: found.name, role: found.role, at: Date.now() }));
      return found;
    },
    current() { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; } },
    logout() { sessionStorage.removeItem(KEY); location.href = 'index.html?logout=1'; },
    /* Call at the top of every protected page */
    require() { if (!this.current()) location.replace('index.html?auth=required'); },
    /* Call on the login page: skip login if already signed in */
    redirectIfLoggedIn() { if (this.current()) location.replace('dashboard.html'); }
  };
})();