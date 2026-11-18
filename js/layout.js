/* BiblioFlow - Navbar, footer and UI helpers */
const BFUI = {
  $: id => document.getElementById(id),

  /* Animated number counter */
  countUp(el, target, fmt) {
    if (!el) return;
    const dur = 1200, start = performance.now();
    const step = t => {
      const p = Math.min((t - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  /* Bootstrap pagination builder */
  pager(el, total, per, page, cb) {
    const pages = Math.max(1, Math.ceil(total / per));
    el.innerHTML = '';
    if (pages <= 1) return;
    const mk = (label, p, disabled, active) => {
      const li = document.createElement('li');
      li.className = 'page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
      li.innerHTML = `<a class="page-link" href="#">${label}</a>`;
      li.firstChild.addEventListener('click', e => { e.preventDefault(); if (!disabled && p !== page) cb(p); });
      return li;
    };
    el.appendChild(mk('&laquo;', page - 1, page === 1));
    for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) el.appendChild(mk(p, p, false, p === page));
    el.appendChild(mk('&raquo;', page + 1, page === pages));
  },

  emptyState(msg) {
    return `<div class="empty-state"><img src="assets/empty.svg" alt="No results"><p class="mt-2 mb-0">${msg}</p></div>`;
  },

  /* Small pop-up message at the bottom of the screen (Bootstrap toast) */
  toast(msg, icon = 'bi-check-circle-fill', color = '#2a9d8f') {
    let box = document.getElementById('toastBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toastBox';
      box.className = 'toast-container position-fixed bottom-0 start-50 translate-middle-x p-3';
      document.body.appendChild(box);
    }
    const el = document.createElement('div');
    el.className = 'toast align-items-center border-0';
    el.setAttribute('role', 'status');
    el.style.cssText = `background:var(--bf-card);color:var(--bf-ink);box-shadow:inset 4px 0 0 ${color}, 0 10px 30px rgba(0,0,0,.2);`;
    el.innerHTML = `<div class="d-flex"><div class="toast-body d-flex align-items-center gap-2"><i class="bi ${icon}" style="color:${color}"></i><span>${msg}</span></div>
      <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
    box.appendChild(el);
    el.addEventListener('hidden.bs.toast', () => el.remove());
    new bootstrap.Toast(el, { delay: 3000 }).show();
  }
};

(function buildLayout() {
  'use strict';
  const page = document.body.dataset.page;
  const user = BFAuth.current() || { name: 'Guest', role: '' };
  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const dark = document.documentElement.getAttribute('data-bs-theme') === 'dark';

  const links = [
    ['dashboard', 'Dashboard', 'bi-speedometer2'],
    ['books', 'Books', 'bi-book'],
    ['orders', 'Orders', 'bi-bag-check'],
    ['analytics', 'Analytics', 'bi-graph-up-arrow']
  ];

  /* ---------- Notifications (built from the store data) ---------- */
  const ago = d => {
    const m = Math.round((BF.TODAY - d) / 6e4);
    if (m < 60) return m + ' min ago';
    const h = Math.round(m / 60);
    if (h < 24) return h + ' hr ago';
    const days = Math.round(h / 24);
    return days + (days === 1 ? ' day ago' : ' days ago');
  };
  const notes = [];

  /* 1. New customer orders (latest pending ones) */
  BF.orders.filter(o => o.status === 'Pending').sort((a, b) => b.date - a.date).slice(0, 3).forEach(o =>
    notes.push({ icon: 'bi-bag-plus-fill', color: '#2a9d8f', title: 'New order ' + o.id, text: `${BF.esc(o.customer)} ordered ${o.units} item(s) &middot; ${BF.fmtRM(o.total)}`, time: ago(o.date), link: 'orders.html' }));

  /* 2. Orders waiting to be handled */
  const waiting = BF.orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
  notes.push({ icon: 'bi-hourglass-split', color: '#e9a23b', title: waiting + ' orders need attention', text: 'Pending and processing orders to handle', time: 'Today', link: 'orders.html' });

  /* 3. Stock warnings */
  const outBooks = BF.books.filter(b => b.stock === 0).length;
  const lowBooks = BF.books.filter(b => b.stock > 0 && b.stock < 15).length;
  if (outBooks) notes.push({ icon: 'bi-x-octagon-fill', color: '#e76f51', title: outBooks + ' books out of stock', text: 'Restock these titles as soon as possible', time: 'Today', link: 'books.html' });
  notes.push({ icon: 'bi-exclamation-triangle-fill', color: '#e9a23b', title: lowBooks + ' books low on stock', text: 'Fewer than 15 copies left', time: 'Today', link: 'books.html' });

  /* 4. New stock received (sample deliveries) */
  BF.books.filter(b => b.stock >= 60).slice(0, 2).forEach((b, i) =>
    notes.push({ icon: 'bi-box-seam-fill', color: '#457b9d', title: 'New stock received', text: `${BF.esc(b.title)} &middot; +${i ? 30 : 50} copies`, time: i ? '3 days ago' : '1 day ago', link: 'books.html' }));

  let notifSeen = false;
  try { notifSeen = sessionStorage.getItem('bf_notif_seen') === '1'; } catch (e) { /* ignore */ }

  /* ---------- Navbar ---------- */
  const nav = BFUI.$('app-navbar');
  if (nav) {
    /* Small number badges beside Orders and Books in the sidebar */
    const sideBadge = {
      orders: BF.orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length,
      books: BF.books.filter(b => b.stock < 15).length
    };
    const current = links.find(l => l[0] === page) || links[0];
    let stView = 'table';
    try { stView = localStorage.getItem('bf_view') || 'table'; } catch (e) { /* ignore */ }
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    nav.innerHTML = `
<!-- Sidebar (left menu). On phones it slides in from the left. -->
<aside class="bf-sidebar" id="sidebar" aria-label="Main navigation">
  <a class="bf-side-brand" href="dashboard.html">
    <img src="assets/logo.svg" alt="BiblioFlow logo">
    <span><span class="name">Biblio<span class="brand-flow">Flow</span></span><small>Bookstore Management</small></span>
  </a>
  <div class="bf-side-label">Menu</div>
  <nav class="bf-side-nav">
    ${links.map(l => `<a class="bf-side-link ${page === l[0] ? 'active' : ''}" ${page === l[0] ? 'aria-current="page"' : ''} href="${l[0]}.html">
      <i class="bi ${l[2]}"></i><span>${l[1]}</span>${sideBadge[l[0]] ? `<span class="side-count">${sideBadge[l[0]]}</span>` : ''}</a>`).join('')}
    <!-- Settings: opens and closes like a drawer -->
    <button class="bf-side-link w-100 border-0 bg-transparent bf-side-toggle collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#settingsMenu" aria-expanded="false" aria-controls="settingsMenu">
      <i class="bi bi-gear"></i><span>Settings</span><i class="bi bi-chevron-down ms-auto chev"></i>
    </button>
    <div class="collapse" id="settingsMenu">
      <a class="bf-side-sub" href="#" data-settings="profile"><i class="bi bi-person-circle"></i>Account</a>
      <a class="bf-side-sub" href="#" data-settings="prefs"><i class="bi bi-sliders"></i>Preferences</a>
      <a class="bf-side-sub" href="#" data-reset="1"><i class="bi bi-arrow-counterclockwise"></i>Reset Data</a>
    </div>
  </nav>
  <div class="bf-side-foot">
    <button class="bf-side-link w-100 border-0 bg-transparent js-logout" type="button"><i class="bi bi-box-arrow-left"></i><span>Log out</span></button>
  </div>
</aside>
<div class="bf-backdrop" id="sideBackdrop"></div>

<!-- Top bar: menu button (phone), page title, full screen, theme, notifications, user -->
<header class="bf-topbar">
  <button class="bf-menu-btn d-lg-none" id="sideToggle" type="button" aria-label="Open menu" aria-controls="sidebar"><i class="bi bi-list"></i></button>
  <a class="d-lg-none d-flex align-items-center gap-2 text-decoration-none" href="dashboard.html"><img src="assets/logo.svg" alt="" width="30" height="30"><strong class="font-display d-none d-sm-inline" style="color:var(--bf-ink)">BiblioFlow</strong></a>
  <div class="d-none d-lg-block lh-sm">
    <div class="font-display fs-5 fw-bold" style="color:var(--bf-ink)"><i class="bi ${current[2]} me-2 text-gold"></i>${current[1]}</div>
    <small class="text-muted">${today}</small>
  </div>
  <div class="ms-auto d-flex align-items-center gap-2">
    <button class="icon-btn d-none d-sm-inline-flex" id="resetBtn" type="button" aria-label="Reset demo data" title="Reset demo data"><i class="bi bi-arrow-counterclockwise"></i></button>
    <button class="icon-btn" id="fullBtn" type="button" aria-label="Toggle full screen" title="Full screen"><i class="bi bi-arrows-fullscreen"></i></button>
    <button class="icon-btn" id="themeBtn" type="button" aria-label="Toggle dark mode" title="Toggle dark mode"><i class="bi ${dark ? 'bi-sun' : 'bi-moon-stars'}"></i></button>
    <div class="dropdown">
      <button class="icon-btn position-relative" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Notifications" title="Notifications">
        <i class="bi bi-bell"></i>
        ${!notifSeen ? `<span id="notifBadge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size:.6rem">${notes.length}</span>` : ''}
      </button>
      <ul class="dropdown-menu dropdown-menu-end shadow p-0 bf-notif-menu">
        <li><h6 class="dropdown-header py-2 border-bottom">Notifications <span class="badge bg-danger rounded-pill ms-1">${notes.length}</span></h6></li>
        ${notes.map(n => `<li><a class="dropdown-item d-flex gap-2 py-2 text-wrap border-bottom" href="${n.link}">
          <i class="bi ${n.icon} fs-5" style="color:${n.color}"></i>
          <span class="min-w-0"><span class="d-block fw-semibold small">${n.title}</span><span class="d-block small text-muted">${n.text}</span><span class="d-block text-muted" style="font-size:.72rem">${n.time}</span></span></a></li>`).join('')}
      </ul>
    </div>
    <div class="dropdown">
      <button class="btn p-0 d-flex align-items-center gap-2 border-0" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Account menu">
        <span class="avatar">${initials}</span>
        <span class="text-start lh-sm d-none d-sm-block"><small class="d-block fw-semibold" style="color:var(--bf-ink)">${BF.esc(user.name)}</small><small class="text-muted">${BF.esc(user.role)}</small></span>
        <i class="bi bi-chevron-down small text-muted d-none d-sm-inline"></i>
      </button>
      <ul class="dropdown-menu dropdown-menu-end shadow">
        <li><span class="dropdown-item-text small text-muted">Signed in as <strong>${BF.esc(user.username || '')}</strong></span></li>
        <li><hr class="dropdown-divider"></li>
        <li><button class="dropdown-item text-danger js-logout" type="button"><i class="bi bi-box-arrow-right me-2"></i>Log out</button></li>
      </ul>
    </div>
  </div>
</header>

<!-- Settings modal (Account + Preferences) -->
<div class="modal fade" id="settingsModal" tabindex="-1" aria-labelledby="stTitle" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content" style="border-radius:18px">
      <div class="modal-header border-0 pb-0"><h2 class="modal-title h5" id="stTitle"><i class="bi bi-gear me-2 text-gold"></i>Settings</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
      <div class="modal-body">
        <ul class="nav nav-pills gap-2 mb-3" role="tablist">
          <li class="nav-item"><button class="nav-link active" id="stTabProfile" data-bs-toggle="pill" data-bs-target="#stProfile" type="button" role="tab">Account</button></li>
          <li class="nav-item"><button class="nav-link" id="stTabPrefs" data-bs-toggle="pill" data-bs-target="#stPrefs" type="button" role="tab">Preferences</button></li>
        </ul>
        <div class="tab-content">
          <div class="tab-pane fade show active" id="stProfile" role="tabpanel">
            <div class="d-flex align-items-center gap-3 mb-3">
              <span class="avatar" style="width:56px;height:56px;font-size:1.2rem">${initials}</span>
              <div><div class="fw-semibold">${BF.esc(user.name)}</div><small class="text-muted">${BF.esc(user.role)}</small></div>
            </div>
            <form id="stForm" novalidate>
              <div class="mb-3">
                <label for="stName" class="form-label small mb-1">Display name</label>
                <input id="stName" class="form-control" required maxlength="40" value="${BF.esc(user.name)}">
                <div class="invalid-feedback">Please enter your name.</div>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-6">
                  <label for="stUser" class="form-label small mb-1">Username</label>
                  <input id="stUser" class="form-control" required maxlength="20" pattern="[A-Za-z0-9_.]+" value="${BF.esc(user.username || '')}">
                  <div class="invalid-feedback">Letters, numbers, . or _ only.</div>
                </div>
                <div class="col-6">
                  <label for="stRole" class="form-label small mb-1">Role</label>
                  <input id="stRole" class="form-control" required maxlength="30" value="${BF.esc(user.role)}">
                  <div class="invalid-feedback">Please enter a role.</div>
                </div>
              </div>
              <button type="submit" class="btn btn-gold rounded-pill"><i class="bi bi-check-lg me-1"></i>Save changes</button>
            </form>
          </div>
          <div class="tab-pane fade" id="stPrefs" role="tabpanel">
            <div class="mb-3">
              <div class="form-label small mb-1">Theme</div>
              <div class="d-flex gap-3">
                <div class="form-check"><input class="form-check-input" type="radio" name="stTheme" id="stThemeLight" value="light" ${dark ? '' : 'checked'}><label class="form-check-label" for="stThemeLight"><i class="bi bi-sun me-1"></i>Light</label></div>
                <div class="form-check"><input class="form-check-input" type="radio" name="stTheme" id="stThemeDark" value="dark" ${dark ? 'checked' : ''}><label class="form-check-label" for="stThemeDark"><i class="bi bi-moon-stars me-1"></i>Dark</label></div>
              </div>
            </div>
            <div class="mb-3">
              <div class="form-label small mb-1">Books page view</div>
              <div class="d-flex gap-3">
                <div class="form-check"><input class="form-check-input" type="radio" name="stView" id="stViewTable" value="table" ${stView === 'grid' ? '' : 'checked'}><label class="form-check-label" for="stViewTable"><i class="bi bi-list-ul me-1"></i>Table</label></div>
                <div class="form-check"><input class="form-check-input" type="radio" name="stView" id="stViewGrid" value="grid" ${stView === 'grid' ? 'checked' : ''}><label class="form-check-label" for="stViewGrid"><i class="bi bi-grid-3x3-gap me-1"></i>Grid</label></div>
              </div>
            </div>
            <p class="small text-muted mb-0"><i class="bi bi-info-circle me-1"></i>Preferences are saved in this browser only.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`;

    /* Open / close the sidebar on phones */
    const side = BFUI.$('sidebar'), back = BFUI.$('sideBackdrop');
    const setSide = open => {
      side.classList.toggle('open', open);
      back.classList.toggle('show', open);
    };
    BFUI.$('sideToggle').addEventListener('click', () => setSide(!side.classList.contains('open')));
    back.addEventListener('click', () => setSide(false));
    side.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setSide(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setSide(false); });

    /* Hide the red number once the bell is opened */
    nav.querySelector('[aria-label="Notifications"]').addEventListener('show.bs.dropdown', () => {
      const bd = BFUI.$('notifBadge'); if (bd) bd.remove();
      try { sessionStorage.setItem('bf_notif_seen', '1'); } catch (e) { /* ignore */ }
    });

    /* Settings: open the modal on the chosen tab */
    const stModal = new bootstrap.Modal(BFUI.$('settingsModal'));
    nav.querySelectorAll('[data-settings]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      bootstrap.Tab.getOrCreateInstance(BFUI.$(a.dataset.settings === 'prefs' ? 'stTabPrefs' : 'stTabProfile')).show();
      stModal.show();
    }));

    /* Save name, username and role (kept for this login session only) */
    BFUI.$('stForm').addEventListener('submit', e => {
      e.preventDefault();
      const form = BFUI.$('stForm');
      const name = BFUI.$('stName').value.trim(), username = BFUI.$('stUser').value.trim().toLowerCase(), role = BFUI.$('stRole').value.trim();
      if (!name || !role || !form.checkValidity()) { form.classList.add('was-validated'); return; }
      try {
        sessionStorage.setItem('biblioflow_user', JSON.stringify(Object.assign({}, BFAuth.current(), { name, username, role })));   // same key as auth.js
        sessionStorage.setItem('bf_flash', 'Account updated');
      } catch (err) { /* ignore */ }
      location.reload();   // show the new name everywhere
    });

    /* Preferences are saved straight away */
    nav.querySelectorAll('input[name="stTheme"]').forEach(r => r.addEventListener('change', () => {
      try { localStorage.setItem('bf_theme', r.value); sessionStorage.setItem('bf_flash', 'Theme changed'); } catch (err) { /* ignore */ }
      location.reload();
    }));
    nav.querySelectorAll('input[name="stView"]').forEach(r => r.addEventListener('change', () => {
      try { localStorage.setItem('bf_view', r.value); } catch (err) { /* ignore */ }
      /* If we are on the Books page, switch the view straight away by pressing its Table / Grid button */
      const viewBtn = BFUI.$(r.value === 'grid' ? 'viewGrid' : 'viewTable');
      if (viewBtn) viewBtn.click();
      BFUI.toast(viewBtn ? 'Books page switched to ' + r.value + ' view' : 'Books page will open in ' + r.value + ' view', 'bi-sliders', '#457b9d');
    }));

    /* Reset data: reload the page so the original sample data is built again, and restore the account details */
    const resetData = () => {
      if (!confirm('Reset all demo data?\n\nChanges to orders, books and account details will be undone.')) return;
      const d = BFAuth.demo[0];
      BFAuth.login(d.username, d.password);
      try { sessionStorage.removeItem('bf_notif_seen'); sessionStorage.setItem('bf_flash', 'Demo data restored'); } catch (err) { /* ignore */ }
      location.reload();
    };
    BFUI.$('resetBtn').addEventListener('click', resetData);
    nav.querySelectorAll('[data-reset]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); resetData(); }));

    /* Message left by an action that reloaded the page */
    try {
      const flash = sessionStorage.getItem('bf_flash');
      if (flash) { sessionStorage.removeItem('bf_flash'); BFUI.toast(flash); }
    } catch (err) { /* ignore */ }

    nav.querySelectorAll('.js-logout').forEach(b => b.addEventListener('click', () => BFAuth.logout()));
    BFUI.$('themeBtn').addEventListener('click', () => {
      try { localStorage.setItem('bf_theme', dark ? 'light' : 'dark'); } catch (e) { /* ignore */ }
      location.reload();   // re-draw charts with the new theme colours
    });

    /* Full screen button (laptop and phone browsers that allow it) */
    const fsBtn = BFUI.$('fullBtn'), fsEl = document.documentElement;
    const fsRequest = fsEl.requestFullscreen || fsEl.webkitRequestFullscreen;
    const fsExit = document.exitFullscreen || document.webkitExitFullscreen;
    const fsActive = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (!fsRequest) {
      fsBtn.style.display = 'none';   // e.g. iPhone Safari does not allow full screen
    } else {
      const fsIcon = () => {
        fsBtn.innerHTML = `<i class="bi ${fsActive() ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'}"></i>`;
        try { if (fsActive()) sessionStorage.setItem('bf_full', '1'); else sessionStorage.removeItem('bf_full'); } catch (err) { /* ignore */ }
      };
      fsBtn.addEventListener('click', () => { if (fsActive()) fsExit.call(document); else fsRequest.call(fsEl); });
      document.addEventListener('fullscreenchange', fsIcon);
      document.addEventListener('webkitfullscreenchange', fsIcon);
      /* Browsers leave full screen when a new page opens, so go back in on the next tap */
      try {
        if (sessionStorage.getItem('bf_full') === '1') {
          document.addEventListener('click', () => { if (!fsActive()) fsRequest.call(fsEl); }, { once: true });
        }
      } catch (err) { /* ignore */ }
    }
  }

  /* ---------- Footer ---------- */
  /* Sample policy text (prototype content only) */
  const POLICIES = {
    terms: { title: 'Terms & Conditions', body: '<p>By using BiblioFlow, you agree to the following:</p><ul><li>Use the system for managing books and orders only.</li><li>Keep your login details private.</li><li>Prices and stock may change without notice.</li></ul>' },
    privacy: { title: 'Privacy Policy', body: '<p>We respect your privacy.</p><ul><li>We only keep the information needed to manage orders.</li><li>Your details are never sold or shared with others.</li><li>Your preferences are saved only in your own browser.</li></ul>' },
    shipping: { title: 'Shipping Policy', body: '<p>How we deliver your orders:</p><ul><li>Orders are processed within 1&ndash;2 working days.</li><li>Delivery takes 2&ndash;5 working days in Malaysia.</li><li>Free shipping on larger orders.</li></ul>' },
    cancel: { title: 'Cancellation & Return', body: '<p>Changed your mind? Here is how it works:</p><ul><li>Orders can be cancelled before they are shipped.</li><li>Damaged or wrong items can be returned within 7 days.</li><li>Refunds go back to the original payment method.</li></ul>' }
  };

  const foot = BFUI.$('app-footer');
  if (foot) {
    foot.innerHTML = `
<footer class="bf-footer" role="contentinfo">
  <div class="container-xxl pt-5 pb-3">
    <div class="row g-4">
      <!-- Brand + system name -->
      <div class="col-lg-4">
        <div class="d-flex align-items-center gap-2 mb-3">
          <img src="assets/logo.svg" alt="">
          <div class="lh-1">
            <strong class="font-display fs-4 text-white d-block mb-1">BiblioFlow</strong>
            <span class="text-uppercase fw-semibold" style="font-size:.68rem; letter-spacing:.12em; color:var(--bf-gold-soft);">Online Bookstore Management System</span>
          </div>
        </div>
        <p class="small mb-0">Manage books, orders and sales insights in one smooth flow.</p>
      </div>
      <!-- Quick links -->
      <div class="col-6 col-lg-2">
        <h6>Quick Links</h6>
        <ul class="list-unstyled small mb-0">
          ${links.map(l => `<li class="mb-1"><a href="${l[0]}.html">${l[1]}</a></li>`).join('')}
        </ul>
      </div>
      <!-- System info -->
      <div class="col-6 col-lg-3 order-lg-4">
        <h6>System Info</h6>
        <ul class="list-unstyled small mb-0" style="line-height: 1.8;">
          <li><strong class="text-white">Version:</strong> v1.0</li>
          <li><strong class="text-white">Last updated:</strong> 15 November 2026</li>
          <li><strong class="text-white">Course:</strong> IMS566</li>
        </ul>
      </div>
      <!-- Contact + social -->
      <div class="col-12 col-lg-3 order-lg-3">
        <h6>Contact Us</h6>
        <ul class="list-unstyled small mb-0">
          <li class="mb-1"><i class="bi bi-geo-alt-fill me-2" style="color:var(--bf-gold-soft)"></i>Lot 12, Jalan Buku 1, 40000 Shah Alam, Selangor</li>
          <li class="mb-1"><i class="bi bi-telephone-fill me-2" style="color:var(--bf-gold-soft)"></i>03-1934 6678</li>
          <li class="mb-1"><i class="bi bi-instagram me-2" style="color:var(--bf-gold-soft)"></i>@biblioflow_official</li>
          <li><i class="bi bi-tiktok me-2" style="color:var(--bf-gold-soft)"></i>@biblioflow_official</li>
        </ul>
      </div>
    </div>
    <!-- Policy links (open in a pop-up so the system stays at 5 HTML files) -->
    <nav class="footer-policy mt-4 pt-3 d-flex flex-wrap justify-content-center align-items-center gap-2 gap-md-3 small text-uppercase" aria-label="Policies" style="border-top: 1px solid rgba(255,255,255,.15); letter-spacing: .04em;">
      ${Object.keys(POLICIES).map(k => `<a href="#" data-policy="${k}">${POLICIES[k].title}</a>`).join('<span class="opacity-50" aria-hidden="true">|</span>')}
    </nav>
    <div class="copy mt-3 pt-3 d-flex flex-column flex-md-row justify-content-between gap-1">
      <span>&copy; 2026 BiblioFlow &ndash; Online Bookstore Management System. All rights reserved.</span>
      <span>IMS566 | Individual Assignment</span>
    </div>
  </div>
</footer>
<div class="modal fade" id="policyModal" tabindex="-1" aria-labelledby="policyTitle" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header"><h2 class="modal-title h5" id="policyTitle"></h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
      <div class="modal-body" id="policyBody"></div>
    </div>
  </div>
</div>
<button class="to-top" id="toTop" type="button" aria-label="Back to top"><i class="bi bi-arrow-up"></i></button>`;
    /* Policy pop-ups */
    const policyModal = new bootstrap.Modal(BFUI.$('policyModal'));
    foot.querySelectorAll('[data-policy]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const p = POLICIES[a.dataset.policy];
      BFUI.$('policyTitle').textContent = p.title;
      BFUI.$('policyBody').innerHTML = p.body;
      policyModal.show();
    }));
    const top = BFUI.$('toTop');
    window.addEventListener('scroll', () => top.classList.toggle('show', window.scrollY > 400));
    top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
})();