/* BiblioFlow - Main Data Source */
const BF = (() => {
  'use strict';

  /* ---------- Seeded random helpers ---------- */
  let seed = 20261106;
  const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const pick = arr => arr[Math.floor(rand() * arr.length)];
  const wpick = (items, weights) => {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rand() * total;
    for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  };

  /* Fixed "today" so the demo data always looks consistent */
  const TODAY = new Date(2026, 10, 6, 15, 0, 0);

  /* ---------- Categories ---------- */
  const categories = [
    { name: 'Fiction',        color: '#c8963e', icon: 'bi-feather' },
    { name: 'Fantasy',        color: '#6d597a', icon: 'bi-stars' },
    { name: 'Science & Tech', color: '#2a9d8f', icon: 'bi-cpu' },
    { name: 'Business',       color: '#457b9d', icon: 'bi-briefcase' },
    { name: 'Self-Help',      color: '#e76f51', icon: 'bi-lightbulb' },
    { name: 'Children',       color: '#e9c46a', icon: 'bi-balloon' },
    { name: 'History',        color: '#8b5a3c', icon: 'bi-hourglass-split' },
    { name: 'Education',      color: '#a3b18a', icon: 'bi-mortarboard' }
  ];

  /* ---------- Books ---------- */
  const bookSeeds = [
    ['The Great Gatsby', 'F. Scott Fitzgerald', 0], ['To Kill a Mockingbird', 'Harper Lee', 0],
    ['1984', 'George Orwell', 0], ['Pride and Prejudice', 'Jane Austen', 0],
    ['The Alchemist', 'Paulo Coelho', 0], ['Norwegian Wood', 'Haruki Murakami', 0],
    ['The Hobbit', 'J.R.R. Tolkien', 1], ["Harry Potter and the Philosopher's Stone", 'J.K. Rowling', 1],
    ['A Game of Thrones', 'George R.R. Martin', 1], ['The Name of the Wind', 'Patrick Rothfuss', 1],
    ['Mistborn', 'Brandon Sanderson', 1], ['Eragon', 'Christopher Paolini', 1],
    ['A Brief History of Time', 'Stephen Hawking', 2], ['Clean Code', 'Robert C. Martin', 2],
    ['The Pragmatic Programmer', 'Andrew Hunt', 2], ['Cosmos', 'Carl Sagan', 2],
    ['The Selfish Gene', 'Richard Dawkins', 2], ['Artificial Intelligence: A Modern Approach', 'Stuart Russell', 2],
    ['Zero to One', 'Peter Thiel', 3], ['The Lean Startup', 'Eric Ries', 3],
    ['Good to Great', 'Jim Collins', 3], ['Rich Dad Poor Dad', 'Robert Kiyosaki', 3],
    ['Thinking, Fast and Slow', 'Daniel Kahneman', 3], ['The Intelligent Investor', 'Benjamin Graham', 3],
    ['Atomic Habits', 'James Clear', 4], ['Deep Work', 'Cal Newport', 4],
    ['The 7 Habits of Highly Effective People', 'Stephen Covey', 4], ['Mindset', 'Carol Dweck', 4],
    ['Ikigai', 'Hector Garcia', 4], ["Man's Search for Meaning", 'Viktor Frankl', 4],
    ['The Very Hungry Caterpillar', 'Eric Carle', 5], ["Charlotte's Web", 'E.B. White', 5],
    ['Matilda', 'Roald Dahl', 5], ['The Gruffalo', 'Julia Donaldson', 5],
    ['Where the Wild Things Are', 'Maurice Sendak', 5], ['Fantastic Mr Fox', 'Roald Dahl', 5],
    ['Sapiens', 'Yuval Noah Harari', 6], ['Guns, Germs, and Steel', 'Jared Diamond', 6],
    ['The Silk Roads', 'Peter Frankopan', 6], ["A People's History of the United States", 'Howard Zinn', 6],
    ['SPQR', 'Mary Beard', 6], ['The Diary of a Young Girl', 'Anne Frank', 6],
    ['Make It Stick', 'Peter Brown', 7], ['Pedagogy of the Oppressed', 'Paulo Freire', 7],
    ['Educated', 'Tara Westover', 7], ['The Art of Learning', 'Josh Waitzkin', 7],
    ['Introduction to Algorithms', 'Thomas Cormen', 7], ["Don't Make Me Think", 'Steve Krug', 7]
  ];

  const books = bookSeeds.map((s, i) => {
    const r = rand();
    const stock = r < 0.06 ? 0 : r < 0.22 ? ri(1, 14) : ri(15, 140);
    return {
      id: 'BK' + String(i + 1).padStart(3, '0'),
      title: s[0], author: s[1],
      catIdx: s[2], category: categories[s[2]].name, color: categories[s[2]].color,
      price: ri(20, 115) + 0.9,
      stock,
      rating: Math.round((3.5 + rand() * 1.4) * 10) / 10,
      pages: ri(120, 820),
      isbn: '978-' + ri(100, 999) + '-' + ri(10, 99) + '-' + ri(100000, 999999) + '-' + ri(0, 9),
      pop: 0.2 + Math.pow(rand(), 2) * 1.8,   // popularity weight for order generation
      sold: 0, revenue: 0
    };
  });
  const bookById = Object.fromEntries(books.map(b => [b.id, b]));

  /* ---------- Customers ---------- */
  const states = ['Selangor', 'Kuala Lumpur', 'Johor', 'Penang', 'Perak', 'Sabah', 'Sarawak', 'Melaka', 'Negeri Sembilan', 'Kedah'];
  const stateW = [22, 20, 10, 10, 8, 6, 6, 5, 5, 4];
  const names = ['Aiman Hakim', 'Nur Aisyah', 'Tan Wei Jie', 'Priya Nair', 'Farhan Ismail', 'Siti Zulaikha', 'Daniel Lim', 'Haziq Danial',
    'Wong Mei Ling', 'Arjun Kumar', 'Nadia Rahman', 'Izzat Firdaus', 'Lee Jia Hui', 'Syafiq Azmi', 'Amirah Sofea', 'Kavitha Raj',
    'Hafiz Roslan', 'Chloe Ng', 'Irfan Zakaria', 'Aina Batrisyia', 'Marcus Teo', 'Balqis Hanani', 'Danish Iskandar', 'Lim Shu Ying',
    'Harith Naufal', 'Sharifah Alya', 'Ravi Chandran', 'Nurul Huda', 'Ethan Lau', 'Zara Qistina', 'Faiz Mahmud', 'Tan Xin Yi',
    'Ahmad Syukri', 'Intan Maisarah', 'Jason Chong', 'Aisyah Humaira', 'Kamal Arif', 'Sarah Wong', 'Imran Hashim', 'Elaine Yap'];

  const customers = names.map((n, i) => ({
    id: 'C' + String(i + 1).padStart(3, '0'),
    name: n,
    email: n.toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '.') + '@gmail.com',
    phone: '01' + pick([1, 2, 3, 4, 6, 7, 9]) + '-' + ri(1000000, 9999999),
    state: wpick(states, stateW),
    joined: new Date(TODAY.getTime() - ri(0, 520) * 864e5),
    w: 1 + (i % 7 === 0 ? 3 : 0) + rand() * 2      // ordering frequency weight
  }));
  const customerById = Object.fromEntries(customers.map(c => [c.id, c]));

  /* ---------- Months (Dec 2025 → Nov 2026) ---------- */
  const months = [];
  for (let i = 0; i < 12; i++) {
    const m = (11 + i) % 12, y = 2025 + Math.floor((11 + i) / 12);
    const short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m];
    months.push({ y, m, label: short + " '" + String(y).slice(2) });
  }
  const monthIdx = d => (d.getFullYear() - 2025) * 12 + d.getMonth() - 11;

  /* ---------- Orders ---------- */
  const payments = ['FPX Online Banking', 'Credit / Debit Card', 'E-Wallet', 'Cash on Delivery'];
  const payW = [35, 28, 27, 10];
  const monthW = [1.3, 0.9, 1.0, 1.4, 1.1, 1.0, 1.2, 1.1, 1.0, 1.2, 1.5, 0.3]; // seasonality (holidays, school terms)
  const dayW = [1.0, 0.65, 0.65, 0.7, 0.75, 0.9, 1.0];                          // Sun..Sat (weekends busier)
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  const hourW = [1, 2, 3, 3, 3, 4, 3, 3, 4, 5, 7, 8, 8, 5];                      // evening peak
  const monthIds = months.map((_, i) => i);

  const raw = [];
  for (let i = 0; i < 260; i++) {
    const mi = wpick(monthIds, monthW);
    const mm = months[mi];
    const dim = mi === 11 ? 5 : new Date(mm.y, mm.m + 1, 0).getDate();
    let date;
    do { date = new Date(mm.y, mm.m, ri(1, dim)); } while (rand() > dayW[date.getDay()]);
    date.setHours(wpick(hours, hourW), ri(0, 59));

    const daysAgo = (TODAY - date) / 864e5;
    let status;
    if (daysAgo < 90) status = pick(['Pending', 'Processing', 'Shipped', 'Completed']);   // recent orders: mixed statuses
    else status = rand() < 0.07 ? 'Cancelled' : 'Completed';                              // older orders: done

    const n = wpick([1, 2, 3, 4], [5, 3, 1.5, 0.5]);
    const used = new Set(), lines = [];
    while (lines.length < n) {
      const b = wpick(books, books.map(x => x.pop));
      if (used.has(b.id)) continue;
      used.add(b.id);
      lines.push({ bookId: b.id, title: b.title, cat: b.category, qty: wpick([1, 2, 3], [7, 2, 1]), price: b.price });
    }
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const shipping = subtotal >= 100 ? 0 : 8;
    const cust = wpick(customers, customers.map(c => c.w));
    raw.push({
      date, status, lines,
      subtotal: +subtotal.toFixed(2), shipping, total: +(subtotal + shipping).toFixed(2),
      payment: wpick(payments, payW),
      customerId: cust.id, customer: cust.name, email: cust.email, state: cust.state
    });
  }
  raw.sort((a, b) => a.date - b.date);
  raw.forEach((o, i) => { o.id = 'BF-' + (10001 + i); o.units = o.lines.reduce((s, l) => s + l.qty, 0); });
  const orders = raw.slice().sort((a, b) => b.date - a.date);   // newest first

  /* Book sales totals (exclude cancelled) */
  orders.forEach(o => {
    if (o.status === 'Cancelled') return;
    o.lines.forEach(l => { const b = bookById[l.bookId]; b.sold += l.qty; b.revenue += l.qty * l.price; });
  });

  /* ---------- Helpers ---------- */
  const fmtRM = n => 'RM ' + Number(n).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtRM0 = n => 'RM ' + Math.round(n).toLocaleString('en-MY');
  const fmtDate = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtDateTime = d => fmtDate(d) + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** Monthly aggregates (non-cancelled). opts.cat filters by category name. */
  function monthly(opts = {}) {
    const cat = opts.cat && opts.cat !== 'all' ? opts.cat : null;
    const out = months.map(m => ({ label: m.label, revenue: 0, orders: 0, units: 0, cust: new Set() }));
    orders.forEach(o => {
      if (o.status === 'Cancelled') return;
      const lines = cat ? o.lines.filter(l => l.cat === cat) : o.lines;
      if (!lines.length) return;
      const m = out[monthIdx(o.date)];
      m.revenue += cat ? lines.reduce((s, l) => s + l.price * l.qty, 0) : o.total;
      m.orders++;
      m.units += lines.reduce((s, l) => s + l.qty, 0);
      m.cust.add(o.customerId);
    });
    out.forEach(m => { m.aov = m.orders ? m.revenue / m.orders : 0; m.customers = m.cust.size; delete m.cust; });
    return out;
  }

  /** Wrap a title into short lines for the generated SVG covers */
  function wrap(text, max, maxLines) {
    const words = text.split(' '), lines = [];
    let cur = '';
    words.forEach(w => {
      if ((cur + ' ' + w).trim().length <= max) cur = (cur + ' ' + w).trim();
      else { if (cur) lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,2}$/, '…'); }
    return lines;
  }

  /** Generates an SVG book cover (so no PNG/JPG images are needed) */
  let uid = 0;
  function coverSVG(b) {
    const gid = 'cv' + (++uid);
    const hue = (parseInt(b.id.slice(2), 10) * 47) % 360;
    const lines = wrap(b.title, 13, 4);
    const titleSvg = lines.map((t, i) => `<tspan x="64" dy="${i ? 14 : 0}">${esc(t)}</tspan>`).join('');
    const y0 = 62 - (lines.length - 1) * 6;
    const deco = [
      `<circle cx="96" cy="26" r="20" fill="${b.color}" opacity=".35"/><circle cx="96" cy="26" r="11" fill="${b.color}" opacity=".6"/>`,
      `<path d="M0 130c25-20 50-20 75 0s35 14 50 0v40H0z" fill="${b.color}" opacity=".45"/>`,
      `<rect x="14" y="132" width="92" height="3" fill="${b.color}"/><rect x="14" y="139" width="60" height="3" fill="${b.color}" opacity=".6"/>`
    ][b.catIdx % 3];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 170" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Cover of ${esc(b.title)}">
<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},48%,34%)"/><stop offset="1" stop-color="hsl(${(hue + 35) % 360},52%,18%)"/></linearGradient></defs>
<rect width="120" height="170" fill="url(#${gid})"/>${deco}
<rect x="0" y="0" width="7" height="170" fill="#000" opacity=".28"/>
<rect x="14" y="12" width="40" height="3" rx="1.5" fill="${b.color}"/>
<text x="64" y="${y0}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="11.5" fill="#fff8e8">${titleSvg}</text>
<text x="64" y="158" text-anchor="middle" font-family="Arial, sans-serif" font-size="7.5" fill="#f4e3c1" opacity=".9">${esc(b.author.length > 24 ? b.author.slice(0, 23) + '…' : b.author)}</text>
</svg>`;
  }

  const stars = r => {
    let h = '';
    for (let i = 1; i <= 5; i++) h += r >= i ? '<i class="bi bi-star-fill"></i>' : r >= i - 0.5 ? '<i class="bi bi-star-half"></i>' : '<i class="bi bi-star"></i>';
    return `<span class="stars" title="${r} / 5">${h}</span>`;
  };
  const statusBadge = s => `<span class="badge badge-status st-${s}">${s}</span>`;
  const stockInfo = n => n === 0 ? { cls: 'Out', label: 'Out of stock' } : n < 15 ? { cls: 'Low', label: 'Low stock' } : { cls: 'InStock', label: 'In stock' };
  const stockBadge = n => { const s = stockInfo(n); return `<span class="badge badge-status st-${s.cls}">${s.label}</span>`; };
  const payIcon = p => ({ 'FPX Online Banking': 'bi-bank', 'Credit / Debit Card': 'bi-credit-card', 'E-Wallet': 'bi-phone', 'Cash on Delivery': 'bi-cash-coin' }[p] || 'bi-wallet2');
  const catColor = name => (categories.find(c => c.name === name) || {}).color || '#999';

  return {
    TODAY, categories, books, bookById, customers, customerById, orders, months, monthIdx, monthly,
    payments, states, statuses: ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'],
    weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    fmtRM, fmtRM0, fmtDate, fmtDateTime, esc, coverSVG, stars, statusBadge, stockInfo, stockBadge, payIcon, catColor
  };
})();