/* BiblioFlow - Books page */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  BFChart.init();
  const $ = BFUI.$;
  const { books, categories, orders } = BF;
  const PER = 12;
  const state = { q: '', cat: 'all', stock: 'all', sort: 'title-asc', view: 'table', page: 1 };
  try { state.view = localStorage.getItem('bf_view') || 'table'; } catch (e) { /* ignore */ }

  /* ---------- Summary + charts ---------- */
  function refreshSummary() {
    $('bkTitles').textContent = books.length;
    $('bkUnits').textContent = books.reduce((s, b) => s + b.stock, 0).toLocaleString();
    $('bkValue').textContent = BF.fmtRM0(books.reduce((s, b) => s + b.stock * b.price, 0));
    $('bkLow').textContent = books.filter(b => b.stock < 15).length;
  }
  refreshSummary();

  BFChart.make('chartStockCat', {
    type: 'bar',
    data: { labels: categories.map(c => c.name), datasets: [{ label: 'Copies in stock', data: categories.map(c => books.filter(b => b.category === c.name).reduce((s, b) => s + b.stock, 0)), backgroundColor: categories.map(c => c.color), borderRadius: 8 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false }, ticks: { maxRotation: 40, minRotation: 0 } } } }
  });

  const bands = [[0, 40], [40, 60], [60, 80], [80, 100], [100, 999]];
  const bandLabels = ['< RM40', 'RM40–59', 'RM60–79', 'RM80–99', 'RM100+'];
  BFChart.make('chartPrice', {
    type: 'bar',
    data: { labels: bandLabels, datasets: [{ label: 'Titles', data: bands.map(([lo, hi]) => books.filter(b => b.price >= lo && b.price < hi).length), backgroundColor: ['#e9c46a', '#c8963e', '#b9772a', '#8b5a3c', '#5a3a26'], borderRadius: 8 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } }
  });

  /* Redraw both charts after the book list changes (restock / add / delete) */
  function refreshCharts() {
    const c1 = Chart.getChart('chartStockCat');
    if (c1) { c1.data.datasets[0].data = categories.map(c => books.filter(b => b.category === c.name).reduce((s, b) => s + b.stock, 0)); c1.update(); }
    const c2 = Chart.getChart('chartPrice');
    if (c2) { c2.data.datasets[0].data = bands.map(([lo, hi]) => books.filter(b => b.price >= lo && b.price < hi).length); c2.update(); }
  }

  /* ---------- Filters ---------- */
  $('fCat').innerHTML = '<option value="all">All categories</option>' + categories.map(c => `<option>${c.name}</option>`).join('');

  function getList() {
    const q = state.q.toLowerCase();
    const list = books.filter(b =>
      (!q || (b.title + ' ' + b.author + ' ' + b.isbn).toLowerCase().includes(q)) &&
      (state.cat === 'all' || b.category === state.cat) &&
      (state.stock === 'all' || (state.stock === 'in' && b.stock >= 15) || (state.stock === 'low' && b.stock > 0 && b.stock < 15) || (state.stock === 'out' && b.stock === 0)));
    const [key, dir] = state.sort.split('-'), d = dir === 'asc' ? 1 : -1;
    list.sort((a, b) => (typeof a[key] === 'string' ? a[key].localeCompare(b[key]) : a[key] - b[key]) * d);
    return list;
  }

  /* ---------- Render ---------- */
  function render() {
    const list = getList();
    const pages = Math.max(1, Math.ceil(list.length / PER));
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1) * PER, slice = list.slice(start, start + PER);

    $('resultInfo').textContent = list.length ? `Showing ${start + 1}–${start + slice.length} of ${list.length} books` : 'No books found';
    $('viewTable').classList.toggle('active', state.view === 'table');
    $('viewGrid').classList.toggle('active', state.view === 'grid');

    if (!list.length) { $('listArea').innerHTML = BFUI.emptyState('No books match your search. Try different keywords or filters.'); }
    else if (state.view === 'table') {
      $('listArea').innerHTML = `<div class="table-responsive"><table class="table table-hover align-middle">
        <thead><tr><th>Book</th><th class="d-none d-lg-table-cell">Category</th><th class="text-end">Price</th><th>Stock</th><th class="d-none d-md-table-cell">Rating</th><th class="d-none d-md-table-cell text-end">Sold</th><th></th></tr></thead>
        <tbody>${slice.map(b => `<tr>
          <td><div class="d-flex align-items-center gap-3"><div class="cover-sm">${BF.coverSVG(b)}</div>
            <div><div class="fw-semibold">${BF.esc(b.title)}</div><div class="small text-muted">${BF.esc(b.author)}</div></div></div></td>
          <td class="d-none d-lg-table-cell"><span class="cat-dot" style="background:${b.color}"></span>${b.category}</td>
          <td class="text-end fw-semibold">${BF.fmtRM(b.price)}</td>
          <td>${BF.stockBadge(b.stock)}<div class="small text-muted mt-1">${b.stock} copies</div></td>
          <td class="d-none d-md-table-cell">${BF.stars(b.rating)} <small class="text-muted">${b.rating}</small></td>
          <td class="d-none d-md-table-cell text-end">${b.sold}</td>
          <td class="text-end"><button class="btn btn-sm btn-outline-gold rounded-pill" data-book="${b.id}" type="button">Details</button></td>
        </tr>`).join('')}</tbody></table></div>`;
    } else {
      $('listArea').innerHTML = `<div class="row g-3">${slice.map(b => `
        <div class="col-6 col-md-4 col-lg-3 col-xl-2"><article class="bf-card book-card hoverable" data-book="${b.id}" tabindex="0" role="button" aria-label="View ${BF.esc(b.title)}">
          <div class="cover-md">${BF.coverSVG(b)}</div>
          <div class="bk-title">${BF.esc(b.title)}</div><div class="bk-author">${BF.esc(b.author)}</div>
          <div class="mt-2">${BF.stars(b.rating)}</div>
          <div class="fw-semibold mt-1">${BF.fmtRM(b.price)}</div>
          <div class="mt-1">${BF.stockBadge(b.stock)}</div>
        </article></div>`).join('')}</div>`;
    }
    BFUI.pager($('pager'), list.length, PER, state.page, p => { state.page = p; render(); window.scrollTo({ top: $('resultInfo').getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' }); });
  }

  /* ---------- Events ---------- */
  let timer;
  $('q').addEventListener('input', e => { clearTimeout(timer); timer = setTimeout(() => { state.q = e.target.value.trim(); state.page = 1; render(); }, 200); });
  $('fCat').addEventListener('change', e => { state.cat = e.target.value; state.page = 1; render(); });
  $('fStock').addEventListener('change', e => { state.stock = e.target.value; state.page = 1; render(); });
  $('fSort').addEventListener('change', e => { state.sort = e.target.value; state.page = 1; render(); });
  const setView = v => { state.view = v; try { localStorage.setItem('bf_view', v); } catch (e) { /* ignore */ } render(); };
  $('viewTable').addEventListener('click', () => setView('table'));
  $('viewGrid').addEventListener('click', () => setView('grid'));

  /* ---------- Details modal ---------- */
  const modalEl = $('bookModal'), modal = new bootstrap.Modal(modalEl);
  let current = null;

  function openBook(id) {
    const b = BF.bookById[id];
    if (!b) return;
    current = b;
    $('bmTitle').textContent = b.title;
    $('bmAuthor').innerHTML = `by <strong>${BF.esc(b.author)}</strong>`;
    $('bmCover').innerHTML = BF.coverSVG(b);
    $('bmMeta').innerHTML = `<span class="badge rounded-pill me-2" style="background:${b.color};color:#2d2018"><i class="bi bi-tag me-1"></i>${b.category}</span>${BF.stars(b.rating)} <small class="text-muted">${b.rating} / 5</small>`;
    const pct = Math.min(100, b.stock / 100 * 100), col = b.stock === 0 ? '#e76f51' : b.stock < 15 ? '#e9c46a' : '#2a9d8f';
    const stat = (label, val) => `<div class="col-6 col-sm-4"><div class="bf-card p-2 px-3"><div class="small text-muted">${label}</div><div class="fw-semibold">${val}</div></div></div>`;
    $('bmStats').innerHTML =
      stat('Price', BF.fmtRM(b.price)) + stat('Units sold', b.sold) + stat('Revenue', BF.fmtRM0(b.revenue)) +
      stat('Pages', b.pages) + stat('ISBN', `<small>${b.isbn}</small>`) + stat('Book ID', b.id) +
      `<div class="col-12"><div class="d-flex justify-content-between small mb-1"><span>Stock level</span><span>${BF.stockBadge(b.stock)} ${b.stock} copies</span></div><div class="stock-bar"><span style="width:${pct}%;background:${col}"></span></div></div>`;
    /* Restock buttons */
    $('bmStats').insertAdjacentHTML('beforeend', `<div class="col-12"><div class="d-flex align-items-center gap-2 flex-wrap"><span class="small text-muted me-1">Restock:</span>${[10, 25, 50].map(n => `<button type="button" class="btn btn-sm btn-outline-gold rounded-pill" data-restock="${n}">+${n}</button>`).join('')}<button type="button" class="btn btn-sm btn-outline-danger rounded-pill ms-auto" data-delete="1"><i class="bi bi-trash me-1"></i>Delete</button></div></div>`);
    modal.show();
  }

  /* Restock: add copies, then refresh the numbers, the stock chart and the list (demo only, resets on refresh) */
  $('bmStats').addEventListener('click', e => {
    const btn = e.target.closest('[data-restock]');
    if (!btn || !current) return;
    const n = +btn.dataset.restock;
    current.stock += n;
    refreshSummary();
    refreshCharts();
    render(); openBook(current.id);
    BFUI.toast(`Restocked +${n} copies of ${BF.esc(current.title)}`, 'bi-box-seam-fill', '#457b9d');
  });

  /* Delete: remove the book from the list after a confirmation (demo only, resets on refresh) */
  $('bmStats').addEventListener('click', e => {
    if (!e.target.closest('[data-delete]') || !current) return;
    if (!confirm(`Delete "${current.title}" from the catalogue?`)) return;
    const removed = current;
    books.splice(books.indexOf(removed), 1);
    delete BF.bookById[removed.id];
    current = null;
    modal.hide();
    refreshSummary(); refreshCharts(); render();
    BFUI.toast(`Deleted: ${BF.esc(removed.title)}`, 'bi-trash-fill', '#e76f51');
  });

  modalEl.addEventListener('shown.bs.modal', () => {
    if (!current) return;
    const per = new Array(12).fill(0);
    orders.forEach(o => { if (o.status === 'Cancelled') return; o.lines.forEach(l => { if (l.bookId === current.id) per[BF.monthIdx(o.date)] += l.qty; }); });
    BFChart.make('chartBookSales', {
      type: 'bar',
      data: { labels: BF.months.map(m => m.label), datasets: [{ label: 'Units', data: per, backgroundColor: current.color, borderRadius: 6 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false }, ticks: { font: { size: 9 } } } } }
    });
  });

  $('listArea').addEventListener('click', e => { const t = e.target.closest('[data-book]'); if (t) openBook(t.dataset.book); });
  $('listArea').addEventListener('keydown', e => { if (e.key === 'Enter') { const t = e.target.closest('[data-book]'); if (t) openBook(t.dataset.book); } });


  /* ---------- Add Book (form in a modal, demo only: resets on refresh) ---------- */
  document.querySelector('.page-head').insertAdjacentHTML('beforeend',
    '<button class="btn btn-gold rounded-pill mt-3" id="btnAddBook" type="button"><i class="bi bi-plus-lg me-1"></i>Add Book</button>');

  document.body.insertAdjacentHTML('beforeend', `
  <div class="modal fade" id="addBookModal" tabindex="-1" aria-labelledby="abTitle" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content" style="border-radius:18px">
        <form id="addBookForm" novalidate>
          <div class="modal-header border-0"><h2 class="modal-title h5" id="abTitle">Add New Book</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-12"><label for="abName" class="form-label small mb-1">Title</label><input id="abName" class="form-control" required maxlength="60" placeholder="e.g. The Midnight Library"><div class="invalid-feedback">Please enter the book title.</div></div>
              <div class="col-12"><label for="abAuthor" class="form-label small mb-1">Author</label><input id="abAuthor" class="form-control" required maxlength="40" placeholder="e.g. Matt Haig"><div class="invalid-feedback">Please enter the author.</div></div>
              <div class="col-12">
                <label class="form-label small mb-1" id="abCatLabel">Category</label>
                <input type="hidden" id="abCat" value="0">
                <div class="cat-chips" id="abCatChips" role="radiogroup" aria-labelledby="abCatLabel">${categories.map((c, i) => `<button type="button" class="cat-chip${i === 0 ? ' active' : ''}" role="radio" aria-checked="${i === 0}" data-cat="${i}"><span class="cat-dot" style="background:${c.color}"></span>${c.name}</button>`).join('')}</div>
              </div>
              <div class="col-6 col-sm-4"><label for="abPrice" class="form-label small mb-1">Price (RM)</label><input id="abPrice" type="number" class="form-control" required min="1" max="999" step="0.01" placeholder="39.90"><div class="invalid-feedback">Enter a price from RM 1.</div></div>
              <div class="col-6 col-sm-4"><label for="abStock" class="form-label small mb-1">Stock (copies)</label><input id="abStock" type="number" class="form-control" required min="0" max="9999" step="1" placeholder="50"><div class="invalid-feedback">Enter 0 or more.</div></div>
              <div class="col-12 col-sm-4"><label for="abPages" class="form-label small mb-1">Pages</label><input id="abPages" type="number" class="form-control" required min="1" max="3000" step="1" placeholder="300"><div class="invalid-feedback">Enter the page count.</div></div>
            </div>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-outline-gold rounded-pill" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-gold rounded-pill"><i class="bi bi-check-lg me-1"></i>Save Book</button>
          </div>
        </form>
      </div>
    </div>
  </div>`);

  const addModal = new bootstrap.Modal($('addBookModal')), addForm = $('addBookForm');

  /* Category chips: pick one category (value kept in the hidden #abCat field) */
  const catChips = $('abCatChips');
  const setCat = i => {
    $('abCat').value = i;
    catChips.querySelectorAll('.cat-chip').forEach(b => {
      const on = +b.dataset.cat === +i;
      b.classList.toggle('active', on);
      b.setAttribute('aria-checked', on);
    });
  };
  catChips.addEventListener('click', e => { const b = e.target.closest('.cat-chip'); if (b) setCat(b.dataset.cat); });

  $('btnAddBook').addEventListener('click', () => { addForm.reset(); setCat(0); addForm.classList.remove('was-validated'); addModal.show(); });

  addForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!addForm.checkValidity()) { addForm.classList.add('was-validated'); return; }

    const ci = +$('abCat').value;
    const nextNo = Math.max(...books.map(b => parseInt(b.id.slice(2), 10))) + 1;
    const book = {
      id: 'BK' + String(nextNo).padStart(3, '0'),
      title: $('abName').value.trim(), author: $('abAuthor').value.trim(),
      catIdx: ci, category: categories[ci].name, color: categories[ci].color,
      price: Math.round(parseFloat($('abPrice').value) * 100) / 100,
      stock: parseInt($('abStock').value, 10),
      rating: 4.0, pages: parseInt($('abPages').value, 10),
      isbn: '978-' + (100 + Math.floor(Math.random() * 900)) + '-' + (10 + Math.floor(Math.random() * 90)) + '-' + (100000 + Math.floor(Math.random() * 900000)) + '-' + Math.floor(Math.random() * 10),
      pop: 1, sold: 0, revenue: 0
    };
    books.push(book);
    BF.bookById[book.id] = book;

    /* Refresh numbers and both charts */
    refreshSummary();
    refreshCharts();

    /* Show the new book straight away by searching for it */
    Object.assign(state, { q: book.title, cat: 'all', stock: 'all', page: 1 });
    $('q').value = book.title; $('fCat').value = 'all'; $('fStock').value = 'all';
    render();
    addModal.hide();
    BFUI.toast(`Book added: ${BF.esc(book.title)}`, 'bi-book-fill', '#2a9d8f');
  });

  render();
});