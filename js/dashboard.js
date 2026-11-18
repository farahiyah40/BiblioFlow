/* BiblioFlow - Dashboard page */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  BFChart.init();
  const $ = BFUI.$;
  const { orders, books, customers, categories } = BF;
  const user = BFAuth.current();

  const valid = orders.filter(o => o.status !== 'Cancelled');
  const mon = BF.monthly();
  const totalRev = valid.reduce((s, o) => s + o.total, 0);
  const lowBooks = books.filter(b => b.stock < 15);
  const pending = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
  const totalStock = books.reduce((s, b) => s + b.stock, 0);

  /* ---------- Welcome banner ---------- */
  const now = new Date(), h = now.getHours();
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  $('todayText').textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  $('welcomeTitle').textContent = `${greet}, ${user.name.split(' ').pop()}!`;
  $('pillPending').textContent = pending;
  $('pillLow').textContent = lowBooks.length;

  /* ---------- KPI cards ---------- */
  BFUI.countUp($('kpiRevenue'), totalRev, BF.fmtRM0);
  BFUI.countUp($('kpiOrders'), valid.length, n => Math.round(n).toLocaleString());
  BFUI.countUp($('kpiBooks'), books.length, n => Math.round(n));
  BFUI.countUp($('kpiCustomers'), customers.length, n => Math.round(n));

  /* Trend = last full month (Oct '26, index 10) vs previous month (Sep '26, index 9) */
  function trend(el, cur, prev) {
    const p = prev ? ((cur - prev) / prev) * 100 : 0, up = p >= 0;
    el.className = 'kpi-trend mt-1 ' + (up ? 'text-success' : 'text-danger');
    el.innerHTML = `<i class="bi bi-arrow-${up ? 'up' : 'down'}-right"></i> ${Math.abs(p).toFixed(1)}% <span class="text-muted fw-normal">Oct vs Sep</span>`;
  }
  trend($('trendRevenue'), mon[10].revenue, mon[9].revenue);
  trend($('trendOrders'), mon[10].orders, mon[9].orders);
  $('trendBooks').textContent = totalStock.toLocaleString() + ' copies in stock';
  const newCust = customers.filter(c => BF.monthIdx(c.joined) >= 10).length;
  $('trendCustomers').textContent = newCust + ' joined since Oct';

  /* Sparklines */
  function spark(id, data, color) {
    BFChart.make(id, {
      type: 'line',
      data: { labels: mon.map(m => m.label), datasets: [{ data, borderColor: color, backgroundColor: BFChart.gradient(id, color, .35, 0, 60), fill: true, tension: .4, borderWidth: 2, pointRadius: 0 }] },
      options: { plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } }, animation: { duration: 1200 } }
    });
  }
  const custGrowth = mon.map((_, i) => customers.filter(c => BF.monthIdx(c.joined) <= i).length);
  spark('sparkRevenue', mon.map(m => m.revenue), '#c8963e');
  spark('sparkOrders', mon.map(m => m.orders), '#2a9d8f');
  spark('sparkBooks', mon.map(m => m.units), '#6d597a');
  spark('sparkCustomers', custGrowth, '#e76f51');

  /* ---------- Revenue & orders combo chart ---------- */
  BFChart.make('chartRevenue', {
    type: 'bar',
    data: {
      labels: mon.map(m => m.label),
      datasets: [
        { type: 'line', label: 'Revenue (RM)', data: mon.map(m => Math.round(m.revenue)), borderColor: '#c8963e', backgroundColor: BFChart.gradient('chartRevenue', '#c8963e', .4, .02, 360), fill: true, tension: .4, borderWidth: 3, pointRadius: 4, pointBackgroundColor: '#fff', pointBorderColor: '#c8963e', pointBorderWidth: 2, yAxisID: 'y', order: 1 },
        { type: 'bar', label: 'Orders', data: mon.map(m => m.orders), backgroundColor: 'rgba(42,157,143,.55)', borderRadius: 8, yAxisID: 'y1', order: 2 }
      ]
    },
    options: {
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top', align: 'end' }, tooltip: { callbacks: { label: c => c.dataset.yAxisID === 'y' ? ' Revenue: ' + BF.fmtRM0(c.parsed.y) : ' Orders: ' + c.parsed.y } } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => BFChart.rmShort(v) } }, y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } }, x: { grid: { display: false } } }
    }
  });

  /* ---------- Revenue by category doughnut ---------- */
  const catRev = categories.map(c => valid.reduce((s, o) => s + o.lines.filter(l => l.cat === c.name).reduce((a, l) => a + l.price * l.qty, 0), 0));
  const catTotal = catRev.reduce((a, b) => a + b, 0);
  BFChart.make('chartCategory', {
    type: 'doughnut',
    data: { labels: categories.map(c => c.name), datasets: [{ data: catRev.map(Math.round), backgroundColor: categories.map(c => c.color), borderWidth: 3, borderColor: BFChart.isDark() ? '#241c16' : '#fff', hoverOffset: 10 }] },
    options: { cutout: '66%', plugins: { legend: { position: 'bottom' }, centerText: { text: BFChart.rmShort(Math.round(catTotal)), sub: 'total sales' }, tooltip: { callbacks: { label: c => ` ${c.label}: ${BF.fmtRM0(c.parsed)} (${(c.parsed / catTotal * 100).toFixed(1)}%)` } } } },
    plugins: [BFChart.centerText]
  });

  /* ---------- Top 6 books ---------- */
  const top = books.slice().sort((a, b) => b.sold - a.sold).slice(0, 6);
  BFChart.make('chartTopBooks', {
    type: 'bar',
    data: { labels: top.map(b => b.title.length > 22 ? b.title.slice(0, 21) + '…' : b.title), datasets: [{ label: 'Units sold', data: top.map(b => b.sold), backgroundColor: top.map(b => b.color), borderRadius: 8 }] },
    options: { indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { title: i => top[i[0].dataIndex].title, label: c => ` ${c.parsed.x} units · ${top[c.dataIndex].category}` } } }, scales: { x: { beginAtZero: true, grid: { display: false } }, y: { grid: { display: false } } } }
  });

  /* ---------- Orders by weekday ---------- */
  const wd = new Array(7).fill(0);
  valid.forEach(o => wd[(o.date.getDay() + 6) % 7]++);
  const wdMax = Math.max(...wd);
  BFChart.make('chartWeekday', {
    type: 'bar',
    data: { labels: BF.weekdays, datasets: [{ label: 'Orders', data: wd, backgroundColor: wd.map(v => v === wdMax ? '#c8963e' : 'rgba(200,150,62,.35)'), borderRadius: 10 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
  });

  /* ---------- Inventory gauge (half doughnut) ---------- */
  const inS = books.filter(b => b.stock >= 15).length, lowS = books.filter(b => b.stock > 0 && b.stock < 15).length, outS = books.filter(b => b.stock === 0).length;
  $('gaugeValue').textContent = Math.round(inS / books.length * 100) + '%';
  BFChart.make('chartGauge', {
    type: 'doughnut',
    data: { labels: ['In stock', 'Low stock', 'Out of stock'], datasets: [{ data: [inS, lowS, outS], backgroundColor: ['#2a9d8f', '#e9c46a', '#e76f51'], borderWidth: 3, borderColor: BFChart.isDark() ? '#241c16' : '#fff' }] },
    options: { rotation: -90, circumference: 180, cutout: '70%', plugins: { legend: { position: 'bottom' } } }
  });

  /* ---------- Recent orders table ---------- */
  $('recentOrders').innerHTML = orders.slice(0, 7).map(o => `
    <tr>
      <td class="fw-semibold">${o.id}</td>
      <td>${BF.esc(o.customer)}</td>
      <td class="d-none d-md-table-cell text-muted small">${BF.fmtDate(o.date)}</td>
      <td class="text-end">${BF.fmtRM(o.total)}</td>
      <td>${BF.statusBadge(o.status)}</td>
    </tr>`).join('');

  /* ---------- Low-stock list ---------- */
  const low = lowBooks.slice().sort((a, b) => a.stock - b.stock).slice(0, 6);
  $('lowStock').innerHTML = low.map(b => {
    const pct = Math.min(100, b.stock / 15 * 100), col = b.stock === 0 ? '#e76f51' : '#e9c46a';
    return `<div class="d-flex align-items-center gap-3 mb-3">
      <div class="cover-sm">${BF.coverSVG(b)}</div>
      <div class="flex-grow-1 min-w-0">
        <div class="d-flex justify-content-between gap-2"><span class="fw-semibold small text-truncate">${BF.esc(b.title)}</span>${BF.stockBadge(b.stock)}</div>
        <div class="small text-muted mb-1">${BF.esc(b.author)} · ${b.stock} left</div>
        <div class="stock-bar"><span style="width:${pct}%;background:${col}"></span></div>
      </div></div>`;
  }).join('');
});