/* BiblioFlow - Orders page */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  BFChart.init();
  const $ = BFUI.$;
  const { orders, statuses, payments } = BF;
  const PER = 12;
  const state = { q: '', status: 'all', pay: 'all', from: '', to: '', sort: 'date', dir: 'desc', page: 1 };

  /* ---------- Charts ---------- */
  const stCount = statuses.map(s => orders.filter(o => o.status === s).length);
  BFChart.make('chartOrdStatus', {
    type: 'doughnut',
    data: { labels: statuses, datasets: [{ data: stCount, backgroundColor: ['#e9c46a', '#457b9d', '#6d597a', '#2a9d8f', '#e76f51'], borderWidth: 3, borderColor: BFChart.isDark() ? '#241c16' : '#fff', hoverOffset: 8 }] },
    options: { cutout: '64%', plugins: { legend: { position: 'right' }, centerText: { text: orders.length, sub: 'orders' } } },
    plugins: [BFChart.centerText]
  });

  const basket = [1, 2, 3, 4].map(n => orders.filter(o => o.lines.length === n).length);
  BFChart.make('chartBasket', {
    type: 'bar',
    data: { labels: ['1 title', '2 titles', '3 titles', '4 titles'], datasets: [{ label: 'Orders', data: basket, backgroundColor: ['#e9c46a', '#c8963e', '#b9772a', '#8b5a3c'], borderRadius: 10 }] },
    options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.parsed.y} orders (${(c.parsed.y / orders.length * 100).toFixed(0)}%)` } } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } }
  });

  /* ---------- Filter UI ---------- */
  $('fPay').innerHTML = '<option value="all">All methods</option>' + payments.map(p => `<option>${p}</option>`).join('');

  function renderTabs() {
    const tabs = [['all', 'All', orders.length]].concat(statuses.map((s, i) => [s, s, stCount[i]]));
    $('statusTabs').innerHTML = tabs.map(t => `<button type="button" class="btn btn-outline-gold ${state.status === t[0] ? 'active' : ''}" data-status="${t[0]}">${t[1]}<span class="count">${t[2]}</span></button>`).join('');
  }
  $('statusTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-status]');
    if (!b) return;
    state.status = b.dataset.status; state.page = 1; renderTabs(); render();
  });

  /* ---------- Filtering & sorting ---------- */
  function getList() {
    const q = state.q.toLowerCase();
    const from = state.from ? new Date(state.from + 'T00:00:00') : null;
    const to = state.to ? new Date(state.to + 'T23:59:59') : null;
    const list = orders.filter(o =>
      (!q || (o.id + ' ' + o.customer + ' ' + o.email).toLowerCase().includes(q)) &&
      (state.status === 'all' || o.status === state.status) &&
      (state.pay === 'all' || o.payment === state.pay) &&
      (!from || o.date >= from) && (!to || o.date <= to));
    const k = state.sort, d = state.dir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      const av = a[k], bv = b[k];
      if (av instanceof Date) return (av - bv) * d;
      return (typeof av === 'string' ? av.localeCompare(bv, undefined, { numeric: true }) : av - bv) * d;
    });
    return list;
  }

  function render() {
    const list = getList();
    const pages = Math.max(1, Math.ceil(list.length / PER));
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1) * PER, slice = list.slice(start, start + PER);

    $('ordInfo').textContent = list.length ? `Showing ${start + 1}–${start + slice.length} of ${list.length} orders` : 'No orders found';
    $('ordEmpty').innerHTML = list.length ? '' : BFUI.emptyState('No orders match your filters.');
    $('ordBody').innerHTML = slice.map(o => `
      <tr>
        <td class="fw-semibold">${o.id}</td>
        <td><div>${BF.esc(o.customer)}</div><div class="small text-muted">${o.state}</div></td>
        <td class="d-none d-md-table-cell small">${BF.fmtDate(o.date)}<div class="text-muted">${o.date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div></td>
        <td class="d-none d-lg-table-cell text-center">${o.units}</td>
        <td class="text-end fw-semibold">${BF.fmtRM(o.total)}</td>
        <td class="d-none d-lg-table-cell small"><i class="bi ${BF.payIcon(o.payment)} me-1 text-gold"></i>${o.payment}</td>
        <td>${BF.statusBadge(o.status)}</td>
        <td class="text-end"><button class="btn btn-sm btn-outline-gold rounded-pill" data-order="${o.id}" type="button">View</button></td>
      </tr>`).join('');

    /* Sort arrows */
    document.querySelectorAll('th.sortable').forEach(th => {
      const active = th.dataset.sort === state.sort;
      th.querySelector('i').className = 'bi ' + (active ? (state.dir === 'asc' ? 'bi-sort-up' : 'bi-sort-down') : 'bi-arrow-down-up');
      th.classList.toggle('text-gold', active);
    });
    BFUI.pager($('pager'), list.length, PER, state.page, p => { state.page = p; render(); window.scrollTo({ top: $('ordInfo').getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); });
  }

  /* ---------- Events ---------- */
  let timer;
  $('q').addEventListener('input', e => { clearTimeout(timer); timer = setTimeout(() => { state.q = e.target.value.trim(); state.page = 1; render(); }, 200); });
  $('fPay').addEventListener('change', e => { state.pay = e.target.value; state.page = 1; render(); });
  $('fFrom').addEventListener('change', e => { state.from = e.target.value; state.page = 1; render(); });
  $('fTo').addEventListener('change', e => { state.to = e.target.value; state.page = 1; render(); });
  $('btnReset').addEventListener('click', () => {
    Object.assign(state, { q: '', status: 'all', pay: 'all', from: '', to: '', sort: 'date', dir: 'desc', page: 1 });
    $('q').value = ''; $('fPay').value = 'all'; $('fFrom').value = ''; $('fTo').value = '';
    renderTabs(); render();
  });
  document.querySelectorAll('th.sortable').forEach(th => th.addEventListener('click', () => {
    const k = th.dataset.sort;
    if (state.sort === k) state.dir = state.dir === 'asc' ? 'desc' : 'asc'; else { state.sort = k; state.dir = k === 'customer' || k === 'id' || k === 'status' ? 'asc' : 'desc'; }
    state.page = 1; render();
  }));

  /* ---------- CSV export (respects current filters) ---------- */
  $('btnExport').addEventListener('click', () => {
    const rows = [['Order ID', 'Customer', 'Email', 'State', 'Date', 'Units', 'Subtotal (RM)', 'Shipping (RM)', 'Total (RM)', 'Payment', 'Status']];
    getList().forEach(o => rows.push([o.id, o.customer, o.email, o.state, BF.fmtDateTime(o.date), o.units, o.subtotal.toFixed(2), o.shipping.toFixed(2), o.total.toFixed(2), o.payment, o.status]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'biblioflow-orders.csv';
    document.body.appendChild(a); a.click(); a.remove();
  });

  /* ---------- Details modal ---------- */
  const modal = new bootstrap.Modal($('orderModal'));

  /* Button to move an order to the next status (demo only, resets on refresh) */
  const flow = ['Pending', 'Processing', 'Shipped', 'Completed'];
  let openId = null;
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'btn btn-gold rounded-pill me-auto';
  $('btnPrint').parentNode.prepend(nextBtn);

  function updateNextBtn(o) {
    const next = flow[flow.indexOf(o.status) + 1];   // undefined if Completed / Cancelled
    nextBtn.classList.toggle('d-none', !next);
    if (next) nextBtn.innerHTML = `<i class="bi bi-truck me-1"></i>Mark as ${next}`;
  }

  nextBtn.addEventListener('click', () => {
    const o = orders.find(x => x.id === openId);
    if (!o) return;
    o.status = flow[flow.indexOf(o.status) + 1];
    statuses.forEach((s, i) => { stCount[i] = orders.filter(x => x.status === s).length; });
    const ch = Chart.getChart('chartOrdStatus');   // refresh the doughnut
    if (ch) { ch.data.datasets[0].data = stCount; ch.update(); }
        renderTabs(); render(); openOrder(o.id);
    BFUI.toast(`Order ${o.id} marked as ${o.status}`);
  });

  function openOrder(id) {
    const o = orders.find(x => x.id === id);
    if (!o) return;
    openId = id;
    updateNextBtn(o);
    $('omTitle').innerHTML = `Order ${o.id} ${BF.statusBadge(o.status)}`;

    const steps = ['Pending', 'Processing', 'Shipped', 'Completed'], idx = steps.indexOf(o.status);
    const stepper = o.status === 'Cancelled'
      ? `<div class="alert alert-danger d-flex align-items-center gap-2 py-2"><i class="bi bi-x-circle fs-5"></i>This order was cancelled.</div>`
      : `<div class="stepper">${steps.map((s, i) => `<div class="step ${i <= idx ? 'done' : ''}"><div class="dot">${i <= idx ? '<i class="bi bi-check-lg"></i>' : ''}</div>${s}</div>`).join('')}</div>`;

    $('omBody').innerHTML = `
      ${stepper}
      <div class="row g-3 my-1">
        <div class="col-md-6"><div class="bf-card p-3 h-100"><h3 class="h6 text-muted text-uppercase small">Customer</h3>
          <div class="fw-semibold">${BF.esc(o.customer)}</div><div class="small">${BF.esc(o.email)}</div>
          <div class="small text-muted">${BF.customerById[o.customerId].phone} · ${o.state}</div></div></div>
        <div class="col-md-6"><div class="bf-card p-3 h-100"><h3 class="h6 text-muted text-uppercase small">Order info</h3>
          <div class="small"><i class="bi bi-calendar3 me-1"></i>${BF.fmtDateTime(o.date)}</div>
          <div class="small"><i class="bi ${BF.payIcon(o.payment)} me-1"></i>${o.payment}</div>
          <div class="small"><i class="bi bi-box-seam me-1"></i>${o.units} item(s)</div></div></div>
      </div>
      <div class="table-responsive mt-3"><table class="table align-middle">
        <thead><tr><th>Book</th><th class="text-center">Qty</th><th class="text-end">Price</th><th class="text-end">Subtotal</th></tr></thead>
        <tbody>${o.lines.map(l => `<tr>
          <td><div class="d-flex align-items-center gap-2"><div class="cover-sm">${BF.coverSVG(BF.bookById[l.bookId])}</div><div><div class="fw-semibold small">${BF.esc(l.title)}</div><div class="small text-muted">${l.cat}</div></div></div></td>
          <td class="text-center">${l.qty}</td><td class="text-end">${BF.fmtRM(l.price)}</td><td class="text-end">${BF.fmtRM(l.price * l.qty)}</td></tr>`).join('')}</tbody>
      </table></div>
      <div class="ms-auto" style="max-width:280px">
        <div class="d-flex justify-content-between small"><span>Subtotal</span><span>${BF.fmtRM(o.subtotal)}</span></div>
        <div class="d-flex justify-content-between small"><span>Shipping</span><span>${o.shipping ? BF.fmtRM(o.shipping) : '<span class="text-success">Free</span>'}</span></div>
        <hr class="my-2"><div class="d-flex justify-content-between fw-bold"><span>Total</span><span>${BF.fmtRM(o.total)}</span></div>
      </div>`;
    modal.show();
  }
  $('ordBody').addEventListener('click', e => { const b = e.target.closest('[data-order]'); if (b) openOrder(b.dataset.order); });
  $('btnPrint').addEventListener('click', () => window.print());

  renderTabs();
  render();
});