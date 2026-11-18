/* BiblioFlow - Chart.js settings */
const BFChart = {
  palette: ['#c8963e', '#2a9d8f', '#8b5a3c', '#e76f51', '#6d597a', '#457b9d', '#e9c46a', '#a3b18a', '#d4a5a5', '#264653'],
  registry: {},

  isDark() { return document.documentElement.getAttribute('data-bs-theme') === 'dark'; },
  ink() { return this.isDark() ? '#f1e7da' : '#3f2a1d'; },

  /* Global Chart.js defaults – call once per page */
  init() {
    if (!window.Chart) return;
    const dark = this.isDark();
    Chart.defaults.color = dark ? '#d2c3b0' : '#6b5646';
    Chart.defaults.borderColor = dark ? 'rgba(255,255,255,.08)' : 'rgba(63,42,29,.08)';
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.responsive = true;
    Chart.defaults.animation.duration = 900;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 8;
    Chart.defaults.plugins.tooltip.backgroundColor = '#3f2a1d';
    Chart.defaults.plugins.tooltip.titleColor = '#f4e3c1';
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 10;
  },

  /* Create (or re-create) a chart on <canvas id="id"> */
  make(id, config) {
    const el = document.getElementById(id);
    if (!el) return null;
    if (this.registry[id]) this.registry[id].destroy();
    this.registry[id] = new Chart(el, config);
    return this.registry[id];
  },

  /* Vertical gradient fill for line / area charts */
  gradient(id, color, a1 = 0.45, a0 = 0.02, h = 320) {
    const ctx = document.getElementById(id).getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, this.alpha(color, a1));
    g.addColorStop(1, this.alpha(color, a0));
    return g;
  },

  alpha(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  },

  /* Short RM labels for axes: 12500 -> "RM 12.5k" */
  rmShort(v) { return v >= 1000 ? 'RM ' + (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : 'RM ' + v; },

  /* Plugin: writes text in the middle of a doughnut chart */
  centerText: {
    id: 'centerText',
    afterDraw(chart, args, opts) {
      if (!opts || !opts.text) return;
      const { ctx, chartArea: { left, right, top, bottom } } = chart;
      const cx = (left + right) / 2, cy = (top + bottom) / 2;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = BFChart.ink();
      ctx.font = "700 20px 'Playfair Display', serif";
      ctx.fillText(opts.text, cx, cy - 8);
      ctx.fillStyle = BFChart.isDark() ? '#a89684' : '#8a7767';
      ctx.font = "12px 'Poppins', sans-serif";
      ctx.fillText(opts.sub || '', cx, cy + 14);
      ctx.restore();
    }
  }
};