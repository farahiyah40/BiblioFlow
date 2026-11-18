/* BiblioFlow - Analytics page */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  BFChart.init();
  const $ = BFUI.$;
  const { orders, books, customers, categories, months } = BF;
  const dark = BFChart.isDark();
  const edge = dark ? '#241c16' : '#fff';
  const lineRev = l => l.price * l.qty;

  $('aCat').innerHTML = '<option value="all">All categories</option>' + categories.map(c => `<option>${c.name}</option>`).join('');

  /* Revenue of each category per month (all months) – computed once */
  const catRev = {};
  categories.forEach(c => catRev[c.name] = new Array(12).fill(0));
  orders.forEach(o => { if (o.status !== 'Cancelled') o.lines.forEach(l => { catRev[l.cat][BF.monthIdx(o.date)] += lineRev(l); }); });

  /* Orders (with their matching lines) inside the chosen period + category */
  function rowsFor(cat, from) {
    const out = [];
    orders.forEach(o => {
      const mi = BF.monthIdx(o.date);
      if (mi < from) return;
      const lines = cat === 'all' ? o.lines : o.lines.filter(l => l.cat === cat);
      if (!lines.length) return;
      out.push({ o, mi, lines, rev: cat === 'all' ? o.total : lines.reduce((s, l) => s + lineRev(l), 0) });
    });
    return out;
  }
  const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
  const topOf = obj => Object.entries(obj).sort((a, b) => b[1] - a[1])[0] || ['-', 0];

  function render() {
    const cat = $('aCat').value, n = +$('aRange').value, from = 12 - n;
    const rows = rowsFor(cat, from), valid = rows.filter(r => r.o.status !== 'Cancelled');
    const allValid = rowsFor('all', from).filter(r => r.o.status !== 'Cancelled');
    const labels = months.slice(from).map(m => m.label);
    const mon = BF.monthly({ cat }).slice(from);

    /* ----- KPI strip ----- */
    const rev = sum(valid, r => r.rev), units = sum(valid, r => sum(r.lines, l => l.qty));
    $('aRev').textContent = BF.fmtRM0(rev);
    $('aOrd').textContent = valid.length.toLocaleString();
    $('aAov').textContent = valid.length ? BF.fmtRM(rev / valid.length) : 'RM 0.00';
    $('aUnits').textContent = units.toLocaleString();
    $('aCust').textContent = new Set(valid.map(r => r.o.customerId)).size;

    /* ----- Heatmap data ----- */
    const grid = Array.from({ length: 7 }, () => new Array(7).fill(0));
    valid.forEach(r => { const d = r.o.date; grid[(d.getDay() + 6) % 7][Math.min(6, Math.max(0, Math.floor((d.getHours() - 8) / 2)))]++; });
    const slots = ['8–10', '10–12', '12–14', '14–16', '16–18', '18–20', '20–22'];
    let hMax = 1, hPos = [0, 0];
    grid.forEach((row, i) => row.forEach((v, j) => { if (v > hMax) { hMax = v; hPos = [i, j]; } }));

    /* ----- Insights ----- */
    const byState = {}, byBook = {}, byCat = {};
    valid.forEach(r => {
      byState[r.o.state] = (byState[r.o.state] || 0) + r.rev;
      r.lines.forEach(l => { byBook[l.title] = (byBook[l.title] || 0) + l.qty; });
    });
    allValid.forEach(r => r.lines.forEach(l => { byCat[l.cat] = (byCat[l.cat] || 0) + lineRev(l); }));
    const bestM = mon.reduce((a, b) => (b.revenue > a.revenue ? b : a), mon[0]);
    const freeShip = valid.length ? Math.round(valid.filter(r => r.o.shipping === 0).length / valid.length * 100) : 0;
    const ins = [
      ['bi-trophy', 'Best month', `${bestM.label} · ${BF.fmtRM0(bestM.revenue)}`],
      ['bi-tag', 'Top category', `${topOf(byCat)[0]} · ${BF.fmtRM0(topOf(byCat)[1])}`],
      ['bi-geo-alt', 'Top state', `${topOf(byState)[0]} · ${BF.fmtRM0(topOf(byState)[1])}`],
      ['bi-clock-history', 'Busiest time', `${BF.weekdays[hPos[0]]}, ${slots[hPos[1]]}h · ${hMax} orders`],
      ['bi-book', 'Best-selling title', `${topOf(byBook)[0]} · ${topOf(byBook)[1]} units`],
      ['bi-truck', 'Free-shipping orders', `${freeShip}% reached RM100+`]
    ];
    $('insights').innerHTML = ins.map(i => `<div class="col-12 col-md-6 col-xl-4"><div class="bf-card insight"><span class="ins-icon"><i class="bi ${i[0]}"></i></span><div><h6>${i[1]}</h6><p>${BF.esc(i[2])}</p></div></div></div>`).join('');

    /* 1. Revenue vs orders */
    BFChart.make('cCombo', {
      type: 'bar',
      data: { labels, datasets: [
        { type: 'line', label: 'Revenue (RM)', data: mon.map(m => Math.round(m.revenue)), borderColor: '#c8963e', backgroundColor: BFChart.gradient('cCombo', '#c8963e', .4, .02, 360), fill: true, tension: .4, borderWidth: 3, pointRadius: 4, pointBackgroundColor: '#fff', pointBorderColor: '#c8963e', pointBorderWidth: 2, yAxisID: 'y', order: 1 },
        { type: 'bar', label: 'Orders', data: mon.map(m => m.orders), backgroundColor: 'rgba(42,157,143,.55)', borderRadius: 8, yAxisID: 'y1', order: 2 }] },
      options: { interaction: { mode: 'index', intersect: false }, plugins: { legend: { align: 'end' } }, scales: { y: { beginAtZero: true, ticks: { callback: v => BFChart.rmShort(v) } }, y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } }, x: { grid: { display: false } } } }
    });

    /* 2. Stacked category revenue */
    const shown = categories.filter(c => cat === 'all' || c.name === cat);
    BFChart.make('cStack', {
      type: 'bar',
      data: { labels, datasets: shown.map(c => ({ label: c.name, data: catRev[c.name].slice(from).map(Math.round), backgroundColor: c.color, borderRadius: 3 })) },
      options: { interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' } }, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, ticks: { callback: v => BFChart.rmShort(v) } } } }
    });

    /* 3. Payment doughnut */
    const pay = BF.payments.map(p => valid.filter(r => r.o.payment === p).length);
    BFChart.make('cPay', {
      type: 'doughnut',
      data: { labels: BF.payments, datasets: [{ data: pay, backgroundColor: ['#c8963e', '#2a9d8f', '#6d597a', '#e76f51'], borderWidth: 3, borderColor: edge, hoverOffset: 10 }] },
      options: { cutout: '62%', plugins: { legend: { position: 'bottom' }, centerText: { text: valid.length, sub: 'orders' } } },
      plugins: [BFChart.centerText]
    });

    /* 4. Revenue by state */
    const st = BF.states.map(s => [s, sum(valid.filter(r => r.o.state === s), r => r.rev)]).sort((a, b) => b[1] - a[1]);
    BFChart.make('cState', {
      type: 'bar',
      data: { labels: st.map(x => x[0]), datasets: [{ label: 'Revenue', data: st.map(x => Math.round(x[1])), backgroundColor: st.map((_, i) => BFChart.alpha('#c8963e', 1 - i * 0.07)), borderRadius: 8 }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + BF.fmtRM0(c.parsed.x) } } }, scales: { x: { beginAtZero: true, ticks: { callback: v => BFChart.rmShort(v) } }, y: { grid: { display: false } } } }
    });

    /* 5. Radar: demand vs supply (always all categories) */
    const catUnits = categories.map(c => sum(allValid, r => sum(r.lines.filter(l => l.cat === c.name), l => l.qty)));
    const catStock = categories.map(c => sum(books.filter(b => b.category === c.name), b => b.stock));
    const tU = sum(catUnits, x => x) || 1, tS = sum(catStock, x => x) || 1;
    BFChart.make('cRadar', {
      type: 'radar',
      data: { labels: categories.map(c => c.name), datasets: [
        { label: 'Share of sales %', data: catUnits.map(v => +(v / tU * 100).toFixed(1)), borderColor: '#c8963e', backgroundColor: 'rgba(200,150,62,.25)', pointBackgroundColor: '#c8963e' },
        { label: 'Share of stock %', data: catStock.map(v => +(v / tS * 100).toFixed(1)), borderColor: '#2a9d8f', backgroundColor: 'rgba(42,157,143,.2)', pointBackgroundColor: '#2a9d8f' }] },
      options: { plugins: { legend: { position: 'bottom' } }, scales: { r: { beginAtZero: true, ticks: { backdropColor: 'transparent', callback: v => v + '%' } } } }
    });

    /* 6. Bubble: price vs rating */
    BFChart.make('cBubble', {
      type: 'bubble',
      data: { datasets: shown.map(c => ({ label: c.name, backgroundColor: BFChart.alpha(c.color, .65), borderColor: c.color, data: books.filter(b => b.category === c.name).map(b => ({ x: b.price, y: b.rating, r: Math.max(5, Math.sqrt(b.sold) * 2.2), b })) })) },
      options: { plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => { const b = c.raw.b; return ` ${b.title} · ${BF.fmtRM(b.price)} · ★${b.rating} · ${b.sold} sold`; } } } }, scales: { x: { min: 15, max: 125, title: { display: true, text: 'Price (RM)' }, ticks: { callback: v => 'RM ' + v } }, y: { min: 3.3, max: 5.1, title: { display: true, text: 'Rating' } } } }
    });

    /* 7. Heatmap (HTML grid) */
    let h = '<div></div>' + slots.map(s => `<div class="h-head">${s}h</div>`).join('');
    grid.forEach((row, i) => {
      h += `<div class="h-label">${BF.weekdays[i]}</div>`;
      row.forEach((v, j) => { h += `<div class="h-cell" style="background:rgba(200,150,62,${(0.08 + 0.92 * v / hMax).toFixed(2)})" title="${BF.weekdays[i]} ${slots[j]}h: ${v} orders">${v}</div>`; });
    });
    $('heatmap').style.gridTemplateColumns = '56px repeat(7, 1fr)';
    $('heatmap').innerHTML = h;

    /* 8. Customer growth (fixed 12 months) */
    const base = customers.filter(c => BF.monthIdx(c.joined) < 0).length;
    const newC = months.map((_, i) => customers.filter(c => BF.monthIdx(c.joined) === i).length);
    let run = base;
    const cum = newC.map(v => (run += v));
    BFChart.make('cCust', {
      type: 'bar',
      data: { labels: months.map(m => m.label), datasets: [
        { type: 'line', label: 'Total customers', data: cum, borderColor: '#e76f51', tension: .35, borderWidth: 3, pointRadius: 3, yAxisID: 'y1', order: 1 },
        { type: 'bar', label: 'New customers', data: newC, backgroundColor: 'rgba(109,89,122,.6)', borderRadius: 6, yAxisID: 'y', order: 2 }] },
      options: { plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } }, x: { grid: { display: false }, ticks: { font: { size: 9 } } } } }
    });

    /* 9. Order status polar area (includes cancelled) */
    const stCounts = BF.statuses.map(s => rows.filter(r => r.o.status === s).length);
    BFChart.make('cStatus', {
      type: 'polarArea',
      data: { labels: BF.statuses, datasets: [{ data: stCounts, backgroundColor: ['rgba(233,196,106,.8)', 'rgba(69,123,157,.8)', 'rgba(109,89,122,.8)', 'rgba(42,157,143,.8)', 'rgba(231,111,81,.8)'], borderColor: edge }] },
      options: { plugins: { legend: { position: 'bottom' } }, scales: { r: { ticks: { display: false, backdropColor: 'transparent' } } } }
    });

    /* 10. Average order value */
    BFChart.make('cAov', {
      type: 'line',
      data: { labels, datasets: [{ label: 'Avg order value', data: mon.map(m => +m.aov.toFixed(2)), borderColor: '#457b9d', backgroundColor: BFChart.gradient('cAov', '#457b9d', .35, .02, 300), fill: true, tension: .4, borderWidth: 3, pointRadius: 4, pointBackgroundColor: '#fff', pointBorderColor: '#457b9d', pointBorderWidth: 2 }] },
      options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + BF.fmtRM(c.parsed.y) } } }, scales: { y: { beginAtZero: false, ticks: { callback: v => 'RM ' + v } }, x: { grid: { display: false } } } }
    });

    /* 11. Top authors */
    const byAuthor = {};
    valid.forEach(r => r.lines.forEach(l => { const a = BF.bookById[l.bookId].author; byAuthor[a] = (byAuthor[a] || 0) + lineRev(l); }));
    const au = Object.entries(byAuthor).sort((a, b) => b[1] - a[1]).slice(0, 8);
    BFChart.make('cAuthors', {
      type: 'bar',
      data: { labels: au.map(a => a[0]), datasets: [{ label: 'Revenue', data: au.map(a => Math.round(a[1])), backgroundColor: au.map((_, i) => BFChart.palette[i % BFChart.palette.length]), borderRadius: 8 }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + BF.fmtRM0(c.parsed.x) } } }, scales: { x: { beginAtZero: true, ticks: { callback: v => BFChart.rmShort(v) } }, y: { grid: { display: false } } } }
    });

    /* 12. Inventory value vs revenue */
    BFChart.make('cInv', {
      type: 'bar',
      data: { labels: categories.map(c => c.name), datasets: [
        { label: 'Inventory value', data: categories.map(c => Math.round(sum(books.filter(b => b.category === c.name), b => b.stock * b.price))), backgroundColor: 'rgba(139,90,60,.7)', borderRadius: 6 },
        { label: 'Revenue in period', data: categories.map(c => Math.round(catRev[c.name].slice(from).reduce((a, b) => a + b, 0))), backgroundColor: 'rgba(200,150,62,.85)', borderRadius: 6 }] },
      options: { plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { callback: v => BFChart.rmShort(v) } }, x: { grid: { display: false }, ticks: { maxRotation: 40, minRotation: 0 } } } }
    });
  }

  $('aCat').addEventListener('change', render);
  $('aRange').addEventListener('change', render);
  render();
});